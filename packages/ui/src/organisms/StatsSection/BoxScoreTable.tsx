'use client';

import { useState } from 'react';
import { cn } from '../../lib/cn';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableFooter,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
} from '../../molecules/DataTable';
import { PlayerIdentity } from '../../molecules/PlayerIdentity';
import { boxTotals, nextSort, sortBoxRows, type BoxSort, type BoxTable } from './statsSection.logic';

export interface BoxScoreTableProps {
  table: BoxTable;
  /** Team name for the table caption ("Duke offense"). */
  teamName: string;
  teamColor: string;
  className?: string;
}

/** One sortable player table (sticky player column, numeric columns, a Totals footer row). Sorted by its `defaultSort` descending at first. */
export function BoxScoreTable({ table, teamName, teamColor, className }: BoxScoreTableProps) {
  const [sort, setSort] = useState<BoxSort>({ key: table.defaultSort, direction: 'desc' });
  const rows = sortBoxRows(table, sort);
  const totals = boxTotals(table);
  const dir = (key: string) => (sort.key === key ? sort.direction : 'none');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h3 className="text-headline font-semibold text-text-primary">{table.title}</h3>
      <DataTable caption={`${teamName} ${table.title.toLowerCase()}`} wrapperClassName="border border-border-default">
        <DataTableHeader>
          <DataTableRow zebra={false}>
            <DataTableHeadCell sticky sort={dir('player')} onSort={() => setSort(nextSort(sort, 'player'))}>
              Player
            </DataTableHeadCell>
            {table.columns.map((c) => (
              <DataTableHeadCell
                key={c.key}
                numeric
                title={c.title}
                sort={dir(c.key)}
                onSort={() => setSort(nextSort(sort, c.key))}
              >
                {c.label}
              </DataTableHeadCell>
            ))}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {rows.map((line) => (
            <DataTableRow key={line.player.id}>
              <DataTableCell sticky className="min-w-36">
                <PlayerIdentity player={line.player} teamColor={teamColor} size="sm" />
              </DataTableCell>
              {table.columns.map((c) => (
                <DataTableCell key={c.key} numeric className={sort.key === c.key ? 'font-semibold' : undefined}>
                  {c.display ? c.display(line) : (c.value(line) ?? '')}
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
        {/* D12: a Totals row. Counts are sums of the rows above, percentages are recomputed from the sums. */}
        <DataTableFooter>
          <DataTableRow zebra={false} className="bg-surface-raised">
            <DataTableCell sticky className="border-t border-t-border-default">
              Totals
            </DataTableCell>
            {table.columns.map((c, i) => (
              <DataTableCell key={c.key} numeric className="border-t border-t-border-default">
                {totals[i]}
              </DataTableCell>
            ))}
          </DataTableRow>
        </DataTableFooter>
      </DataTable>
    </div>
  );
}
