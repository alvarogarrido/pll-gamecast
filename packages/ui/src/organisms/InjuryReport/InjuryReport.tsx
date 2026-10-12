import { useId } from 'react';
import type { GameDetail, GamePreview } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { Chip } from '../../atoms/Chip';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { PlayerIdentity } from '../../molecules/PlayerIdentity';
import { SectionHeader } from '../../molecules/SectionHeader';
import { TeamIdentity } from '../../molecules/TeamIdentity';
import { cn } from '../../lib/cn';
import { groupInjuries, hasInjuries, injuryStatusLabel, injuryTone, type InjuryGame } from './injury.logic';

export interface InjuryReportProps {
  /** `GamePreview['data']['injuries']`. Players from other teams are ignored. */
  injuries: GamePreview['data']['injuries'];
  /** Only the two sides are read (`GameDetail['data']`). */
  game: InjuryGame | GameDetail['data'];
  /** Placeholder rows while the data loads. */
  loading?: boolean;
  className?: string;
}

/**
 * Injury Report [Pre/Live]: players grouped by team, most severe first. Each row has the player (photo, name, #, position,
 * class), the injury description and a status chip: out = negative tint, doubtful/questionable = gold, day-to-day = neutral.
 */
export function InjuryReport({ injuries, game, loading = false, className }: InjuryReportProps) {
  const titleId = useId();
  const groups = groupInjuries(injuries, game);

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>Injury report</span>} />
      {loading ? (
        <InjuryReportSkeleton />
      ) : !hasInjuries(groups) ? (
        <EmptyState icon="plaster" title="No injuries reported" message="Both teams are listed as healthy." />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.team.id} data-side={group.side} className="flex flex-col gap-2">
              <div className="border-b border-border-hairline pb-2">
                <TeamIdentity team={group.team} size="sm" nameStyle="full" />
              </div>
              {group.injuries.length === 0 ? (
                <p className="px-1 text-footnote text-text-tertiary">No reported injuries.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {group.injuries.map((injury) => (
                    <li
                      key={injury.playerId}
                      className="flex items-center justify-between gap-2 rounded-sm bg-surface-track p-2"
                    >
                      <PlayerIdentity player={injury.player} teamColor={group.team.colors.primary} size="sm" avatarFallback="initials" />
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Chip tone={injuryTone(injury.status)} size="sm">
                          {injuryStatusLabel(injury.status)}
                        </Chip>
                        <span className="max-w-24 truncate text-caption text-text-secondary" title={injury.description}>
                          {injury.description}
                        </span>
                      </div>
                    </li>
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

export function InjuryReportSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status">
      <span className="sr-only">Loading injury report</span>
      <Skeleton className="h-7 w-40" variant="rect" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rect" className="h-12 w-full" />
      ))}
    </div>
  );
}
