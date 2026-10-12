'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { GameDetail } from '@pll/data/api';
import type { GameTab } from './tabs';

export type Game = GameDetail['data'];

/** What every module on the game page needs besides its own endpoint. */
export interface GameView {
  gameId: string;
  game: Game;
  /** Server time in ms (never the device clock). */
  nowMs: number;
  /** Jump to another section ("See all" on Latest plays, "View all stats"...). */
  goToTab: (tab: GameTab) => void;
}

const GameViewContext = createContext<GameView | null>(null);

export function GameViewProvider({ value, children }: { value: GameView; children: ReactNode }) {
  const { gameId, game, nowMs, goToTab } = value;
  const memo = useMemo(() => ({ gameId, game, nowMs, goToTab }), [gameId, game, nowMs, goToTab]);
  return <GameViewContext.Provider value={memo}>{children}</GameViewContext.Provider>;
}

export function useGameView(): GameView {
  const view = useContext(GameViewContext);
  if (!view) throw new Error('useGameView must be used inside <GameViewProvider>.');
  return view;
}
