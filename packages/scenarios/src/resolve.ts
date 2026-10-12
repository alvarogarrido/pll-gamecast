import type { BuildApiOptions } from '@pll/data/build-api';
import type { Db } from '@pll/data/db';
import { elapsedAtWallClock, wallClockOffsetSeconds } from '@pll/data/derive';
import type { GameRecord, GameStatus } from '@pll/data/schema';
import { applyDataFlags } from './flags';
import { logEnd } from './timeline';
import type { ScenarioState } from './types';

/** While a live game is driven by elapsed time, the server clock sits this far past the last play. */
const LIVE_LAG_MS = 3_000;
/** After the final whistle the server clock sits this far past the end of the game. */
const POST_GAME_MS = 30 * 60_000;

export interface FocusInfo {
  status: GameStatus;
  /** Game-seconds played at the resolved moment (0 for scheduled, log end for final), null when unknown (no plays). */
  elapsed: number | null;
  /** Length of the focus game's log. */
  end: number;
}

export interface ResolvedScenario {
  /** A new Db (never the input). */
  db: Db;
  /** Options for `buildApi` / `resolveApiPath`. */
  opts: BuildApiOptions;
  info: {
    /** The `meta.serverTime` the API will report. */
    nowIso: string;
    /** True when the world is not the DB snapshot (records and the scoreboard week are recomputed). */
    timeTravel: boolean;
    /** True when the focus game is driven by elapsed game time (as opposed to wall-clock time). */
    elapsedDriven: boolean;
    focus: FocusInfo;
  };
}

const NEVER_DERIVE: ReadonlySet<GameStatus> = new Set(['postponed', 'canceled', 'delayed']);

interface Effective {
  status: GameStatus;
  elapsed: number | null;
  final: boolean;
}

/**
 * Turns (db, scenario state, real time) into a Db plus `BuildApiOptions`.
 *
 *  - The live clock is `elapsed = anchorElapsed + (realNow - anchorRealMs) / 1000 * speed` while playing. At or past the end of
 *    the log the game becomes final.
 *  - `serverTime`: `nowOverride` (+ the same real delta x speed while playing) when set; otherwise, when the focus game is
 *    driven by an elapsed override, the wall-clock moment that game second corresponds to; otherwise the DB snapshot time.
 *  - Whenever the world is not the snapshot ("time travel"), every game without an explicit override derives its status and
 *    elapsed from that moment, `meta.currentWeek` becomes the focus game's week, and each side's `recordBefore` is recomputed
 *    from the games that are final at that moment (so the start of the season shows 0-0 everywhere).
 */
