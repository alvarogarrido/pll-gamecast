import { useId } from 'react';
import { Icon } from '@pll/icons';
import type { GameDetail } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { Chip } from '../../atoms/Chip';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';

export interface GameStakesProps {
  /** Only `stakes`, `label` (the event name of tournament games) and `gameType` are read. */
  game: Pick<GameDetail['data'], 'stakes' | 'label' | 'gameType'>;
  loading?: boolean;
  className?: string;
}

/**
 * Game Stakes [Pre]: a short editorial card with the 2–3 sentences on why the game matters, the event label for
 * tournament games ("NCAA Quarterfinal") and an empty state when there is nothing to say.
 */
export function GameStakes({ game, loading = false, className }: GameStakesProps) {
  const titleId = useId();
  const stakes = game.stakes?.trim() || null;
  const tournament = game.gameType !== 'regular' && !!game.label;

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>Why it matters</span>} />
      {loading ? (
        <div className="flex flex-col gap-2" role="status">
          <span className="sr-only">Loading game stakes</span>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : !stakes ? (
        <EmptyState icon="trophy" title="Nothing at stake noted" message="The stakes for this game have not been written yet." />
      ) : (
        <>
          {tournament && (
            <div>
              <Chip tone="gold" leading={<Icon name="trophy-filled" size={14} />}>
                {game.label}
              </Chip>
            </div>
          )}
          <p className="text-callout text-text-secondary">{stakes}</p>
        </>
      )}
    </Card>
  );
}
