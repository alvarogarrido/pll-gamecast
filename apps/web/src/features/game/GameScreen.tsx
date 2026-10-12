'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AdSlot,
  HeaderBar,
  HeaderBarSkeleton,
  OtherGamesBar,
  SectionSelector,
  availabilityFor,
  cn,
  sectionPanelProps,
} from '@pll/ui';
import { useGame, useScoreboard, useServerNow } from '@/api/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { GamecastBody } from './GamecastBody';
import { GameViewProvider } from './game-view';
import { HighlightsTabModule, PlaysTab, StatsTab } from './modules';
import { DEFAULT_TAB, phaseOf, type GameTab } from './tabs';
import { useStuckHeader } from './use-stuck-header';
import { useGameTab } from './use-game-tab';

const SECTION_ID_BASE = 'game-section';

/** Space for the offline banner (published by OfflineBanner; 0 while online) above a sticky bar. */
const BELOW_BANNER = 'var(--offline-banner-h,0px)';
/**
 * Where the section selector sticks: under the offline banner and the minimized header bar (`--mini-header-h`, measured by
 * useStuckHeader, safe area included). Written out in full so Tailwind can see the class.
 */
const SELECTOR_TOP = 'top-[calc(var(--offline-banner-h,0px)+var(--mini-header-h,0px))]';

/**
 * Page for /ncaa/game/[gameId]: OtherGamesBar, HeaderBar, SectionSelector, then the active section.
 * Needs a <Suspense> ancestor (useSearchParams) for static export.
 *
 * Layout: a centered column (max 1200px). From 1440px, 160px ad skyscrapers sit in the gutters either side of it and the
 * column shrinks to fit; below `lg` a pinned 320x50 ad bar closes the page (it is in flow, so it never covers content).
 *
 * Sticky: once the full header scrolls out, a minimized header appears pinned at the top and the section selector stays
 * right under it. The minimized bar is out of flow (a zero-height sticky anchor holds it) so showing it moves nothing.
 */
export function GameScreen({ gameId }: { gameId: string }) {
  const { tab: requestedTab, setTab } = useGameTab();
  const gameQuery = useGame(gameId);
  const scoreboard = useScoreboard();

  const game = gameQuery.data?.data;
  const phase = game ? phaseOf(game.status) : null;
  const available = phase ? availabilityFor(phase) : null;
  // A tab the game does not offer (stats before kickoff, a stale link...) falls back to the Gamecast.
  const tab: GameTab = available && !available[requestedTab] ? DEFAULT_TAB : requestedTab;

  const clockNow = useServerNow({ tickMs: 10_000 });
  const responseNow = gameQuery.data ? Date.parse(gameQuery.data.meta.serverTime) : null;
  const nowMs = clockNow ?? responseNow;

  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const miniVisible = useStuckHeader(rootRef, headerRef, miniRef) && !!game;

  // After a section change, keep the new content's top in view if the page was scrolled past it.
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    const selector = selectorRef.current;
    const panel = panelRef.current;
    if (!selector || !panel) return;
    const overlap = panel.getBoundingClientRect().top - selector.getBoundingClientRect().bottom;
    if (overlap < -1) window.scrollBy({ top: overlap, behavior: 'instant' });
  }, [tab]);

  const goToTab = useCallback((next: GameTab) => setTab(next), [setTab]);

  const otherGames = scoreboard.data?.data.games ?? [];
  const otherGamesLoading = scoreboard.data === undefined && !scoreboard.isError;

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-[97rem] flex-1 justify-center gap-4">
        <AdGutter />

        <div className="relative min-w-0 max-w-page flex-1">
          {/* Minimized header: out of flow, pinned while the full header is out of view. */}
          <div className="sticky z-30 h-0" style={{ top: BELOW_BANNER }}>
            <div
              ref={miniRef}
              aria-hidden="true"
              inert={!miniVisible}
              className={cn(
                'absolute inset-x-0 top-0 border-b border-border-default bg-surface-card pt-[env(safe-area-inset-top)] shadow-elevation-2',
                'invisible -translate-y-2 opacity-0 motion-safe:transition-[opacity,translate] motion-safe:duration-150',
                miniVisible && 'visible translate-y-0 opacity-100',
              )}
            >
              {game && nowMs !== null && (
                // The wrapper above carries the border and shadow; drop the component's own so they do not double up.
                <HeaderBar game={game} nowMs={nowMs} variant="minimized" className="[&>div]:border-b-0 [&>div]:shadow-none" />
              )}
            </div>
          </div>

          <div className="px-4 pt-2 md:px-6">
            <OtherGamesBar
              games={otherGames}
              currentGameId={gameId}
              nowMs={nowMs ?? 0}
              getHref={(id) => `/ncaa/game/${encodeURIComponent(id)}/`}
              renderLink={({ href, children, ...rest }) => (
                <Link href={href} {...rest}>
                  {children}
                </Link>
              )}
              loading={otherGamesLoading || nowMs === null}
            />
            {scoreboard.isError && otherGames.length === 0 && (
              <p role="status" className="py-2 text-caption text-text-tertiary">
                Other games are unavailable right now.
              </p>
            )}
          </div>

          <main className="flex-1 px-4 pb-6 md:px-6">
            <div ref={headerRef}>
              <QueryBoundary query={gameQuery} label="Game" loading={<HeaderBarSkeleton />}>
                {(response) => <HeaderBar game={response.data} nowMs={nowMs ?? Date.parse(response.meta.serverTime)} />}
              </QueryBoundary>
            </div>

            {game && phase && nowMs !== null && available && (
              <GameViewProvider value={{ gameId, game, nowMs, goToTab }}>
                <div
                  ref={selectorRef}
                  className={cn('sticky z-20 -mx-4 bg-surface-page px-4 py-3 md:-mx-6 md:px-6', SELECTOR_TOP)}
                >
                  <SectionSelector value={tab} onChange={goToTab} available={available} idBase={SECTION_ID_BASE} />
                </div>
                <div ref={panelRef} {...sectionPanelProps(SECTION_ID_BASE, tab)} className="pt-1 outline-offset-4">
                  {tab === 'gamecast' && <GamecastBody phase={phase} />}
                  {tab === 'stats' && <StatsTab />}
                  {tab === 'plays' && <PlaysTab />}
                  {tab === 'highlights' && <HighlightsTabModule />}
                </div>
              </GameViewProvider>
            )}
          </main>
        </div>

        <AdGutter />
      </div>

      {/* Mobile and tablet: pinned in flow at the bottom, so the page always ends below the last module. */}
      <AdSlot
        size="mobile-bar"
        pinned
        className="border-t border-border-hairline pb-[env(safe-area-inset-bottom)] lg:hidden"
      />
    </div>
  );
}

/** Wide screens only (1440px+): a 160px gutter with a skyscraper that follows the page while it scrolls. */
function AdGutter() {
  return (
    <div className="hidden w-40 shrink-0 min-[1440px]:block">
      <div className={cn('sticky pt-4', 'top-[calc(var(--offline-banner-h,0px)+env(safe-area-inset-top))]')}>
        <AdSlot size="skyscraper" />
      </div>
    </div>
  );
}

/** Suspense fallback while the query string is read (first paint of the static page). */
export function GameScreenFallback() {
  return <div className="min-h-dvh" aria-busy="true" />;
}