export function resolveScenario(db: Db, state: ScenarioState, realNowMs: number): ResolvedScenario {
  const base = applyDataFlags(db, state.dataFlags);
  const gamesById = new Map(base.games.map((g) => [g.id, g]));
  const focus = gamesById.get(state.gameId);
  const { clock } = state;
  const realDeltaMs = clock.playing ? Math.max(0, realNowMs - clock.anchorRealMs) : 0;

  const statusOverrides: Record<string, GameStatus> = {};
  const elapsedOverrides: Record<string, number | null> = {};
  for (const [id, ov] of Object.entries(state.perGame)) {
    if (!gamesById.has(id)) continue;
    if (ov.status) statusOverrides[id] = ov.status;
    if (typeof ov.elapsedSeconds === 'number') elapsedOverrides[id] = Math.max(0, Math.floor(ov.elapsedSeconds));
  }
  const explicit = new Set(Object.keys(state.perGame).filter((id) => gamesById.has(id) && (id in statusOverrides || id in elapsedOverrides)));

  // --- the focus game's elapsed clock ------------------------------------------------------------------------------
  const focusOv = focus ? state.perGame[focus.id] : undefined;
  const elapsedDriven = !!focus && typeof focusOv?.elapsedSeconds === 'number';
  let focusEnded = false;
  if (focus && elapsedDriven) {
    const raw = clock.playing ? clock.anchorElapsed + (realDeltaMs / 1000) * clock.speed : (focusOv?.elapsedSeconds as number);
    const end = logEnd(db, focus.id);
    if (end > 0 && raw >= end) {
      statusOverrides[focus.id] = 'final';
      delete elapsedOverrides[focus.id];
      focusEnded = true;
    } else {
      elapsedOverrides[focus.id] = Math.max(0, Math.floor(raw));
    }
  }

  // --- the server clock -------------------------------------------------------------------------------------------
  let nowMs: number | null = null;
  if (state.nowOverride) {
    const anchor = Date.parse(state.nowOverride);
    if (!Number.isNaN(anchor)) nowMs = anchor + realDeltaMs * clock.speed;
  }
  if (nowMs === null && focus && elapsedDriven) {
    const start = Date.parse(focus.startTime);
    nowMs = focusEnded
      ? start + wallClockOffsetSeconds(logEnd(db, focus.id)) * 1000 + POST_GAME_MS
      : start + wallClockOffsetSeconds(elapsedOverrides[focus.id] ?? 0) * 1000 + LIVE_LAG_MS;
  }
  const timeTravel = nowMs !== null;

  // --- derive every other game from the moment ----------------------------------------------------------------------
  if (nowMs !== null) {
    const nowIso = new Date(nowMs).toISOString();
    for (const g of base.games) {
      if (explicit.has(g.id) || (focus && g.id === focus.id && elapsedDriven) || NEVER_DERIVE.has(g.status)) continue;
      const start = Date.parse(g.startTime);
      const end = logEnd(db, g.id);
      const realSec = (nowMs - start) / 1000;
      if (realSec < 0) statusOverrides[g.id] = 'scheduled';
      else if (end === 0 || realSec >= wallClockOffsetSeconds(end)) statusOverrides[g.id] = 'final';
      else elapsedOverrides[g.id] = elapsedAtWallClock(g.startTime, nowIso, end);
    }
  }

  // --- effective status per game ------------------------------------------------------------------------------------
  const effective = (g: GameRecord): Effective => {
    const end = logEnd(db, g.id);
    const so = statusOverrides[g.id];
    const eo = elapsedOverrides[g.id];
    let status: GameStatus = so ?? g.status;
    if (!so && typeof eo === 'number' && status !== 'postponed' && status !== 'canceled') status = status === 'delayed' ? 'delayed' : 'live';
    let elapsed: number | null = null;
    if (status === 'live') {
      const cutoff = typeof eo === 'number' ? eo : (g.snapshotElapsedSeconds ?? 0);
      if (end > 0 && cutoff >= end) status = 'final';
      else elapsed = cutoff;
    } else if (status === 'delayed') {
      elapsed = typeof eo === 'number' ? eo : (g.snapshotElapsedSeconds ?? 0);
    }
    if (status === 'final') elapsed = end;
    else if (status === 'scheduled' || status === 'postponed' || status === 'canceled') elapsed = 0;
    return { status, elapsed, final: status === 'final' };
  };

  // --- build the output Db ------------------------------------------------------------------------------------------------
  let out = base;
  if (timeTravel) {
    const finals = base.games.filter((g) => effective(g).final).map((g) => ({ g, ...finalScore(db, g) }));
    const recordBefore = (teamId: string, before: string) => {
      let wins = 0;
      let losses = 0;
      for (const f of finals) {
        if (f.g.startTime >= before) continue;
        const isHome = f.g.home.teamId === teamId;
        if (!isHome && f.g.away.teamId !== teamId) continue;
        if ((isHome ? f.home : f.away) > (isHome ? f.away : f.home)) wins += 1;
        else losses += 1;
      }
      return { wins, losses };
    };
    out = {
      ...base,
      meta: { ...base.meta, currentWeek: focus?.week ?? base.meta.currentWeek },
      games: base.games.map((g) => ({
        ...g,
        home: { ...g.home, recordBefore: recordBefore(g.home.teamId, g.startTime) },
        away: { ...g.away, recordBefore: recordBefore(g.away.teamId, g.startTime) },
      })),
    };
  }

  const focusEff = focus ? effective(focus) : null;
  const end = focus ? logEnd(db, focus.id) : 0;
  const opts: BuildApiOptions = { elapsedOverrides, statusOverrides };
  if (nowMs !== null) opts.now = new Date(nowMs).toISOString();

  return {
    db: out,
    opts,
    info: {
      nowIso: opts.now ?? base.meta.snapshotTime,
      timeTravel,
      elapsedDriven,
      focus: {
        status: focusEff?.status ?? 'scheduled',
        elapsed: focusEff ? (end === 0 && focusEff.final ? null : focusEff.elapsed) : null,
        end,
      },
    },
  };
}

/** Final score from the goals in a game's log. */
function finalScore(db: Db, g: GameRecord): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const p of db.plays[g.id] ?? []) {
    if (p.type !== 'goal') continue;
    if (p.teamId === g.home.teamId) home += 1;
    else away += 1;
  }
  return { home, away };
}
