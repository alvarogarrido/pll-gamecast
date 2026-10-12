'use client';

import { useEffect, useRef } from 'react';
import type { GameSummary } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { GameChip, type GameChipRenderLink } from '../../molecules/GameChip';
import { orderOtherGames } from './otherGames.logic';

export interface OtherGamesBarProps {
  /** The week's games (`scoreboard.data.games`), in any order: the bar sorts them (live, upcoming, completed). */
  games: readonly GameSummary[];
  /** The game being viewed: marked in the bar and scrolled into view on mount. */
  currentGameId: string;
  /** Server time in ms (`Date.parse(meta.serverTime)`). */
  nowMs: number;
  /** Link target of a chip, e.g. `(id) => \`/ncaa/game/${id}/\``. The app wraps this with its router if needed. */
  getHref: (gameId: string) => string;
  /** Show the skeleton instead of the games. */
  loading?: boolean;
  timeZone?: string;
  /**
   * Render each chip's link yourself, e.g. with your router's `Link`, so switching games does not reload the page:
   * `renderLink={(props) => <Link {...props} />}`. Default: a plain `<a>`.
   */
  renderLink?: GameChipRenderLink;
  className?: string;
}

export function OtherGamesBarSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading other games" className={cn('flex gap-2 overflow-hidden', className)}>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} variant="rect" className="h-20 w-40 shrink-0" />
      ))}
    </div>
  );
}

/**
 * "Other games" strip (PRD, SHOULD): the week's games as compact chips in a horizontal scroller. Live first, then upcoming,
 * then completed (see `orderOtherGames`). Each chip shows logos, abbreviations and ranks, plus the start time, the live
 * score with quarter and clock, or the final score. The current game is outlined in gold. The scroller is focusable, so
 * arrow keys scroll it, and snaps chip by chip on touch screens.
 */
export function OtherGamesBar({ games, currentGameId, nowMs, getHref, loading = false, timeZone, renderLink, className }: OtherGamesBarProps) {
  const scroller = useRef<HTMLUListElement>(null);

  // Bring the current game into view inside the scroller only (scrollIntoView would also move the page).
  useEffect(() => {
    const list = scroller.current;
    const current = list?.querySelector<HTMLElement>('[data-current]');
    if (!list || !current) return;
    const target = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
    list.scrollLeft = Math.max(0, target);
  }, [currentGameId, games.length, loading]);

  if (loading) return <OtherGamesBarSkeleton className={className} />;

  return (
    <nav aria-label="Other games this week" className={className}>
      <h2 className="sr-only">Other games</h2>
      {games.length === 0 ? (
        <EmptyState icon="lacrosse-field" message="No other games this week." />
      ) : (
        <ul
          ref={scroller}
          // Focusable so the arrow keys scroll it without a mouse; it also needs a name and a role-neutral list.
          tabIndex={0}
          aria-label="Games, scroll horizontally"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth rounded-sm pb-2 [scrollbar-width:thin] sm:snap-none motion-reduce:scroll-auto"
        >
          {orderOtherGames(games).map((game) => (
            <GameChip key={game.id} game={game} current={game.id === currentGameId} href={getHref(game.id)} nowMs={nowMs} timeZone={timeZone} renderLink={renderLink} />
          ))}
        </ul>
      )}
    </nav>
  );
}
