/**
 * Pure DB -> API compiler. Browser-safe: the same function runs in the static build (scripts/emit-static-api.ts)
 * and, later, inside the Scenario Lab service worker with modified inputs (`now`, elapsed/status overrides).
 *
 * Keys are API paths without base and without suffix: `/scoreboard`, `/games/{id}`, `/games/{id}/stats`, ...
 *
 * Override semantics (per game id):
 *  - `statusOverrides[id]` replaces the DB status. `final` reveals the whole log; `scheduled`/`postponed`/`canceled` hide it.
 *  - `elapsedOverrides[id] = n` puts the game in progress at game-second n (status becomes `live` unless a status override
 *    says otherwise). `null` (or absent) means "use the DB value". An elapsed at/after the end of the log means final.
 *  - A live game with no elapsed override sits at its DB `snapshotElapsedSeconds`.
 */
import { z } from 'zod';
import {
  GameDetail as GameDetailSchema,
  GameInsights as GameInsightsSchema,
  GameMedia as GameMediaSchema,
  GamePlays as GamePlaysSchema,
  GamePreview as GamePreviewSchema,
  GameStats as GameStatsSchema,
  ScoreboardResponse as ScoreboardResponseSchema,
  WinProbabilitySeries as WinProbabilitySeriesSchema,
  type GameDetail,
  type GameInsights,
  type GameMedia,
  type GamePlays,
  type GamePreview,
  type GameSide,
  type GameStats,
  type GameSummary,
  type Insight,
  type LiveClock,
  type PlayerRef,
  type ScoreboardResponse,
  type WinProbabilitySeries,
} from './api';
import { clockAtElapsed, REGULATION_SECONDS, wallClockAt } from './clock';
import type { Db } from './db';
import { describePlay, flattenDetails, type NameLookup } from './describe';
import { autoInsights } from './insights';
import { toPlayerRef, toTeamRef } from './refs';
import {
  conferenceStandings,
  previousResults,
  seasonAverages,
  type FinishedGame,
} from './season';
import type {
  Conference,
  GameRecord,
  GameSideRecord,
  GameStatus,
  Person,
  PlayRecord,
  Player,
  Position,
  Team,
} from './schema';
import {
  computeBoxScore,
  emptyTeamStats,
  playsUpTo,
  scoreFromPlays,
  type BoxScore,
  type ScoreState,
} from './stats';
import { winProbabilityByPlay, winProbabilityPoints, type PlayWinProbability } from './win-probability';

export interface BuildApiOptions {
  /** Authoritative "now" (ISO). Defaults to `db.meta.snapshotTime`. */
  now?: string;
  elapsedOverrides?: Record<string, number | null>;
  statusOverrides?: Record<string, GameStatus>;
}

// ---------------------------------------------------------------------------
// Per-game view: what is visible at the effective status/elapsed
// ---------------------------------------------------------------------------

interface GameView {
  game: GameRecord;
  status: GameStatus;
  /** The log is revealed completely (final games). */
  final: boolean;
  started: boolean;
  plays: PlayRecord[];
  score: ScoreState | null;
  clock: LiveClock | null;
  cutoff: number | null;
}

const NOT_STARTED: ReadonlySet<GameStatus> = new Set(['scheduled', 'postponed', 'canceled']);

/** Full-game box scores are expensive-ish and immutable per play log, so they are cached by log identity. */
const boxCache = new WeakMap<readonly PlayRecord[], BoxScore>();
function fullBox(plays: readonly PlayRecord[], homeId: string, awayId: string): BoxScore {
  let box = boxCache.get(plays);
  if (!box) {
    box = computeBoxScore(plays, homeId, awayId);
    boxCache.set(plays, box);
  }
  return box;
}

const POSITION_ORDER: Position[] = ['A', 'M', 'FO', 'SSDM', 'LSM', 'D', 'G'];

