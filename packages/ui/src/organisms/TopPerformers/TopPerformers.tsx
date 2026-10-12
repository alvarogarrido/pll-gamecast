import type { GameDetail, GameStats } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { PlayerCompare } from '../../molecules/PlayerCompare';
import { SectionHeader } from '../../molecules/SectionHeader';
import { teamPairColors } from '../../lib/team-style';
import { buildTopPerformers, isEmptySections } from './topPerformers.logic';

export interface TopPerformersProps {
  /** `GameStats['data']`: team and player lines plus the player refs. */
  stats: GameStats['data'];
  game: GameDetail['data'];
  /** Show the skeleton instead of the content. */
  loading?: boolean;
  /** Chevron in the header (e.g. jump to the Stats tab). Omit for none. */
  onViewAll?: () => void;
  className?: string;
}

/** TOP PERFORMERS [Live/Post]: scorer, goalie and faceoff leader of each team, head to head. */
export function TopPerformers({ stats, game, loading = false, onViewAll, className }: TopPerformersProps) {
  if (loading) return <TopPerformersSkeleton className={className} />;
  const sections = buildTopPerformers(stats, game);
  const awayName = game.away.team.school;
  const homeName = game.home.team.school;
  // Both teams in every block: tell look-alikes (Duke / Notre Dame) apart.
  const teamColors = teamPairColors(game.away.team.colors, game.home.team.colors);

  return (
    <section aria-label="Top performers" className={cn('flex flex-col gap-2', className)}>
      <SectionHeader title="Top Performers" onClick={onViewAll} actionLabel="View all stats" />
      <Card padding="md" className="flex flex-col gap-4">
        {isEmptySections(sections) ? (
          <EmptyState title="No top performers yet" message="Leaders appear once the game gets going." icon="info" />
        ) : (
          sections.map((s, i) => (
            <div key={s.category} className={cn(i > 0 && 'border-t border-border-hairline pt-4')}>
              <PlayerCompare title={s.title} emptyLabel={s.emptyLabel} away={s.away} home={s.home} awayName={awayName} homeName={homeName} teamColors={teamColors} />
            </div>
          ))
        )}
      </Card>
    </section>
  );
}

export function TopPerformersSkeleton({ className, title = 'Top Performers' }: { className?: string; title?: string }) {
  return (
    <section aria-label={title} aria-busy="true" className={cn('flex flex-col gap-2', className)}>
      <SectionHeader title={title} />
      <Card padding="md" className="flex flex-col gap-4">
        <span className="sr-only">Loading</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            {[0, 1].map((j) => (
              <div key={j} className="flex items-center justify-center gap-2">
                <Skeleton variant="circle" className="size-16" />
                <Skeleton variant="rect" className="h-10 w-10" />
              </div>
            ))}
          </div>
        ))}
      </Card>
    </section>
  );
}
