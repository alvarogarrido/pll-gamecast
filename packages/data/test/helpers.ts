import { loadDbFromDisk } from '../scripts/load-db';
import { buildApi } from '../src/build-api';
import type { GameDetail, GameStats } from '../src/api';

export const db = loadDbFromDisk();
export const api = buildApi(db);

export const get = <T>(path: string): T => {
  const value = api.get(path);
  if (!value) throw new Error(`missing ${path}`);
  return value as T;
};

export const finalGames = db.games.filter((g) => g.status === 'final');
export const detailOf = (id: string) => get<GameDetail>(`/games/${id}`).data;
export const statsOf = (id: string) => get<GameStats>(`/games/${id}/stats`).data;
