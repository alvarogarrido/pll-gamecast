import { gameBucket, orderOtherGames, type GameBucket } from '@pll/ui';
import type { GameSummary } from '@pll/data/api';

export type { GameBucket };

/**
 * The slate grouped live / upcoming / completed, each bucket in the Other Games Bar order from the PRD
 * (`orderOtherGames` in @pll/ui is the single implementation of that rule).
 */
export function groupGames(games: readonly GameSummary[]): Record<GameBucket, GameSummary[]> {
  const groups: Record<GameBucket, GameSummary[]> = { live: [], upcoming: [], completed: [] };
  for (const game of orderOtherGames(games)) groups[gameBucket(game)].push(game);
  return groups;
}
