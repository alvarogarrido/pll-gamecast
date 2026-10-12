/**
 * Season simulation: schedules weeks 1-5, the snapshot Saturday slate and the NCAA quarterfinal, simulates a
 * complete play log for every game, and accumulates records, rankings and player season totals from the finals.
 */
import { elapsedAtWallClock } from '../../src/clock';
import { computeBoxScore, playsUpTo, scoreFromPlays, type BoxScore } from '../../src/derive';
import type {
  Broadcast,
  GameRecord,
  GameSideRecord,
  Injury,
  PlayRecord,
  Player,
  Team,
  Weather,
} from '../../src/schema';
import { logoUrl, NCAA_VENUE, TEAM_SEEDS, type TeamSeed } from './league';
import { createRng, uuid, type Rng } from './rng';
import {
  applyResult,
  cloneStates,
  conferenceRecordOf,
  createStates,
  pregameHomeProbability,
  rankTeams,
  recordOf,
  type Ranking,
  type TeamState,
} from './ratings';
import { generateRoster, toSimPlayer, type GenPlayer } from './roster';
import { GAMES_PER_WEEK, pairKey, SNAPSHOT_SLATE, weeklySlots, type GameSlot, type PlanKind } from './schedule';
import { simulateGame, type SimTeam } from './sim';
import {
  dateForWeek,
  localIso,
  monthOf,
  NCAA_QUARTERFINAL_DATE,
  NCAA_QUARTERFINAL_WEEK,
  SEASON,
  SNAPSHOT_DATE,
  SNAPSHOT_TIME,
  SNAPSHOT_WEEK,
} from './time';

/** Strength -> offense/defense multipliers in the simulator. */
const STRENGTH_TO_MULTIPLIER = 0.023;
const MAX_ATTEMPTS = 800;

export interface GenTeam {
  team: Team;
  seed: TeamSeed;
  roster: GenPlayer[];
  off: number;
  def: number;
}

export interface SeasonOutput {
  teams: Team[];
  players: Player[];
  games: GameRecord[];
  plays: Record<string, PlayRecord[]>;
  injuries: Injury[];
  /** Full-game box score for every game. */
  boxes: Map<string, BoxScore>;
}

// ---------------------------------------------------------------------------
// Teams, rosters, injuries
// ---------------------------------------------------------------------------

function buildTeams(root: Rng): Map<string, GenTeam> {
  const usedNames = new Set<string>();
  return new Map(
    TEAM_SEEDS.map((seed) => {
      const rng = root.fork(`team:${seed.id}`);
      const team: Team = {
        id: seed.id,
        slug: seed.id,
        school: seed.school,
        mascot: seed.mascot,
        abbreviation: seed.abbreviation,
        conferenceId: seed.conferenceId,
        colors: { primary: seed.primary, secondary: seed.secondary },
        logoUrl: logoUrl(seed.espnId),
        record: { wins: 0, losses: 0 },
        conferenceRecord: { wins: 0, losses: 0 },
        nationalRank: null,
        rpi: null,
        headCoach: seed.headCoach,
      };
      const roster = generateRoster(rng.fork('roster'), seed.id, usedNames);
      const m = seed.strength * STRENGTH_TO_MULTIPLIER;
      return [seed.id, { team, seed, roster, off: 1 + m + rng.normal(0, 0.012), def: 1 + m + rng.normal(0, 0.012) }];
    }),
  );
}

const INJURIES: ReadonlyArray<{ teamId: string; status: Injury['status']; description: string; updatedAt: string }> = [
  { teamId: 'notre-dame', status: 'out', description: 'Lower body', updatedAt: '2027-03-09T15:00:00Z' },
  { teamId: 'maryland', status: 'doubtful', description: 'Upper body', updatedAt: '2027-03-10T14:30:00Z' },
  { teamId: 'cornell', status: 'questionable', description: 'Ankle', updatedAt: '2027-03-11T16:00:00Z' },
  { teamId: 'duke', status: 'day_to_day', description: 'Undisclosed', updatedAt: '2027-03-11T18:15:00Z' },
  { teamId: 'penn-state', status: 'out', description: 'Shoulder', updatedAt: '2027-03-08T13:00:00Z' },
  { teamId: 'denver', status: 'questionable', description: 'Hamstring', updatedAt: '2027-03-12T17:00:00Z' },
];

