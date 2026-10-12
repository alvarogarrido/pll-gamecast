import type { GameSummary } from '@pll/data/api';

export type LinescoreSide = 'away' | 'home';

/** The slice of a game the linescore reads. A `GameSummary` / `GameDetail['data']` fits. */
export type LinescoreGame = Pick<GameSummary, 'status' | 'clock'> & {
  away: Pick<GameSummary['away'], 'team' | 'score' | 'periodScores'>;
  home: Pick<GameSummary['home'], 'team' | 'score' | 'periodScores'>;
};

/** The side that won a final game, or `null` for ties, live games and missing scores. */
export function winnerSide(game: Pick<GameSummary, 'status'> & { home: { score: number | null }; away: { score: number | null } }): LinescoreSide | null {
  if (game.status !== 'final') return null;
  const { home, away } = game;
  if (home.score === null || away.score === null || home.score === away.score) return null;
  return home.score > away.score ? 'home' : 'away';
}

/** Column headings of the linescore: Q1..Q4 always, plus an OT column for each extra period played. */
export function linescorePeriods(game: { home: { periodScores: readonly number[] }; away: { periodScores: readonly number[] } }): number[] {
  const played = Math.max(game.home.periodScores.length, game.away.periodScores.length);
  return Array.from({ length: Math.max(4, played) }, (_, i) => i + 1);
}
