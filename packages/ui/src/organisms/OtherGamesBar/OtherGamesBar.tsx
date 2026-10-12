'use client';

import { useEffect, useRef } from 'react';
import type { GameSummary } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { NO_VALUE, statusLine } from '../../lib/format';
import { RankBadge } from '../../atoms/RankBadge';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { EmptyState } from '../../molecules/EmptyState';
import { GameStatusLabel } from '../../molecules/GameStatusLabel';
import { gameBucket, orderOtherGames } from './otherGames.logic';

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
  className?: string;
}

const SIDES = ['away', 'home'] as const;

function ChipRow({ game, side, loser, showScore }: { game: GameSummary; side: (typeof SIDES)[number]; loser: boolean; showScore: boolean }) {
  const s = game[side];
  return (
    <div className="flex items-center gap-2">
      <TeamLogo src={s.team.logoUrl} name={`${s.team.school} ${s.team.mascot}`} abbreviation={s.team.abbreviation} color={s.team.colors.primary} size="xs" decorative />
      <span className="flex min-w-0 flex-1 items-center gap-1">
        {s.rank !== null && <RankBadge rank={s.rank} />}
        <span className={cn('truncate text-footnote font-semibold', loser ? 'text-text-secondary' : 'text-text-primary')}>{s.team.abbreviation}</span>
      </span>
      {showScore && (
        <span aria-hidden="true" className={cn('font-display text-headline font-bold tabular-nums', loser ? 'text-text-secondary' : 'text-text-primary')}>
          {s.score ?? NO_VALUE}
        </span>
      )}
    </div>
  );
}

function GameChip({ game, current, href, nowMs, timeZone }: { game: GameSummary; current: boolean; href: string; nowMs: number; timeZone?: string }) {
  const bucket = gameBucket(game);
  const showScore = bucket !== 'upcoming';
  const a = game.away.score ?? 0;
  const h = game.home.score ?? 0;
  const loserSide = bucket === 'completed' && a !== h ? (a > h ? 'home' : 'away') : null;
  const label = [
    `${game.away.team.school}${showScore ? ` ${a}` : ''} at ${game.home.team.school}${showScore ? ` ${h}` : ''}`,
    statusLine(game, nowMs, { timeZone }),
    current ? 'current game' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li className="snap-start">
      <a
        href={href}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        data-current={current ? '' : undefined}
        data-bucket={bucket}
        className={cn(
          'flex w-40 shrink-0 flex-col gap-1 rounded-md border p-2 transition-colors',
          current ? 'border-accent-gold bg-gold-tint' : 'border-border-default bg-surface-card hover:bg-surface-track',
        )}
      >
        {SIDES.map((side) => (
          <ChipRow key={side} game={game} side={side} showScore={showScore} loser={loserSide === side} />
        ))}
        <GameStatusLabel game={game} nowMs={nowMs} variant="text" timeZone={timeZone} className="mt-0.5 text-caption" />
      </a>
    </li>
  );
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
export function OtherGamesBar({ games, currentGameId, nowMs, getHref, loading = false, timeZone, className }: OtherGamesBarProps) {
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
            <GameChip key={game.id} game={game} current={game.id === currentGameId} href={getHref(game.id)} nowMs={nowMs} timeZone={timeZone} />
          ))}
        </ul>
      )}
    </nav>
  );
}
