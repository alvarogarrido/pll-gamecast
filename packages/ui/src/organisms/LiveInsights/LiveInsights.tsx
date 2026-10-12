'use client';

import { useId, useState } from 'react';
import type { GameSummary, Insight } from '@pll/data/api';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { clock, periodLabel } from '../../lib/format';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { insightIcon, insightKindLabel, splitInsights } from './liveInsights.logic';

export interface LiveInsightsProps {
  insights: readonly Insight[];
  /** Used to look up the team (logo, name) of each insight through `home.team` / `away.team`. */
  game: Pick<GameSummary, 'home' | 'away'>;
  /** Older insights shown before "Show more". Default 3. */
  maxOlder?: number;
  loading?: boolean;
  className?: string;
}

export function LiveInsightsSkeleton({ className }: { className?: string }) {
  return (
    <Card role="status" aria-busy="true" className={cn('flex flex-col gap-3', className)}>
      <span className="sr-only">Loading insights</span>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton variant="rect" className="h-20 w-full" />
      <Skeleton variant="rect" className="h-12 w-full" />
    </Card>
  );
}

function InsightTeamLogo({ game, teamId }: { game: LiveInsightsProps['game']; teamId: string | null }) {
  const team = teamId === game.home.team.id ? game.home.team : teamId === game.away.team.id ? game.away.team : null;
  if (!team) return null;
  return (
    <TeamLogo
      src={team.logoUrl}
      name={`${team.school} ${team.mascot}`}
      abbreviation={team.abbreviation}
      color={team.colors.primary}
      size="sm"
      decorative
    />
  );
}

const when = (i: Insight) => `${periodLabel(i.period)} ${clock(i.clockSeconds)}`;

function LatestInsight({ insight, game }: { insight: Insight; game: LiveInsightsProps['game'] }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-latest
      className="rounded-md border border-l-4 border-border-default border-l-accent-gold bg-gold-tint p-4"
    >
      <div className="flex items-center gap-2 text-caption text-accent-gold">
        <Icon name={insightIcon(insight.kind)} size={20} />
        <span className="font-semibold uppercase">{insightKindLabel(insight.kind)}</span>
        <span className="ml-auto font-display text-clock text-text-secondary">{when(insight)}</span>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <InsightTeamLogo game={game} teamId={insight.teamId} />
        <div className="min-w-0">
          <p className="text-headline text-text-primary">{insight.title}</p>
          <p className="mt-1 text-subhead text-text-secondary">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

function OlderInsight({ insight, game }: { insight: Insight; game: LiveInsightsProps['game'] }) {
  return (
    <li className="flex items-start gap-3 rounded-md bg-surface-track px-3 py-2">
      <InsightTeamLogo game={game} teamId={insight.teamId} />
      <div className="min-w-0 flex-1">
        <p className="text-footnote font-semibold text-text-primary">{insight.title}</p>
        <p className="text-footnote text-text-secondary">{insight.body}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-text-tertiary">
        <span className="font-display text-clock">{when(insight)}</span>
        <Icon name={insightIcon(insight.kind)} size={16} title={insightKindLabel(insight.kind)} />
      </div>
    </li>
  );
}

/**
 * Live Game Insights. The latest insight is a larger card with a gold edge and tint (polite live region, so a new one
 * is announced); older ones follow as compact rows, three at first, the rest behind "Show more".
 */
export function LiveInsights({ insights, game, maxOlder = 3, loading = false, className }: LiveInsightsProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (loading) return <LiveInsightsSkeleton className={className} />;

  const { latest, older, hidden } = splitInsights(insights, { maxOlder, expanded });
  const canCollapse = expanded && insights.length - 1 > maxOlder;

  return (
    <Card as="section" aria-label="Live insights" className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title="Insights" />
      {!latest ? (
        <EmptyState icon="fire" message="Streaks, runs and milestones show up here as the game develops." />
      ) : (
        <>
          <LatestInsight insight={latest} game={game} />
          {(older.length > 0 || hidden > 0) && (
            <ul id={listId} className="flex flex-col gap-2">
              {older.map((i) => (
                <OlderInsight key={i.id} insight={i} game={game} />
              ))}
            </ul>
          )}
          {(hidden > 0 || canCollapse) && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex min-h-10 items-center justify-center gap-1 self-center rounded-pill px-3 text-footnote font-semibold text-link hover:underline"
            >
              {expanded ? 'Show less' : `Show more (${hidden})`}
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} />
            </button>
          )}
        </>
      )}
    </Card>
  );
}
