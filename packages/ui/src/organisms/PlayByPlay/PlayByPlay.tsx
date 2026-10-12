'use client';

import { useMemo, useState } from 'react';
import type { Play, PlayerRef } from '@pll/data/api';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { LiveDot } from '../../atoms/LiveDot';
import { Skeleton } from '../../atoms/Skeleton';
import { Disclosure } from '../../molecules/Disclosure';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { PlayRow, type PlayGame } from './PlayRow';
import {
  PLAY_FILTERS,
  countByFilter,
  defaultPlayOrder,
  groupPlaysByPeriod,
  playerMap,
  type PlayFilter,
  type PlayOrder,
} from './playByPlay.logic';

export interface PlayByPlayProps {
  plays: readonly Play[];
  playerRefs: readonly PlayerRef[];
  game: PlayGame;
  /** Initial ordering. Defaults to newest first while live and chronological otherwise. */
  defaultOrder?: PlayOrder;
  /** Initial filter chip. Default `all`. */
  defaultFilter?: PlayFilter;
  /** Skeleton instead of content. */
  loading?: boolean;
  className?: string;
}

const emptyMessages: Record<PlayFilter, string> = {
  all: 'Play-by-play appears here once the game starts.',
  goals: 'No goals yet.',
  shots: 'No shots yet.',
  faceoffs: 'No faceoffs yet.',
  turnovers: 'No turnovers yet.',
  penalties: 'No penalties yet.',
};

export function PlayByPlaySkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" className={cn('flex flex-col gap-3', className)}>
      <span className="sr-only">Loading play-by-play</span>
      <Skeleton variant="rect" className="h-10 w-48" />
      <Skeleton variant="rect" className="h-10 w-full" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rect" className="h-16 w-full" />
      ))}
    </div>
  );
}

/**
 * Play-by-Play tab. Filter chips (All / Goals / Shots / Faceoffs / Turnovers / Penalties), plays grouped by period in
 * accordions, an order toggle. Goals are strong cards, every other play a micro row; period starts, ends and timeouts
 * are small dividers shown in "All" only.
 */
export function PlayByPlay({
  plays,
  playerRefs,
  game,
  defaultOrder,
  defaultFilter = 'all',
  loading = false,
  className,
}: PlayByPlayProps) {
  const [filter, setFilter] = useState<PlayFilter>(defaultFilter);
  const [order, setOrder] = useState<PlayOrder>(defaultOrder ?? defaultPlayOrder(game.status ?? 'final'));
  // Periods the user opened/closed by hand. Everything else follows the default (first displayed period open).
  const [manual, setManual] = useState<Record<number, boolean>>({});

  const players = useMemo(() => playerMap(playerRefs), [playerRefs]);
  const counts = useMemo(() => countByFilter(plays), [plays]);
  const groups = useMemo(() => groupPlaysByPeriod(plays, { filter, order }), [plays, filter, order]);
  const live = game.status === 'live';
  const newestFirst = order === 'newest';

  if (loading) return <PlayByPlaySkeleton className={className} />;

  const toggle = (
    <button
      type="button"
      onClick={() => {
        setOrder(newestFirst ? 'oldest' : 'newest');
        setManual({});
      }}
      className="inline-flex min-h-10 items-center gap-1 rounded-pill px-3 text-footnote font-semibold text-text-secondary hover:text-text-primary"
    >
      <Icon name="sort" size={16} />
      {newestFirst ? 'Newest first' : 'Oldest first'}
      <span className="sr-only">. Switch order.</span>
    </button>
  );

  return (
    <section aria-label="Play-by-play" className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title="Play-by-play" action={toggle} />

      <div role="group" aria-label="Filter plays" // Arbitrary variants: hide the scrollbar of the swipeable chip row (no token equivalent).
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {PLAY_FILTERS.map(({ id, label }) => {
          const selected = filter === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(id)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-1 rounded-pill px-3 text-footnote font-semibold',
                selected ? 'bg-accent-gold text-text-on-accent' : 'bg-surface-chip text-text-secondary hover:text-text-primary',
              )}
            >
              {label}
              <span className={cn('text-caption2 tabular-nums', selected ? 'text-text-on-accent' : 'text-text-tertiary')}>
                <span className="sr-only"> </span>
                {counts[id]}
              </span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <Card padding="none">
          <EmptyState icon="lacrosse-field" message={emptyMessages[filter]} />
        </Card>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-default bg-surface-page">
          {groups.map((g, i) => {
            const open = manual[g.period] ?? i === 0;
            const isCurrent = live && g.period === Math.max(...groups.map((x) => x.period));
            const score = g.endScore ? `${g.endScore.away}–${g.endScore.home}` : null;
            const summary = [score, filter === 'all' ? `${g.totalPlays} plays` : `${g.plays.length} ${g.plays.length === 1 ? 'play' : 'plays'}`]
              .filter(Boolean)
              .join(' · ');
            return (
              <Disclosure
                key={g.period}
                headingLevel={3}
                open={open}
                onOpenChange={(next) => setManual((m) => ({ ...m, [g.period]: next }))}
                title={
                  <span className="inline-flex items-center gap-2">
                    {g.label}
                    {isCurrent && (
                      <>
                        <LiveDot size="sm" />
                        <span className="sr-only">live</span>
                      </>
                    )}
                  </span>
                }
                summary={summary}
              >
                <ul className="flex flex-col gap-2 px-3 pb-3 pt-1">
                  {g.plays.map((p) => (
                    <PlayRow key={p.id} play={p} game={game} playerRefs={players} />
                  ))}
                </ul>
              </Disclosure>
            );
          })}
        </div>
      )}
    </section>
  );
}