function createContext(db: Db, opts: BuildApiOptions) {
  const serverTime = opts.now ?? db.meta.snapshotTime;
  const meta = { serverTime };
  const teams = new Map<string, Team>(db.teams.map((t) => [t.id, t]));
  const players = new Map<string, Player>(db.players.map((p) => [p.id, p]));
  const games = new Map<string, GameRecord>(db.games.map((g) => [g.id, g]));
  const conferences = new Map<string, Conference>(db.conferences.map((c) => [c.id, c]));
  const staff = new Map<string, Person>(db.staff.map((s) => [s.id, s]));
  const names: NameLookup = { players, teams };
  const views = new Map<string, GameView>();
  const series = new Map<string, PlayWinProbability[]>();

  const team = (id: string): Team => {
    const t = teams.get(id);
    if (!t) throw new Error(`Unknown team ${id}`);
    return t;
  };
  const conferenceShortName = (teamId: string) => conferences.get(team(teamId).conferenceId)?.shortName ?? '';
  const playsOf = (id: string): PlayRecord[] => db.plays[id] ?? [];

  function view(game: GameRecord): GameView {
    const cached = views.get(game.id);
    if (cached) return cached;

    const statusOverride = opts.statusOverrides?.[game.id];
    const elapsedOverride = opts.elapsedOverrides?.[game.id];
    const hasElapsedOverride = typeof elapsedOverride === 'number';
    const full = playsOf(game.id);
    const lastElapsed = full[full.length - 1]?.elapsedSeconds ?? 0;

    let status: GameStatus = statusOverride ?? game.status;
    // An elapsed override puts the game in progress (unless it is postponed/canceled or explicitly overridden).
    if (!statusOverride && hasElapsedOverride && status !== 'postponed' && status !== 'canceled') {
      status = status === 'delayed' ? 'delayed' : 'live';
    }

    let plays: PlayRecord[] = [];
    let cutoff: number | null = null;
    if (NOT_STARTED.has(status)) {
      plays = [];
    } else if (status === 'final') {
      plays = full;
    } else {
      cutoff = hasElapsedOverride ? Math.max(0, elapsedOverride) : (game.snapshotElapsedSeconds ?? 0);
      if (status === 'live' && cutoff >= lastElapsed && full.length > 0) {
        status = 'final';
        cutoff = null;
        plays = full;
      } else {
        plays = playsUpTo(full, cutoff);
      }
    }

    const started = !NOT_STARTED.has(status);
    const final = status === 'final';
    const v: GameView = {
      game,
      status,
      final,
      started,
      plays,
      score: started ? scoreFromPlays(plays, game.home.teamId) : null,
      clock: !final && started && cutoff !== null ? clockAtElapsed(cutoff) : null,
      cutoff,
    };
    views.set(game.id, v);
    return v;
  }

  function winSeries(v: GameView): PlayWinProbability[] {
    let s = series.get(v.game.id);
    if (!s) {
      s = winProbabilityByPlay(v.plays, v.game.home.teamId, v.game.pregameWinProbabilityHome ?? 0.5, v.final);
      series.set(v.game.id, s);
    }
    return s;
  }

  const finishedGames = (): FinishedGame[] =>
    db.games.flatMap((g) => {
      const v = view(g);
      return v.final && v.score ? [{ game: g, homeScore: v.score.home, awayScore: v.score.away }] : [];
    });

  const playerRef = (id: string): PlayerRef | null => {
    const p = players.get(id);
    return p ? toPlayerRef(p) : null;
  };
  const refsFor = (ids: Iterable<string>): PlayerRef[] => {
    const out: PlayerRef[] = [];
    for (const id of new Set(ids)) {
      const ref = playerRef(id);
      if (ref) out.push(ref);
    }
    return out.sort((a, b) => a.teamId.localeCompare(b.teamId) || a.jerseyNumber - b.jerseyNumber);
  };

  return { db, meta, serverTime, teams, players, games, conferences, staff, names, team, conferenceShortName, view, winSeries, finishedGames, refsFor, playsOf };
}
type Ctx = ReturnType<typeof createContext>;

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const rankMove = (before: number | null, after: number | null): number | null =>
  before !== null && after !== null ? before - after : null;

