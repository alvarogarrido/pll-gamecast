'use client';

import { useId, useState } from 'react';
import type { ConferenceStandings as ConferenceStandingsData, GameDetail } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { RankBadge } from '../../atoms/RankBadge';
import { Skeleton } from '../../atoms/Skeleton';
import { Tabs, tabPanelProps } from '../../atoms/Tabs';
import { TeamLogo } from '../../atoms/TeamLogo';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';
import { isGameTeam, sortStandings, standingsCells, standingsView } from './standings.logic';

export interface ConferenceStandingsProps {
  /** `GamePreview['data']['standings']`: one table when both teams share a conference, otherwise two. */
  standings: ConferenceStandingsData[];
  /** The two teams of this game are highlighted in the table. */
  game: Pick<GameDetail['data'], 'home' | 'away'>;
  loading?: boolean;
  className?: string;
}

function StandingsTable({
  table,
  game,
}: {
  table: ConferenceStandingsData;
  game: ConferenceStandingsProps['game'];
}) {
  // A plain fixed-layout table (not DataTable): six narrow columns must fit from 320px without horizontal scroll.
  // D11: separate Conf W, Conf L, W, L columns. Two header rows: the group (Conf / Overall) spans its W and L.
  const head = 'text-caption font-medium text-text-secondary';
  const num = 'px-1 text-right';
  return (
    <div className="@container">
    <table className="w-full table-fixed border-separate border-spacing-0 text-footnote">
      <caption className="sr-only">{table.name} standings</caption>
      {/* Column widths live here: with two header rows (group + W/L) the first row alone would split the width evenly. */}
      <colgroup>
        <col className="w-8" />
        <col />
        <col className="w-8" />
        <col className="w-8" />
        <col className="w-8" />
        <col className="w-8" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" rowSpan={2} className={cn(head, 'px-2 border-b border-border-default text-left align-bottom')}>
            #
          </th>
          <th scope="col" rowSpan={2} className={cn(head, 'px-2 border-b border-border-default pb-2 text-left align-bottom')}>
            Team
          </th>
          <th scope="colgroup" colSpan={2} className={cn(head, 'px-1 pt-2 text-center')}>
            Conf
          </th>
          <th scope="colgroup" colSpan={2} className={cn(head, 'border-l border-border-hairline px-1 pt-2 text-center')}>
            Overall
          </th>
        </tr>
        <tr>
          <th scope="col" className={cn(head, num, 'border-b border-border-default py-1')}>
            <abbr title="Conference wins" className="no-underline">
              W
            </abbr>
          </th>
          <th scope="col" className={cn(head, num, 'border-b border-border-default py-1')}>
            <abbr title="Conference losses" className="no-underline">
              L
            </abbr>
          </th>
          <th scope="col" className={cn(head, num, 'border-b border-l border-border-default border-l-border-hairline py-1')}>
            <abbr title="Overall wins" className="no-underline">
              W
            </abbr>
          </th>
          <th scope="col" className={cn(head, num, 'border-b border-border-default py-1')}>
            <abbr title="Overall losses" className="no-underline">
              L
            </abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {sortStandings(table.rows).map((row, index) => {
          const highlighted = isGameTeam(row, game);
          const cell = 'border-b border-border-hairline py-2';
          const cells = standingsCells(row);
          return (
            <tr
              key={row.team.id}
              data-highlighted={highlighted ? '' : undefined}
              aria-current={highlighted ? 'true' : undefined}
              className={cn(highlighted && 'bg-accent-gold-subtle')}
            >
              <td
                className={cn(cell, 'px-2 tabular-nums', highlighted ? 'border-l-2 border-l-accent-gold text-text-primary' : 'text-text-secondary')}
              >
                {index + 1}
              </td>
              <td className={cn(cell, 'px-2')}>
                <span className="flex min-w-0 items-center gap-2">
                  <TeamLogo
                    src={row.team.logoUrl}
                    name={`${row.team.school} ${row.team.mascot}`}
                    abbreviation={row.team.abbreviation}
                    color={row.team.colors.primary}
                    size="xs"
                    decorative
                  />
                  {/* Abbreviation in narrow containers (as in the header), the school name from 448px up. */}
                  <span className={cn('min-w-0 truncate text-text-primary', highlighted && 'font-semibold')}>
                    <span className="sr-only @md:not-sr-only">{row.team.school}</span>
                    <span aria-hidden="true" className="@md:hidden">
                      {row.team.abbreviation}
                    </span>
                  </span>
                  <RankBadge rank={row.rank} className="shrink-0" />
                </span>
              </td>
              <td className={cn(cell, 'px-1 text-right tabular-nums text-text-primary')}>{cells.confWins}</td>
              <td className={cn(cell, 'px-1 text-right tabular-nums text-text-primary')}>{cells.confLosses}</td>
              <td className={cn(cell, 'border-l border-l-border-hairline px-1 text-right tabular-nums text-text-secondary')}>{cells.wins}</td>
              <td className={cn(cell, 'px-1 text-right tabular-nums text-text-secondary')}>{cells.losses}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

/**
 * Team Conference Standings [Pre]: one table when both teams share a conference; otherwise a segmented control switches
 * between the two conferences (starting on the away team's). Rows: position, logo + team (with national rank), Conf W, Conf L, W and L
 * as four separate columns (D11). The two teams in this game are highlighted in gold.
 */
export function ConferenceStandings({ standings, game, loading = false, className }: ConferenceStandingsProps) {
  const titleId = useId();
  const idBase = useId();
  const { tables, defaultConferenceId } = standingsView(standings, game);
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = tables.some((t) => t.conferenceId === selected) ? selected : defaultConferenceId;
  const active = tables.find((t) => t.conferenceId === activeId);
  if (loading) return <StandingsSkeleton className={className} />;

  return (
    <Card as="section" aria-labelledby={titleId} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>Standings</span>} />
      {!active ? (
        <EmptyState icon="standings" title="Standings unavailable" message="Conference standings appear once the season is under way." />
      ) : tables.length === 1 ? (
        <>
          <p className="text-footnote text-text-secondary">{active.name}</p>
          <StandingsTable table={active} game={game} />
        </>
      ) : (
        <>
          <Tabs
            ariaLabel="Conference"
            idBase={idBase}
            fullWidth
            size="sm"
            value={active.conferenceId}
            onValueChange={setSelected}
            items={tables.map((t) => ({ value: t.conferenceId, label: t.shortName }))}
          />
          <div {...tabPanelProps(idBase, active.conferenceId)} className="flex flex-col gap-2">
            <p className="text-footnote text-text-secondary">{active.name}</p>
            <StandingsTable table={active} game={game} />
          </div>
        </>
      )}
    </Card>
  );
}

/** The same card and title as {@link ConferenceStandings}, with placeholder rows. */
export function StandingsSkeleton({ className }: { className?: string }) {
  return (
    <Card as="section" aria-label="Standings" aria-busy="true" className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title="Standings" />
      <div className="flex flex-col gap-2" role="status">
        <span className="sr-only">Loading standings</span>
        <Skeleton variant="rect" className="h-8 w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rect" className="h-8 w-full" />
        ))}
      </div>
    </Card>
  );
}
