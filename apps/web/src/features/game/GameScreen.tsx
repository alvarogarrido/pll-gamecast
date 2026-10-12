'use client';

import { tabPanelProps } from '@pll/ui';
import { GamecastBody } from './GamecastBody';
import { HeaderBar } from './HeaderBar';
import { OtherGamesBar } from './OtherGamesBar';
import { HighlightsSection, PlaysSection, StatsSection } from './SectionPlaceholders';
import { SECTION_ID_BASE, SectionSelector } from './SectionSelector';
import { useGameTab } from './use-game-tab';

/**
 * Page shell for /ncaa/game/[gameId]: OtherGamesBar, HeaderBar, SectionSelector, then the active section.
 * Needs a <Suspense> ancestor (useSearchParams) for static export.
 */
export function GameScreen({ gameId }: { gameId: string }) {
  const { tab, setTab } = useGameTab();

  return (
    <div className="flex min-h-dvh flex-col">
      <OtherGamesBar currentGameId={gameId} />
      <main className="mx-auto w-full max-w-page flex-1 px-4 pt-4 pb-10 md:px-6">
        <HeaderBar gameId={gameId} />
        <SectionSelector tab={tab} onTabChange={setTab} />
        <div {...tabPanelProps(SECTION_ID_BASE, tab)} className="outline-offset-4">
          {tab === 'gamecast' && <GamecastBody gameId={gameId} />}
          {tab === 'stats' && <StatsSection gameId={gameId} />}
          {tab === 'plays' && <PlaysSection gameId={gameId} />}
          {tab === 'highlights' && <HighlightsSection gameId={gameId} />}
        </div>
      </main>
    </div>
  );
}

/** Suspense fallback while the query string is read (first paint of the static page). */
export function GameScreenFallback() {
  return <div className="min-h-dvh" aria-busy="true" />;
}