function buildSide(ctx: Ctx, v: GameView, record: GameSideRecord, isHome: boolean): GameSide {
  const t = ctx.team(record.teamId);
  const score = v.score ? (isHome ? v.score.home : v.score.away) : null;
  const periodScores = v.score ? (isHome ? v.score.periodScores.home : v.score.periodScores.away) : [];
  const recordNow = { ...record.recordBefore };
  if (v.final && v.score) {
    const won = isHome ? v.score.home > v.score.away : v.score.away > v.score.home;
    if (won) recordNow.wins += 1;
    else recordNow.losses += 1;
  }
  return {
    team: toTeamRef(t),
    score,
    periodScores,
    record: recordNow,
    conferenceShortName: ctx.conferenceShortName(t.id),
    rank: record.rankBefore,
    rpi: record.rpiBefore,
    rankChange: v.final ? rankMove(record.rankBefore, record.rankAfter) : null,
    rpiChange: v.final ? rankMove(record.rpiBefore, record.rpiAfter) : null,
    seed: record.seed,
  };
}

function buildSummary(ctx: Ctx, g: GameRecord): GameSummary {
  const v = ctx.view(g);
  return {
    id: g.id,
    startTime: g.startTime,
    status: v.status,
    clock: v.clock,
    home: buildSide(ctx, v, g.home, true),
    away: buildSide(ctx, v, g.away, false),
    broadcasts: g.broadcasts,
  };
}

function buildScoreboard(ctx: Ctx): ScoreboardResponse {
  const week = ctx.db.meta.currentWeek;
  const games = ctx.db.games
    .filter((g) => g.week === week)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id))
    .map((g) => buildSummary(ctx, g));
  return { data: { season: ctx.db.meta.season, week, games }, meta: ctx.meta };
}

function currentWinProbability(ctx: Ctx, v: GameView): number | null {
  const pregame = v.game.pregameWinProbabilityHome;
  if (!v.started || v.plays.length === 0) return pregame;
  const last = ctx.winSeries(v)[v.plays.length - 1];
  return last ? last.winProbabilityHome : pregame;
}

function buildDetail(ctx: Ctx, g: GameRecord): GameDetail {
  const v = ctx.view(g);
  const last = v.plays[v.plays.length - 1];
  return {
    data: {
      ...buildSummary(ctx, g),
      season: g.season,
      week: g.week,
      gameType: g.gameType,
      label: g.label,
      neutralSite: g.neutralSite,
      attendance: v.started ? g.attendance : null,
      headCoaches: { home: ctx.team(g.home.teamId).headCoach, away: ctx.team(g.away.teamId).headCoach },
      venue: g.venue,
      weather: g.weather,
      isConferenceGame: g.isConferenceGame,
      stakes: g.stakes,
      winProbabilityHome: currentWinProbability(ctx, v),
      lastPlayAt: last ? wallClockAt(g.startTime, last.elapsedSeconds) : null,
    },
    meta: ctx.meta,
  };
}

function buildStats(ctx: Ctx, g: GameRecord): GameStats {
  const v = ctx.view(g);
  const box: BoxScore = v.started
    ? v.final
      ? fullBox(v.plays, g.home.teamId, g.away.teamId)
      : computeBoxScore(v.plays, g.home.teamId, g.away.teamId)
    : { teams: [emptyTeamStats(g.home.teamId), emptyTeamStats(g.away.teamId)], players: [] };
  return {
    data: { teams: box.teams, players: box.players, playerRefs: ctx.refsFor(box.players.map((p) => p.playerId)) },
    meta: ctx.meta,
  };
}

function buildPlays(ctx: Ctx, g: GameRecord): GamePlays {
  const v = ctx.view(g);
  const series = ctx.winSeries(v);
  const ids = new Set<string>();
  const plays = v.plays.map((p, i) => {
    for (const id of [p.playerId, p.assistPlayerId, p.goalieId, p.opponentPlayerId]) if (id) ids.add(id);
    const point = series[i];
    return {
      id: p.id,
      seq: p.seq,
      period: p.period,
      clockSeconds: p.clockSeconds,
      elapsedSeconds: p.elapsedSeconds,
      type: p.type,
      teamId: p.teamId,
      playerId: p.playerId,
      assistPlayerId: p.assistPlayerId,
      goalieId: p.goalieId,
      opponentPlayerId: p.opponentPlayerId,
      description: describePlay(p, ctx.names),
      homeScore: point?.homeScore ?? 0,
      awayScore: point?.awayScore ?? 0,
      winProbabilityHome: point?.winProbabilityHome ?? null,
      details: flattenDetails(p.details),
    };
  });
  return { data: { plays, playerRefs: ctx.refsFor(ids) }, meta: ctx.meta };
}

