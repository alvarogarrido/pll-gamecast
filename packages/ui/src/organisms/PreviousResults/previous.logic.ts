import type { GamePreview, PreviousResult } from '@pll/data/api';

/** Most recent first, at most `limit` (default 3). Does not mutate the input. */
export function lastResults(results: readonly PreviousResult[], limit = 3): PreviousResult[] {
  return [...results].sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime)).slice(0, limit);
}

/** Score text with the team's own score first: `"11–9"` (en dash). */
export const resultScore = (r: Pick<PreviousResult, 'teamScore' | 'opponentScore'>): string =>
  `${r.teamScore}–${r.opponentScore}`;

/** `vs` for home games, `@` for away games. */
export const venueMarker = (r: Pick<PreviousResult, 'isHome'>): 'vs' | '@' => (r.isHome ? 'vs' : '@');

export const hasAnyResults = (p: GamePreview['data']['previousResults']): boolean =>
  p.home.length > 0 || p.away.length > 0;
