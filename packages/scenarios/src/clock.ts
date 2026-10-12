import type { Db } from '@pll/data/db';
import { resolveScenario } from './resolve';
import type { ScenarioState } from './types';

export const SPEEDS = [1, 10, 60] as const;

/** Freeze the moving parts at `realNowMs` so that the clock can be re-anchored (play, pause, change speed). */
function bake(db: Db, state: ScenarioState, realNowMs: number): ScenarioState {
  const { info } = resolveScenario(db, state, realNowMs);
  const focus = state.perGame[state.gameId];
  const next: ScenarioState = { ...state, clock: { ...state.clock, anchorRealMs: realNowMs } };
  if (typeof focus?.elapsedSeconds === 'number') {
    const elapsed = info.focus.status === 'final' ? info.focus.end : (info.focus.elapsed ?? 0);
    next.perGame = { ...state.perGame, [state.gameId]: { ...focus, elapsedSeconds: elapsed } };
    next.clock.anchorElapsed = elapsed;
    // A stale status override would pin the game; the clock owns it now.
    if (focus.status && focus.status !== 'live') delete (next.perGame[state.gameId] as { status?: unknown }).status;
  }
  if (state.nowOverride) next.nowOverride = info.nowIso;
  return next;
}

/** Jump the focus game to `elapsed` game-seconds. The server clock follows the game (an explicit `nowOverride` is dropped). */
export function seek(state: ScenarioState, elapsed: number, realNowMs: number): ScenarioState {
  const e = Math.max(0, Math.floor(elapsed));
  const { nowOverride: _dropped, ...rest } = state;
  return {
    ...rest,
    perGame: { ...state.perGame, [state.gameId]: { elapsedSeconds: e } },
    clock: { ...state.clock, anchorElapsed: e, anchorRealMs: realNowMs },
  };
}

export function setPlaying(db: Db, state: ScenarioState, playing: boolean, realNowMs: number): ScenarioState {
  if (state.clock.playing === playing) return state;
  let next = bake(db, state, realNowMs);
  if (playing) {
    const focus = next.perGame[next.gameId];
    const elapsedMode = typeof focus?.elapsedSeconds === 'number';
    const { info } = resolveScenario(db, next, realNowMs);
    if (elapsedMode && info.focus.status === 'final') {
      next = seek(next, 0, realNowMs); // a finished game replays from the start
    } else if (!elapsedMode && (!next.nowOverride || focus?.status)) {
      // Neither driven by elapsed nor by wall-clock time: continue from the current moment (a game that is not live starts at 0).
      const live = info.focus.status === 'live' || info.focus.status === 'delayed';
      next = seek(next, live ? (info.focus.elapsed ?? 0) : 0, realNowMs);
    }
  }
  return { ...next, clock: { ...next.clock, playing } };
}

export function setSpeed(db: Db, state: ScenarioState, speed: number, realNowMs: number): ScenarioState {
  const next = state.clock.playing ? bake(db, state, realNowMs) : state;
  return { ...next, clock: { ...next.clock, speed } };
}