function buildWinProbability(ctx: Ctx, g: GameRecord): WinProbabilitySeries {
  const v = ctx.view(g);
  const prior = g.pregameWinProbabilityHome ?? 0.5;
  const points = winProbabilityPoints(v.started ? ctx.winSeries(v) : [], prior);
  return { data: { regulationSeconds: REGULATION_SECONDS, points }, meta: ctx.meta };
}

function buildInsights(ctx: Ctx, g: GameRecord): GameInsights {
  const v = ctx.view(g);
  if (!v.started) return { data: { insights: [], playerRefs: [] }, meta: ctx.meta };
  const auto = autoInsights(
    v.plays,
    { gameId: g.id, homeId: g.home.teamId, awayId: g.away.teamId, names: ctx.names },
    v.cutoff,
  );
  const editorial: Insight[] = ctx.db.insights
    .filter((i) => i.gameId === g.id && (v.cutoff === null || i.elapsedSeconds <= v.cutoff))
    .map((i) => {
      const clock = clockAtElapsed(i.elapsedSeconds);
      return {
        id: i.id,
        elapsedSeconds: i.elapsedSeconds,
        period: clock.period,
        clockSeconds: clock.clockSeconds,
        kind: i.kind,
        title: i.title,
        body: i.body,
        teamId: i.teamId,
        playerId: i.playerId,
      };
    });
  const insights = [...auto, ...editorial].sort((a, b) => a.elapsedSeconds - b.elapsedSeconds || a.id.localeCompare(b.id));
  const playerRefs = ctx.refsFor(insights.flatMap((i) => (i.playerId ? [i.playerId] : [])));
  return { data: { insights, playerRefs }, meta: ctx.meta };
}