function pickInjuries(rng: Rng, teams: ReadonlyMap<string, GenTeam>): Injury[] {
  return INJURIES.map((spec) => {
    const roster = (teams.get(spec.teamId) as GenTeam).roster;
    const candidates = roster.filter((g) => ['A', 'M', 'D', 'LSM'].includes(g.player.position)).sort((a, b) => b.talent - a.talent).slice(0, 8);
    const chosen = rng.pick(candidates);
    return { playerId: chosen.player.id, status: spec.status, description: spec.description, updatedAt: spec.updatedAt };
  });
}

// ---------------------------------------------------------------------------
// Venue details
// ---------------------------------------------------------------------------

const MONTH_TEMP_ADJUSTMENT = [-12, -9, 0, 9, 17, 24];

function weatherFor(rng: Rng, baseTempF: number, indoor: boolean, date: string): Weather | null {
  if (indoor) return null;
  const temperatureF = Math.round(baseTempF + (MONTH_TEMP_ADJUSTMENT[monthOf(date)] ?? 0) + rng.normal(0, 5));
  const condition = rng.weighted(
    ['clear', 'partly_cloudy', 'cloudy', 'rain', 'snow', 'wind'] as const,
    (c) => ({ clear: 0.32, partly_cloudy: 0.26, cloudy: 0.2, rain: 0.1, snow: temperatureF < 38 ? 0.08 : 0, wind: 0.07 })[c],
  );
  const precipitationChance =
    condition === 'rain' || condition === 'snow' ? rng.float(0.55, 0.9) : condition === 'cloudy' ? rng.float(0.1, 0.35) : rng.float(0, 0.1);
  return { temperatureF, condition, precipitationChance: Math.round(precipitationChance * 100) / 100 };
}

function broadcastsFor(rng: Rng, conferenceId: string, premium: boolean): Broadcast[] {
  if (premium) return [{ network: 'ESPN2', url: 'https://www.espn.com/watch' }];
  switch (conferenceId) {
    case 'acc':
      return [{ network: 'ACC Network', url: 'https://www.espn.com/watch' }];
    case 'big-ten':
      return rng.chance(0.5)
        ? [{ network: 'Big Ten Network', url: 'https://www.bigtennetwork.com' }]
        : [{ network: 'B1G+', url: 'https://www.bigtennetwork.com' }];
    case 'ivy':
      return [{ network: 'ESPN+', url: 'https://www.espn.com/watch' }];
    default:
      return rng.chance(0.5) ? [{ network: 'FS1', url: null }] : [{ network: 'Peacock', url: null }];
  }
}

// ---------------------------------------------------------------------------
// Simulation with plan constraints
// ---------------------------------------------------------------------------

interface SimContext {
  root: Rng;
  teams: ReadonlyMap<string, GenTeam>;
  injuries: readonly Injury[];
}

function simTeamFor(ctx: SimContext, teamId: string, startTime: string): SimTeam {
  const t = ctx.teams.get(teamId) as GenTeam;
  const sidelined = new Set(
    ctx.injuries
      .filter((i) => (i.status === 'out' || i.status === 'doubtful') && Date.parse(i.updatedAt) <= Date.parse(startTime))
      .map((i) => i.playerId),
  );
  return {
    id: teamId,
    off: t.off,
    def: t.def,
    players: t.roster.filter((g) => !sidelined.has(g.player.id)).map(toSimPlayer),
  };
}

