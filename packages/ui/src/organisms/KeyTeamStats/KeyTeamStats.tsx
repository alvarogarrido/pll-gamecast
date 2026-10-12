import type { GameDetail, GamePreview, GameStats } from '@pll/data/api';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { StatCard } from '../StatsSection/StatCard';
import { teamsFor } from '../StatsSection/statsSection.logic';
import { gameTotalsRows, seasonAverageRows } from './keyTeamStats.logic';

export interface KeyTeamStatsProps {
  game: GameDetail['data'];
  /** Live/Post: game totals from `stats.teams`. Used when the game is live or final. */
  stats?: GameStats['data'];
  /** Pre: season averages from `preview.seasonAverages`. Used otherwise. */
  preview?: GamePreview['data'];
  /** "See all stats" action as a button (e.g. switch to the Stats tab)... */
  onSeeAll?: () => void;
  /** ...or as a link. */
  seeAllHref?: string;
  loading?: boolean;
  className?: string;
}

const seeAllClass =
  'flex min-h-10 w-full items-center justify-center gap-1 border-t border-border-hairline text-footnote font-semibold text-link hover:text-text-primary';

/**
 * KEY TEAM STATS: compact two-team comparison. Pregame shows season averages (1 decimal), live and final show this
 * game's totals. The team logos sit in the card header like the Figma Overview block.
 */
export function KeyTeamStats({ game, stats, preview, onSeeAll, seeAllHref, loading = false, className }: KeyTeamStatsProps) {
  if (loading) return <KeyTeamStatsSkeleton className={className} />;

  const started = game.status === 'live' || game.status === 'final';
  const totals = started && stats ? teamsFor(stats, game) : null;
  const rows = totals
    ? gameTotalsRows(totals.away, totals.home)
    : preview
      ? seasonAverageRows(preview.seasonAverages.away, preview.seasonAverages.home)
      : null;

  const footer =
    seeAllHref !== undefined ? (
      <a href={seeAllHref} className={seeAllClass}>
        See all stats <Icon name="chevron-right" size={16} />
      </a>
    ) : onSeeAll ? (
      <button type="button" onClick={onSeeAll} className={seeAllClass}>
        See all stats <Icon name="chevron-right" size={16} />
      </button>
    ) : undefined;

  return (
    <section aria-label="Key team stats" className={cn('flex flex-col gap-2', className)}>
      <SectionHeader title="Key Team Stats" />
      {rows ? (
        <StatCard title={totals ? 'Game' : 'Season Avg'} game={game} rows={rows} footer={footer} />
      ) : (
        <Card>
          <EmptyState title="No team stats yet" message="Team comparisons appear once stats are available." />
        </Card>
      )}
    </section>
  );
}

export function KeyTeamStatsSkeleton({ className }: { className?: string }) {
  return (
    <section aria-label="Key team stats" aria-busy="true" className={cn('flex flex-col gap-2', className)}>
      <SectionHeader title="Key Team Stats" />
      <Card className="flex flex-col gap-3">
        <span className="sr-only">Loading</span>
        <div className="flex items-center justify-between">
          <Skeleton variant="circle" className="size-7" />
          <Skeleton variant="circle" className="size-7" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </Card>
    </section>
  );
}
