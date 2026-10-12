'use client';

import { useState } from 'react';
import type { GameDetail, GameStats } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { Tabs, tabPanelProps, type TabItem } from '../../atoms/Tabs';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { TeamIdentity } from '../../molecules/TeamIdentity';
import { BoxScoreTable } from './BoxScoreTable';
import { StatCard } from './StatCard';
import { boxTables, hasGameStats, teamLines, teamStatGroups, teamsFor, type Side } from './statsSection.logic';

export type StatsView = 'team' | Side;

export interface StatsSectionProps {
  stats: GameStats['data'];
  game: GameDetail['data'];
  /** Initial view when uncontrolled. Default `team`. */
  defaultView?: StatsView;
  /** Controlled view. Pair with `onViewChange`. */
  view?: StatsView;
  onViewChange?: (view: StatsView) => void;
  loading?: boolean;
  className?: string;
}

/**
 * STATS tab [Live/Post]: a segmented control (Team Stats | away logo | home logo). Team Stats stacks comparison cards;
 * a team view shows that team's box score tables. Before the game there are no stats, so it shows an empty state.
 */
export function StatsSection({ stats, game, defaultView = 'team', view, onViewChange, loading = false, className }: StatsSectionProps) {
  const [inner, setInner] = useState<StatsView>(defaultView);
  const current = view ?? inner;
  const idBase = `stats-${game.id}`;

  if (loading) return <StatsSectionSkeleton className={className} />;

  if (!hasGameStats(stats, game)) {
    return (
      <section aria-label="Stats" className={cn('flex flex-col gap-2', className)}>
        <SectionHeader title="Stats" />
        <Card>
          <EmptyState
            title={game.status === 'live' ? 'Stats are on the way' : 'No stats yet'}
            message={game.status === 'live' ? 'Team and player stats appear as the game gets going.' : 'Team and player stats appear once the game starts.'}
            icon="info"
          />
        </Card>
      </section>
    );
  }

  const change = (next: StatsView) => {
    setInner(next);
    onViewChange?.(next);
  };

  const logo = (side: Side) => {
    const t = game[side].team;
    return <TeamLogo src={t.logoUrl} name={`${t.school} ${t.mascot}`} abbreviation={t.abbreviation} color={t.colors.primary} size="sm" />;
  };
  const items: TabItem<StatsView>[] = [
    { value: 'team', label: 'Team Stats' },
    { value: 'away', label: logo('away') },
    { value: 'home', label: logo('home') },
  ];

  return (
    <section aria-label="Stats" className={cn('flex flex-col gap-4', className)}>
      <h2 className="sr-only">Stats</h2>
      <Tabs items={items} value={current} onValueChange={change} ariaLabel="Stats view" idBase={idBase} fullWidth />
      <div {...tabPanelProps(idBase, current)} className="flex flex-col gap-4">
        {current === 'team' ? <TeamStatsView stats={stats} game={game} /> : <TeamBoxScore stats={stats} game={game} side={current} />}
      </div>
    </section>
  );
}

function TeamStatsView({ stats, game }: { stats: GameStats['data']; game: GameDetail['data'] }) {
  const teams = teamsFor(stats, game);
  if (!teams) return <EmptyState message="Team stats are not available." />;
  return (
    <>
      {teamStatGroups(teams.away, teams.home).map((g) => (
        <StatCard key={g.id} title={g.title} game={game} rows={g.rows} />
      ))}
    </>
  );
}

function TeamBoxScore({ stats, game, side }: { stats: GameStats['data']; game: GameDetail['data']; side: Side }) {
  const { team, record, rank } = game[side];
  const tables = boxTables(teamLines(stats, team.id));
  return (
    <>
      <TeamIdentity team={team} size="md" side="away" rank={rank} record={record} />
      {tables.length === 0 ? (
        <Card>
          <EmptyState message={`No player stats for ${team.school} yet.`} />
        </Card>
      ) : (
        tables.map((t) => <BoxScoreTable key={`${team.id}-${t.id}`} table={t} teamName={team.school} teamColor={team.colors.primary} />)
      )}
    </>
  );
}

export function StatsSectionSkeleton({ className }: { className?: string }) {
  return (
    <section aria-label="Stats" aria-busy="true" className={cn('flex flex-col gap-4', className)}>
      <span className="sr-only">Loading</span>
      <Skeleton variant="rect" className="h-12 w-full rounded-pill" />
      {[0, 1, 2].map((i) => (
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6" />
          {[0, 1, 2, 3].map((j) => (
            <Skeleton key={j} className="h-5" />
          ))}
        </Card>
      ))}
    </section>
  );
}
