import type { GameSummary } from '@pll/data/api';

export type GameBucket = 'live' | 'upcoming' | 'completed';

/** `live` = in progress, `completed` = final, everything else (scheduled, delayed, postponed, canceled) = `upcoming`. */
export function gameBucket(game: Pick<GameSummary, 'status'>): GameBucket {
  if (game.status === 'live') return 'live';
  if (game.status === 'final') return 'completed';
  return 'upcoming';
}