function goalCounts(plays: readonly PlayRecord[], homeId: string): { home: number; away: number; maxDeficit: number; winnerIsHome: boolean } {
  let home = 0;
  let away = 0;
  let minMargin = 0;
  let maxMargin = 0;
  for (const p of plays) {
    if (p.type !== 'goal') continue;
    if (p.teamId === homeId) home += 1;
    else away += 1;
    minMargin = Math.min(minMargin, home - away);
    maxMargin = Math.max(maxMargin, home - away);
  }
  const winnerIsHome = home > away;
  return { home, away, maxDeficit: winnerIsHome ? -minMargin : maxMargin, winnerIsHome };
}

function acceptable(plan: PlanKind, plays: readonly PlayRecord[], homeId: string, awayId: string, cutoff: number | null): boolean {
  const { home, away, maxDeficit } = goalCounts(plays, homeId);
  if (home < 8 || away < 8 || home > 18 || away > 18 || home === away) return false;
  const shots = (teamId: string) => plays.filter((p) => p.teamId === teamId && (p.type === 'goal' || p.type === 'shot')).length;
  if ([shots(homeId), shots(awayId)].some((s) => s < 28 || s > 46)) return false;

  switch (plan) {
    case 'ot':
      return plays.some((p) => p.period > 4);
    case 'comeback':
      return maxDeficit >= 4 && !plays.some((p) => p.period > 4);
    case 'live_close': {
      const at = scoreFromPlays(playsUpTo(plays, cutoff), homeId);
      return Math.abs(at.home - at.away) <= 1 && at.home + at.away >= 18;
    }
    case 'live_mid': {
      const at = scoreFromPlays(playsUpTo(plays, cutoff), homeId);
      return at.home >= 3 && at.away >= 3 && at.home + at.away <= 14;
    }
    default:
      return true;
  }
}

function simulateSlot(ctx: SimContext, slot: GameSlot, startTime: string, cutoff: number | null): PlayRecord[] {
  const gameId = ctx.root.fork(`id:${slot.key}`);
  const id = uuid(gameId);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const plays = simulateGame({
      gameId: id,
      home: simTeamFor(ctx, slot.homeId, startTime),
      away: simTeamFor(ctx, slot.awayId, startTime),
      rng: ctx.root.fork(`sim:${slot.key}:${attempt}`),
      neutralSite: slot.neutralSite,
    });
    if (acceptable(slot.plan, plays, slot.homeId, slot.awayId, cutoff)) return plays;
  }
  throw new Error(`Could not simulate ${slot.key} with plan ${slot.plan} in ${MAX_ATTEMPTS} attempts`);
}

// ---------------------------------------------------------------------------
// Season
// ---------------------------------------------------------------------------

