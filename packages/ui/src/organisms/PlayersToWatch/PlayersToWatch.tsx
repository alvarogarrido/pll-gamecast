import type { GameDetail, GamePreview } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { EmptyState } from '../../molecules/EmptyState';
import { PlayerCompare } from '../../molecules/PlayerCompare';
import { SectionHeader } from '../../molecules/SectionHeader';
import { teamPairColors } from '../../lib/team-style';
import { TopPerformersSkeleton } from '../TopPerformers/TopPerformers';
import { buildPlayersToWatch, isEmptySections } from '../TopPerformers/topPerformers.logic';

export interface PlayersToWatchProps {
  /** `GamePreview['data']`: season stats come from `rosters[*].season`. */
  preview: GamePreview['data'];
  game: GameDetail['data'];
  loading?: boolean;
  className?: string;
}

/** PLAYERS TO WATCH [Pre]: top scorer, goalie and faceoff man of each team by season stats (per-game, 1 decimal). */
export function PlayersToWatch({ preview, game, loading = false, className }: PlayersToWatchProps) {
  if (loading) return <TopPerformersSkeleton title="Players to Watch" className={className} />;
  const sections = buildPlayersToWatch(preview, game);
  const awayName = game.away.team.school;
  const homeName = game.home.team.school;
  const teamColors = teamPairColors(game.away.team.colors, game.home.team.colors);

  return (
    <section aria-label="Players to watch" className={cn('flex flex-col gap-2', className)}>
      <SectionHeader title="Players to Watch" />
      <Card padding="md" className="flex flex-col gap-4">
        {isEmptySections(sections) ? (
          <EmptyState title="No season stats yet" message="Players to watch appear once teams have played." icon="info" />
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

export function PlayersToWatchSkeleton({ className }: { className?: string }) {
  return <TopPerformersSkeleton title="Players to Watch" className={className} />;
}
