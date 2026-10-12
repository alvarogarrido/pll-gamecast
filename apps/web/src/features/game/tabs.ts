import type { GamecastSection } from '@pll/ui';

/** The game page sections, in selector order. `?tab=` holds one of these. */
export type GameTab = GamecastSection;
export const GAME_TABS: readonly GameTab[] = ['gamecast', 'stats', 'plays', 'highlights'];
export const DEFAULT_TAB: GameTab = 'gamecast';

export const isGameTab = (value: string | null | undefined): value is GameTab =>
  (GAME_TABS as readonly string[]).includes(value ?? '');

/** Where a game is in its life, for choosing the layout and the available sections. */
export type GamePhase = 'pre' | 'live' | 'final';

/** scheduled / delayed / postponed / canceled = pre, live = live, final = post. */
export function phaseOf(status: string): GamePhase {
  if (status === 'live') return 'live';
  if (status === 'final') return 'final';
  return 'pre';
}