export function buildSeason(seed: string): SeasonOutput {
  const root = createRng(seed);
  const teams = buildTeams(root);
  const injuries = pickInjuries(root.fork('injuries'), teams);
  const ctx: SimContext = { root, teams, injuries };

  const states = createStates(TEAM_SEEDS);
  const played = new Set<string>();
  // The snapshot-day matchups are hand-picked, so earlier weeks must not already have used them.
  const reserved = new Set(SNAPSHOT_SLATE.map((s) => pairKey(s.home, s.away)));
  const games: GameRecord[] = [];
  const plays: Record<string, PlayRecord[]> = {};
  const boxes = new Map<string, BoxScore>();
  const venueRng = root.fork('venues');

  const sideOf = (teamId: string, ranking: ReadonlyMap<string, Ranking>, at: ReadonlyMap<string, TeamState>, seedNo: number | null): GameSideRecord => {
    const r = ranking.get(teamId) as Ranking;
    return {
      teamId,
      rankBefore: r.rank,
      rpiBefore: r.rpi,
      recordBefore: recordOf(at.get(teamId) as TeamState),
      rankAfter: null,
      rpiAfter: null,
      seed: seedNo,
    };
  };

  const addGame = (
    slot: GameSlot,
    ranking: ReadonlyMap<string, Ranking>,
    at: ReadonlyMap<string, TeamState>,
    priorStates: ReadonlyMap<string, TeamState>,
    now: string | null,
  ): GameRecord => {
    const homeGen = teams.get(slot.homeId) as GenTeam;
    const awayGen = teams.get(slot.awayId) as GenTeam;
    const startTime = localIso(slot.date, slot.hour, slot.minute, homeGen.seed.timeZone);
    const cutoff = slot.kind === 'live' && now ? elapsedAtWallClock(startTime, now) : null;
    const log = simulateSlot(ctx, slot, startTime, cutoff);
    const id = uuid(root.fork(`id:${slot.key}`));
    plays[id] = log;
    boxes.set(id, computeBoxScore(log, slot.homeId, slot.awayId));

    const rng = venueRng.fork(slot.key);
    const venue = slot.neutralSite ? NCAA_VENUE : homeGen.seed.venue;
    const indoor = slot.neutralSite ? false : homeGen.seed.indoor;
    const baseTemp = slot.neutralSite ? 52 : homeGen.seed.marchHighF;
    const bothRanked = (ranking.get(slot.homeId)?.rank ?? null) !== null && (ranking.get(slot.awayId)?.rank ?? null) !== null;
    const attendanceBase = homeGen.seed.id === 'ohio-state' ? 3000 : homeGen.seed.indoor ? 4000 : 1800;
    const game: GameRecord = {
      id,
      season: SEASON,
      week: slot.week,
      startTime,
      gameType: slot.gameType,
      label: slot.label,
      neutralSite: slot.neutralSite,
      attendance: slot.kind === 'scheduled' ? null : Math.round((attendanceBase + rng.float(0, 5200) + (bothRanked ? 1800 : 0)) / 10) * 10,
      status: slot.kind,
      snapshotElapsedSeconds: slot.kind === 'live' ? cutoff : null,
      home: sideOf(slot.homeId, ranking, at, slot.seeds?.home ?? null),
      away: sideOf(slot.awayId, ranking, at, slot.seeds?.away ?? null),
      venue: { ...venue },
      weather: weatherFor(rng, baseTemp, indoor, slot.date),
      broadcasts: broadcastsFor(rng, homeGen.seed.conferenceId, bothRanked || slot.gameType === 'ncaa_tournament'),
      isConferenceGame: slot.gameType === 'regular' && homeGen.seed.conferenceId === awayGen.seed.conferenceId,
      stakes: null,
      pregameWinProbabilityHome: pregameHomeProbability(
        priorStates.get(slot.homeId) as TeamState,
        priorStates.get(slot.awayId) as TeamState,
        slot.neutralSite,
      ),
      previewArticleId: null,
      recapArticleId: null,
    };
    games.push(game);
    return game;
  };

  const settle = (game: GameRecord) => {
    const score = scoreFromPlays(plays[game.id] as PlayRecord[], game.home.teamId);
    applyResult(states, game.home.teamId, game.away.teamId, score.home, score.away, game.isConferenceGame);
  };

  const stampAfter = (weekGames: readonly GameRecord[], ranking: ReadonlyMap<string, Ranking>) => {
    for (const g of weekGames) {
      for (const side of [g.home, g.away]) {
        const r = ranking.get(side.teamId) as Ranking;
        side.rankAfter = r.rank;
        side.rpiAfter = r.rpi;
      }
    }
  };

  // Weeks 1-5: all final.
  let ranking = rankTeams(states);
  for (let week = 1; week < SNAPSHOT_WEEK; week++) {
    const count = GAMES_PER_WEEK[week - 1] ?? 7;
    const slots = weeklySlots(root.fork(`schedule:${week}`), week, count, states, played, reserved, (offset) => dateForWeek(week, offset));
    if (week === 3 && slots[0]) slots[0].plan = 'ot';
    if (week === 4 && slots[1]) slots[1].plan = 'comeback';

    const before = ranking;
    const atWeekStart = cloneStates(states);
    const weekGames = slots.map((slot) => addGame(slot, before, atWeekStart, atWeekStart, null));
    weekGames.forEach(settle);
    ranking = rankTeams(states);
    stampAfter(weekGames, ranking);
  }

  // Snapshot Saturday.
  const rankingBeforeDay = ranking;
  const dayStart = cloneStates(states);
  const daySlots: GameSlot[] = SNAPSHOT_SLATE.map((s, i) => ({
    key: `w${SNAPSHOT_WEEK}-g${i + 1}`,
    week: SNAPSHOT_WEEK,
    date: SNAPSHOT_DATE,
    hour: s.hour,
    minute: s.minute,
    homeId: s.home,
    awayId: s.away,
    kind: s.kind,
    plan: s.plan,
    gameType: 'regular',
    label: null,
    neutralSite: false,
    seeds: null,
  }));
  const dayGames = daySlots.map((slot) => addGame(slot, rankingBeforeDay, dayStart, dayStart, SNAPSHOT_TIME));
  const finalsToday = dayGames.filter((g) => g.status === 'final');
  finalsToday.forEach(settle);
  stampAfter(finalsToday, rankTeams(states));

  // NCAA quarterfinal (future, neutral site, played after the snapshot so it never touches records).
  const ordered = [...rankingBeforeDay].sort(([, a], [, b]) => a.rpi - b.rpi).map(([id]) => id);
  const higher = ordered[1] as string;
  const lower = ordered.slice(5).find((id) => teams.get(id)?.seed.conferenceId !== teams.get(higher)?.seed.conferenceId) as string;
  const ncaaSlot: GameSlot = {
    key: 'ncaa-qf',
    week: NCAA_QUARTERFINAL_WEEK,
    date: NCAA_QUARTERFINAL_DATE,
    hour: 14,
    minute: 0,
    homeId: higher,
    awayId: lower,
    kind: 'scheduled',
    plan: 'normal',
    gameType: 'ncaa_tournament',
    label: 'NCAA Quarterfinal',
    neutralSite: true,
    seeds: { home: 2, away: 7 },
  };
  addGame(ncaaSlot, rankingBeforeDay, cloneStates(states), states, null);

  // Final team fields: record is as of the snapshot, poll rank is the last published poll (before today's finals).
  const finalTeams = [...teams.values()].map(({ team, seed: s }) => {
    const state = states.get(s.id) as TeamState;
    const published = rankingBeforeDay.get(s.id) as Ranking;
    return { ...team, record: recordOf(state), conferenceRecord: conferenceRecordOf(state), nationalRank: published.rank, rpi: published.rpi };
  });

  // Player season totals from the finals.
  const players = accumulateSeasonTotals(teams, games, boxes);
  const sortedGames = [...games].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  return { teams: finalTeams, players, games: sortedGames, plays, injuries, boxes };
}

function accumulateSeasonTotals(
  teams: ReadonlyMap<string, GenTeam>,
  games: readonly GameRecord[],
  boxes: ReadonlyMap<string, BoxScore>,
): Player[] {
  const players = new Map<string, Player>();
  for (const t of teams.values()) for (const g of t.roster) players.set(g.player.id, { ...g.player, season: { ...g.player.season } });

  for (const game of games) {
    if (game.status !== 'final') continue;
    const box = boxes.get(game.id) as BoxScore;
    for (const row of box.players) {
      const season = (players.get(row.playerId) as Player).season;
      season.gamesPlayed += 1;
      season.goals += row.goals;
      season.assists += row.assists;
      season.shots += row.shots;
      season.shotsOnGoal += row.shotsOnGoal;
      season.groundBalls += row.groundBalls;
      season.turnovers += row.turnovers;
      season.causedTurnovers += row.causedTurnovers;
      season.faceoffsWon += row.faceoffsWon;
      season.faceoffsTaken += row.faceoffsTaken;
      season.saves += row.saves;
      season.goalsAgainst += row.goalsAgainst;
    }
  }
  return [...players.values()];
}
