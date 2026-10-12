import type { ReactNode } from 'react';
import type { Play, PlayerRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { PlayRow, type PlayGame } from '../PlayByPlay/PlayRow';
import { playerMap, selectLatestPlays } from '../PlayByPlay/playByPlay.logic';

export interface LatestPlaysProps {
  plays: readonly Play[];
  playerRefs: readonly PlayerRef[];
  game: PlayGame;
  /** How many plays to show (3 to 5). Default 5. */
  max?: number;
  /** "See all" goes to the Play-by-Play tab: pass a link... */
  seeAllHref?: string;
  /** ...or a handler (switch the section). One of the two renders the action. */
  onSeeAll?: () => void;
  loading?: boolean;
  className?: string;
}

const seeAllClass = 'inline-flex min-h-10 items-center rounded-pill px-3 text-footnote font-semibold text-link hover:underline';

export function LatestPlaysSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="none" role="status" aria-busy="true" className={cn('flex flex-col gap-2 p-4', className)}>
      <span className="sr-only">Loading latest plays</span>
      <Skeleton className="h-6 w-1/3" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rect" className="h-14 w-full" />
      ))}
    </Card>
  );
}

/**
 * Compact card for the Gamecast tab: the latest 3 to 5 plays, goals first, with a "See all" action. Reuses `PlayRow`.
 * The list is a polite live region while the game is live, so a new play is announced.
 */
export function LatestPlays({ plays, playerRefs, game, max = 5, seeAllHref, onSeeAll, loading = false, className }: LatestPlaysProps) {
  if (loading) return <LatestPlaysSkeleton className={className} />;

  const players = playerMap(playerRefs);
  const latest = selectLatestPlays(plays, Math.min(5, Math.max(3, max)));

  let action: ReactNode = undefined;
  if (seeAllHref !== undefined) {
    action = (
      <a href={seeAllHref} className={seeAllClass}>
        See all<span className="sr-only"> plays</span>
      </a>
    );
  } else if (onSeeAll) {
    action = (
      <button type="button" onClick={onSeeAll} className={seeAllClass}>
        See all<span className="sr-only"> plays</span>
      </button>
    );
  }

  return (
    <Card as="section" aria-label="Latest plays" padding="none" className={cn('overflow-hidden', className)}>
      <SectionHeader title="Latest plays" action={action} className="px-4 pt-2" />
      {latest.length === 0 ? (
        <EmptyState icon="lacrosse-field" message="Plays appear here once the game starts." />
      ) : (
        <ul aria-live={game.status === 'live' ? 'polite' : undefined} className="flex flex-col">
          {latest.map((p) => (
            <PlayRow key={p.id} play={p} game={game} playerRefs={players} density="flat" />
          ))}
        </ul>
      )}
    </Card>
  );
}