function buildPreview(ctx: Ctx, g: GameRecord): GamePreview {
  const home = ctx.team(g.home.teamId);
  const away = ctx.team(g.away.teamId);
  const finished = ctx.finishedGames();

  const roster = (teamId: string) =>
    ctx.db.players
      .filter((p) => p.teamId === teamId)
      .sort((a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) || a.jerseyNumber - b.jerseyNumber)
      .map((p) => ({ ...toPlayerRef(p), season: p.season }));

  const averages = (t: Team) => {
    const stats = finished
      .filter((f) => f.game.startTime < g.startTime && (f.game.home.teamId === t.id || f.game.away.teamId === t.id))
      .flatMap((f) => {
        const box = fullBox(ctx.playsOf(f.game.id), f.game.home.teamId, f.game.away.teamId);
        const row = box.teams.find((s) => s.teamId === t.id);
        return row ? [row] : [];
      });
    return seasonAverages(t.id, stats);
  };

  const conferenceIds = home.conferenceId === away.conferenceId ? [home.conferenceId] : [home.conferenceId, away.conferenceId];
  const standings = conferenceIds.flatMap((id) => {
    const conference = ctx.conferences.get(id);
    return conference ? [conferenceStandings(conference, ctx.db.teams, finished)] : [];
  });

  const injuries = ctx.db.injuries
    .flatMap((i) => {
      const p = ctx.players.get(i.playerId);
      return p && (p.teamId === home.id || p.teamId === away.id) ? [{ ...i, player: toPlayerRef(p) }] : [];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.playerId.localeCompare(b.playerId));

  const staffPicks = ctx.db.staffPicks
    .filter((p) => p.gameId === g.id)
    .flatMap((p) => {
      const person = ctx.staff.get(p.staffId);
      return person ? [{ staff: person, pickTeamId: p.pickTeamId }] : [];
    });

  const previous = (t: Team) => previousResults(t, finished, ctx.teams, g.startTime, 3);
  return {
    data: {
      rosters: { home: roster(home.id), away: roster(away.id) },
      injuries,
      seasonAverages: { home: averages(home), away: averages(away) },
      previousResults: { home: previous(home), away: previous(away) },
      standings,
      staffPicks,
    },
    meta: ctx.meta,
  };
}

function buildMedia(ctx: Ctx, g: GameRecord): GameMedia {
  const v = ctx.view(g);
  const live = v.status === 'live' || v.status === 'delayed';
  const videos = ctx.db.videos
    .filter((video) => video.gameId === g.id)
    .filter((video) => {
      if (video.kind === 'highlight') return v.final || live;
      if (video.kind === 'postgame') return v.final;
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const articles = ctx.db.articles
    .filter((a) => a.gameId === g.id && (a.kind !== 'recap' || v.final))
    .flatMap((a) => {
      const author = ctx.staff.get(a.authorId);
      return author ? [{ ...a, author }] : [];
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  return { data: { videos, articles }, meta: ctx.meta };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const GAME_ENDPOINTS = ['stats', 'plays', 'win-probability', 'insights', 'preview', 'media'] as const;
type GameEndpoint = (typeof GAME_ENDPOINTS)[number];

const GAME_PATH = /^\/games\/([^/]+)(?:\/([a-z-]+))?$/;

/** Accepts `/api/v1/games/x/stats.json` as well as `/games/x/stats`. */
export function normalizeApiPath(path: string): string {
  let p = path.split('?')[0] ?? path;
  p = p.replace(/^\/?api\/v1(?=\/)/, '').replace(/\.json$/, '').replace(/\/+$/, '');
  return p.startsWith('/') ? p : `/${p}`;
}

export function createApi(db: Db, opts: BuildApiOptions = {}) {
  const ctx = createContext(db, opts);

  const resolve = (rawPath: string): unknown | undefined => {
    const path = normalizeApiPath(rawPath);
    if (path === '/scoreboard') return buildScoreboard(ctx);
    const match = GAME_PATH.exec(path);
    if (!match) return undefined;
    const game = ctx.games.get(match[1] as string);
    if (!game) return undefined;
    switch (match[2] as GameEndpoint | undefined) {
      case undefined:
        return buildDetail(ctx, game);
      case 'stats':
        return buildStats(ctx, game);
      case 'plays':
        return buildPlays(ctx, game);
      case 'win-probability':
        return buildWinProbability(ctx, game);
      case 'insights':
        return buildInsights(ctx, game);
      case 'preview':
        return buildPreview(ctx, game);
      case 'media':
        return buildMedia(ctx, game);
      default:
        return undefined;
    }
  };

  const paths = (): string[] => [
    '/scoreboard',
    ...db.games.flatMap((g) => [`/games/${g.id}`, ...GAME_ENDPOINTS.map((e) => `/games/${g.id}/${e}`)]),
  ];
  return { resolve, paths };
}

/** Compile the whole API. Every value validates against its schema in api.ts (see `validateApi`). */
export function buildApi(db: Db, opts: BuildApiOptions = {}): Map<string, unknown> {
  const api = createApi(db, opts);
  return new Map(api.paths().map((path) => [path, api.resolve(path)]));
}

/** Single-path convenience for the service worker. Returns `undefined` for unknown paths (-> 404). */
export function resolveApiPath(db: Db, opts: BuildApiOptions, path: string): unknown | undefined {
  return createApi(db, opts).resolve(path);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** The response schema for an API path, or undefined if the path is not part of the contract. */
export function schemaForPath(rawPath: string): z.ZodType | undefined {
  const path = normalizeApiPath(rawPath);
  if (path === '/scoreboard') return ScoreboardResponseSchema;
  const endpoint = GAME_PATH.exec(path)?.[2];
  switch (endpoint) {
    case undefined:
      return GAME_PATH.test(path) ? GameDetailSchema : undefined;
    case 'stats':
      return GameStatsSchema;
    case 'plays':
      return GamePlaysSchema;
    case 'win-probability':
      return WinProbabilitySeriesSchema;
    case 'insights':
      return GameInsightsSchema;
    case 'preview':
      return GamePreviewSchema;
    case 'media':
      return GameMediaSchema;
    default:
      return undefined;
  }
}

/** Validate every value against its zod response schema. Returns human-readable issues ([] = all good). */
export function validateApi(api: ReadonlyMap<string, unknown>): string[] {
  const issues: string[] = [];
  for (const [path, value] of api) {
    const schema = schemaForPath(path);
    if (!schema) {
      issues.push(`${path}: no schema for path`);
      continue;
    }
    const result = schema.safeParse(value);
    if (!result.success) {
      const first = result.error.issues[0];
      issues.push(`${path}: ${first?.path.join('.')} ${first?.message}`);
    }
  }
  return issues;
}
