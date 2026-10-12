import type { GameSummary } from '@pll/data/api';
import { gameBucket, type GameBucket } from '../../molecules/GameChip/gameChip.logic';

export { gameBucket, type GameBucket };

/** Order of the buckets in the bar: live games first, then upcoming, then completed. */
const BUCKET_ORDER: Record<GameBucket, number> = { live: 0, upcoming: 1, completed: 2 };

/** Ranking facts the tie-breakers use. An unranked team counts as `Infinity`. */
export interface RankFacts {
  /** Number of ranked teams in the game (0, 1 or 2). */
  rankedCount: number;
  /** Sum of both ranks; `Infinity` as soon as one team is unranked. */
  rankSum: number;
  /** Best (lowest) single rank; `Infinity` when neither team is ranked. */
  bestRank: number;
}

export function rankFacts(game: Pick<GameSummary, 'home' | 'away'>): RankFacts {
  const ranks = [game.away.rank ?? Infinity, game.home.rank ?? Infinity];
  return {
    rankedCount: ranks.filter((r) => r !== Infinity).length,
    rankSum: ranks[0]! + ranks[1]!,
    bestRank: Math.min(ranks[0]!, ranks[1]!),
  };
}

/** Ascending comparison that is safe with `Infinity` (`Infinity - Infinity` is NaN, so never subtract). */
const asc = (a: number, b: number) => (a === b ? 0 : a < b ? -1 : 1);

/**
 * PRD order for the Other Games Bar: live, then upcoming, then completed. Within each bucket:
 * start time asc, ranked-team count desc, rank sum asc, best single rank asc (unranked = Infinity).
 * Equal games keep their input order. Returns a new array.
 */
export function orderOtherGames<T extends Pick<GameSummary, 'status' | 'startTime' | 'home' | 'away'>>(games: readonly T[]): T[] {
  const keyed = games.map((game) => ({
    game,
    bucket: BUCKET_ORDER[gameBucket(game)],
    start: Date.parse(game.startTime),
    ...rankFacts(game),
  }));
  keyed.sort(
    (a, b) =>
      asc(a.bucket, b.bucket) ||
      // An unparseable start time sorts last inside its bucket.
      asc(Number.isNaN(a.start) ? Infinity : a.start, Number.isNaN(b.start) ? Infinity : b.start) ||
      asc(b.rankedCount, a.rankedCount) ||
      asc(a.rankSum, b.rankSum) ||
      asc(a.bestRank, b.bestRank),
  );
  return keyed.map((k) => k.game);
}
