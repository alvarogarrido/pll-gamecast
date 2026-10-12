import { useId } from 'react';
import type { GameDetail, GamePreview, PreviousResult } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { TeamIdentity } from '../../molecules/TeamIdentity';
import { cn } from '../../lib/cn';
import { dateLabel, NO_VALUE } from '../../lib/format';
import { hasAnyResults, lastResults, resultScore, venueMarker } from './previous.logic';

type Game = Pick<GameDetail['data'], 'home' | 'away'>;

export interface PreviousResultsProps {
  /** `GamePreview['data']['previousResults']`. */
  previousResults: GamePreview['data']['previousResults'];
  game: Game;
  loading?: boolean;
  className?: string;
}

function ResultRow({ result }: { result: PreviousResult }) {
  const won = result.result === 'W';
  const marker = venueMarker(result);
  const opponent = result.opponent;
  return (
    <li className="flex items-center gap-2 rounded-sm bg-surface-track p-2" title={`${opponent.school}, ${dateLabel(result.startTime)}`}>
      <span
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-caption font-semibold',
          won ? 'bg-live-tint text-status-positive' : 'bg-negative-tint text-status-negative',
        )}
      >
        <span aria-hidden="true">{result.result}</span>
        <span className="sr-only">{won ? 'Win' : 'Loss'}</span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span className="w-4 shrink-0 text-center text-caption text-text-tertiary">
          <span className="sr-only">{marker === 'vs' ? 'Home against' : 'Away at'}</span>
          <span aria-hidden="true">{marker}</span>
        </span>
        <TeamLogo
          src={opponent.logoUrl}
          name={`${opponent.school} ${opponent.mascot}`}
          abbreviation={opponent.abbreviation}
          color={opponent.colors.primary}
          size="sm"
        />
        {/* Wide (stacked) rows have room for the opponent code and date; two-column rows keep only the logo. */}
        <span className="hidden min-w-0 flex-col @max-xs:flex">
          <span className="truncate text-footnote font-semibold text-text-primary">{opponent.abbreviation}</span>
          <span className="text-caption2 text-text-tertiary">{dateLabel(result.startTime)}</span>
        </span>
      </span>
      <span className="shrink-0 font-display text-headline font-semibold tabular-nums text-text-primary">{resultScore(result)}</span>
    </li>
  );
}

/**
 * Previous 3 Results [Pre]: one column per team (away left, home right), three games each: W/L badge, `vs`/`@` with the
 * opponent logo, and the score with the team's own score first. Stacks to one column in a container narrower than 20rem.
 */
export function PreviousResults({ previousResults, game, loading = false, className }: PreviousResultsProps) {
  const titleId = useId();
  const columns = [
    { side: 'away' as const, gameSide: game.away, results: lastResults(previousResults.away) },
    { side: 'home' as const, gameSide: game.home, results: lastResults(previousResults.home) },
  ];

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('@container flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>Last 3 games</span>} />
      {loading ? (
        <PreviousResultsSkeleton />
      ) : !hasAnyResults(previousResults) ? (
        <EmptyState icon="calendar" title="No games played yet" message="Results show up once either team has played." />
      ) : (
        <div className="grid grid-cols-1 gap-4 @xs:grid-cols-2">
          {columns.map(({ side, gameSide, results }) => (
            <div key={side} data-side={side} className="flex min-w-0 flex-col gap-2">
              <div className="border-b border-border-hairline pb-2">
                <TeamIdentity team={gameSide.team} size="sm" />
              </div>
              {results.length === 0 ? (
                <p className="px-1 text-footnote text-text-tertiary">No games yet {NO_VALUE}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {results.map((r) => (
                    <ResultRow key={r.gameId} result={r} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function PreviousResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 @xs:grid-cols-2" role="status">
      <span className="sr-only">Loading previous results</span>
      {[0, 1].map((c) => (
        <div key={c} className="flex flex-col gap-2">
          <Skeleton variant="rect" className="h-8 w-28" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rect" className="h-12 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
