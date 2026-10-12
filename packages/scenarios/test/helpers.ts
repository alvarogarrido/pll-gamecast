import { loadDbFromDisk } from '../../data/scripts/load-db';
import { createApi } from '@pll/data/build-api';
import type { GameDetail, ScoreboardResponse } from '@pll/data/api';
import type { Db } from '@pll/data/db';
import { resolveScenario, type ScenarioState } from '../src';

export const db: Db = loadDbFromDisk();
export const NOW = 1_800_000_000_000;

export const gameBy = (pred: (g: Db['games'][number]) => boolean) => {
  const g = db.games.find(pred);
  if (!g) throw new Error('no such game');
  return g;
};

/** Run the scenario through the real API builder. */
export function run(state: ScenarioState, realNow = NOW) {
  const r = resolveScenario(db, state, realNow);
  const api = createApi(r.db, r.opts);
  return {
    ...r,
    api,
    get: <T = unknown>(path: string) => api.resolve(path) as T,
    detail: (id: string) => api.resolve(`/games/${id}`) as GameDetail,
    scoreboard: () => api.resolve('/scoreboard') as ScoreboardResponse,
  };
}
