import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { playerMeta, playerShortName, pct } from '../../lib/format';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableFooter,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  type SortDirection,
} from './DataTable';

const meta = {
  title: 'Molecules/DataTable',
  component: DataTable,
  args: { caption: 'Box score', children: null },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataTable>;
export default meta;
type Story = StoryObj<typeof meta>;

type Row = {
  id: string;
  name: string;
  meta: string;
  g: number;
  a: number;
  pts: number;
  sh: number;
  sog: number;
  gb: number;
  to: number;
  ct: number;
};

function useBoxScoreRows(teamSide: 'away' | 'home'): { rows: Row[]; school: string } {
  const game = fixtures.game(GAMES.liveQ4);
  const stats = fixtures.stats(GAMES.liveQ4);
  const teamId = game[teamSide].team.id;
  const rows = stats.players
    .filter((p) => p.teamId === teamId)
    .map((p): Row => {
      const ref = stats.playerRefs.find((r) => r.id === p.playerId)!;
      return {
        id: p.playerId,
        name: playerShortName(ref),
        meta: playerMeta(ref),
        g: p.goals,
        a: p.assists,
        pts: p.points,
        sh: p.shots,
        sog: p.shotsOnGoal,
        gb: p.groundBalls,
        to: p.turnovers,
        ct: p.causedTurnovers,
      };
    });
  return { rows, school: game[teamSide].team.school };
}

const columns: { key: keyof Row; label: string }[] = [
  { key: 'g', label: 'G' },
  { key: 'a', label: 'A' },
  { key: 'pts', label: 'PTS' },
  { key: 'sh', label: 'SH' },
  { key: 'sog', label: 'SOG' },
  { key: 'gb', label: 'GB' },
  { key: 'to', label: 'TO' },
  { key: 'ct', label: 'CT' },
];

/** Wide table in a narrow container: scroll sideways, the Player column stays pinned, the right edge fades. */
export const BoxScore: Story = {
  render: (args) => {
    const { rows, school } = useBoxScoreRows('away');
    return (
      <DataTable {...args} caption={`${school} box score`}>
        <DataTableHeader>
          <DataTableRow zebra={false}>
            <DataTableHeadCell sticky>Player</DataTableHeadCell>
            {columns.map((c) => (
              <DataTableHeadCell key={c.key} numeric>{c.label}</DataTableHeadCell>
            ))}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {rows.map((r) => (
            <DataTableRow key={r.id}>
              <DataTableCell sticky className="min-w-36">
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-caption text-text-secondary">{r.meta}</span>
              </DataTableCell>
              {columns.map((c) => (
                <DataTableCell key={c.key} numeric>{r[c.key]}</DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
        <DataTableFooter>
          <DataTableRow zebra={false}>
            <DataTableCell sticky>Total</DataTableCell>
            {columns.map((c) => (
              <DataTableCell key={c.key} numeric>{rows.reduce((sum, r) => sum + (r[c.key] as number), 0)}</DataTableCell>
            ))}
          </DataTableRow>
        </DataTableFooter>
      </DataTable>
    );
  },
};

/** Controlled sorting: the header cells expose `aria-sort`; the story sorts its own rows. */
export const Sortable: Story = {
  render: (args) => {
    const { rows, school } = useBoxScoreRows('home');
    const [sort, setSort] = useState<{ key: keyof Row; dir: SortDirection }>({ key: 'pts', dir: 'desc' });
    const sorted = useMemo(
      () => [...rows].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * ((a[sort.key] as number) - (b[sort.key] as number))),
      [rows, sort],
    );
    return (
      <DataTable {...args} caption={`${school} box score, sortable`}>
        <DataTableHeader>
          <DataTableRow zebra={false}>
            <DataTableHeadCell sticky>Player</DataTableHeadCell>
            {columns.map((c) => (
              <DataTableHeadCell
                key={c.key}
                numeric
                sort={sort.key === c.key ? sort.dir : 'none'}
                onSort={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === 'desc' ? 'asc' : 'desc' }))}
              >
                {c.label}
              </DataTableHeadCell>
            ))}
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {sorted.map((r) => (
            <DataTableRow key={r.id}>
              <DataTableCell sticky>{r.name}</DataTableCell>
              {columns.map((c) => (
                <DataTableCell key={c.key} numeric>{r[c.key]}</DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    );
  },
};

/** Fits the container: no fade, no scroll. Mirrors the pregame "Goalie Comparison" table. */
export const FitsContainer: Story = {
  render: (args) => (
    <DataTable {...args} caption="Goalie comparison">
      <DataTableHeader>
        <DataTableRow zebra={false}>
          <DataTableHeadCell>Goalie</DataTableHeadCell>
          <DataTableHeadCell numeric>GP</DataTableHeadCell>
          <DataTableHeadCell numeric>Sv%</DataTableHeadCell>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {[['N. Washua', 2, 0.63], ['B. Dobson', 6, 0.59], ['L. McNaney', 7, 0.56]].map(([n, gp, sv]) => (
          <DataTableRow key={n}>
            <DataTableCell>{n}</DataTableCell>
            <DataTableCell numeric>{gp}</DataTableCell>
            <DataTableCell numeric>{pct(sv as number, 0)}</DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  ),
};
