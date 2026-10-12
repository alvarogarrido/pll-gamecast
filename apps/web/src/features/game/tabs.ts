export const GAME_TABS = ['gamecast', 'stats', 'plays', 'highlights'] as const;
export type GameTab = (typeof GAME_TABS)[number];
export const DEFAULT_TAB: GameTab = 'gamecast';

export const TAB_LABELS: Record<GameTab, string> = {
  gamecast: 'Gamecast',
  stats: 'Stats',
  plays: 'Plays',
  highlights: 'Highlights',
};

export const isGameTab = (value: string | null | undefined): value is GameTab =>
  (GAME_TABS as readonly string[]).includes(value ?? '');
