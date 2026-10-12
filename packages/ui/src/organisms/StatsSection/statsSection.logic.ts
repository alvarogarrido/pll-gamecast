/**
 * Pure logic for the Stats tab: team comparison rows (also used by KeyTeamStats) and player box-score tables.
 * Only fields that exist in `TeamGameStats` / `PlayerGameStats` are used; derived values are plain ratios of them.
 */
import type { GameDetail, GameStats, PlayerGameStats, PlayerRef, TeamGameStats } from '@pll/data/api';
import { NO_VALUE, clock, formatStat, pct, type StatFormat } from '../../lib/format';

export type Side = 'away' | 'home';

/** True once a game has stat lines to show (live or final, with any activity recorded). */
export function hasGameStats(stats: GameStats['data'] | null | undefined, game: Pick<GameDetail['data'], 'status'>): boolean {
  if (!stats || (game.status !== 'live' && game.status !== 'final')) return false;
  const teamActivity = stats.teams.some((t) => t.shots > 0 || t.faceoffsTaken > 0 || t.turnovers > 0 || t.groundBalls > 0);
  return teamActivity || stats.players.length > 0;
}

export const ratio = (n: number, d: number): number | null => (d > 0 ? n / d : null);

// ---------------------------------------------------------------------------
// Team comparison rows
// ---------------------------------------------------------------------------

export interface TeamStatRow {
  id: string;
  label: string;
  away: number | null;
  home: number | null;
  format?: StatFormat;
  digits?: number;
  lowerIsBetter?: boolean;
  awayDisplay?: string;
  homeDisplay?: string;
}

export interface TeamStatGroup {
  id: string;
  title: string;
  rows: TeamStatRow[];
}

type T = TeamGameStats;

/** A row whose value is one numeric field of each team. */
function field(id: string, label: string, away: T, home: T, pick: (t: T) => number | null, extra: Partial<TeamStatRow> = {}): TeamStatRow {
  return { id, label, away: pick(away), home: pick(home), ...extra };
}

/** `"2 of 4"` text with the efficiency (goals / chances) used to pick the leader. */
function xOfY(id: string, label: string, away: T, home: T, num: (t: T) => number, den: (t: T) => number): TeamStatRow {
  return {
    id,
    label,
    away: ratio(num(away), den(away)),
    home: ratio(num(home), den(home)),
    awayDisplay: `${formatStat(num(away))} of ${formatStat(den(away))}`,
    homeDisplay: `${formatStat(num(home))} of ${formatStat(den(home))}`,
  };
}

const pctRow = (id: string, label: string, away: T, home: T, pick: (t: T) => number | null) =>
  field(id, label, away, home, pick, { format: 'pct' });

/** The Overview card, and the live/post Key Team Stats: goals, shots, shooting %, turnovers, faceoff %, save %. */
export function overviewRows(away: T, home: T): TeamStatRow[] {
  return [
    field('goals', 'Goals', away, home, (t) => t.goals),
    field('shots', 'Shots', away, home, (t) => t.shots),
    pctRow('shotPct', 'Shooting %', away, home, (t) => t.shotPct),
    field('turnovers', 'Turnovers', away, home, (t) => t.turnovers, { lowerIsBetter: true }),
    pctRow('faceoffPct', 'Faceoff %', away, home, (t) => t.faceoffPct),
    pctRow('savePct', 'Save %', away, home, (t) => t.savePct),
  ];
}

/** All Team Stats cards, in order. */
export function teamStatGroups(away: T, home: T): TeamStatGroup[] {
  return [
    { id: 'overview', title: 'Overview', rows: overviewRows(away, home) },
    {
      id: 'shooting',
      title: 'Shooting',
      rows: [
        field('goals', 'Goals', away, home, (t) => t.goals),
        field('shots', 'Shots', away, home, (t) => t.shots),
        pctRow('shotPct', 'Shooting %', away, home, (t) => t.shotPct),
        field('shotsOnGoal', 'Shots on Goal', away, home, (t) => t.shotsOnGoal),
        pctRow('sogPct', 'SOG %', away, home, (t) => ratio(t.shotsOnGoal, t.shots)),
      ],
    },
    {
      id: 'possession',
      title: 'Possession',
      rows: [
        field('groundBalls', 'Ground Balls', away, home, (t) => t.groundBalls),
        field('turnovers', 'Turnovers', away, home, (t) => t.turnovers, { lowerIsBetter: true }),
        field('causedTurnovers', 'Caused Turnovers', away, home, (t) => t.causedTurnovers),
        {
          ...field('clears', 'Clears', away, home, (t) => t.clears),
          awayDisplay: `${formatStat(away.clears)}/${formatStat(away.clearAttempts)}`,
          homeDisplay: `${formatStat(home.clears)}/${formatStat(home.clearAttempts)}`,
        },
        pctRow('clearPct', 'Clear %', away, home, (t) => t.clearPct),
      ],
    },
    {
      id: 'faceoffs',
      title: 'Faceoffs',
      rows: [
        field('faceoffsWon', 'Faceoffs Won', away, home, (t) => t.faceoffsWon),
        pctRow('faceoffPct', 'Faceoff %', away, home, (t) => t.faceoffPct),
      ],
    },
    {
      id: 'goalie',
      title: 'Goalie',
      rows: [
        field('saves', 'Saves', away, home, (t) => t.saves),
        pctRow('savePct', 'Save %', away, home, (t) => t.savePct),
        field('goalsAgainst', 'Goals Against', away, home, (t) => t.goalsAgainst, { lowerIsBetter: true }),
      ],
    },
    {
      id: 'penalties',
      title: 'Extra-Man & Penalties',
      rows: [
        xOfY('emo', 'Extra-Man Goals', away, home, (t) => t.extraManGoals, (t) => t.extraManOpportunities),
        field('penalties', 'Penalties', away, home, (t) => t.penalties, { lowerIsBetter: true }),
        field('penaltySeconds', 'Penalty Minutes', away, home, (t) => t.penaltySeconds, {
          lowerIsBetter: true,
          awayDisplay: clock(away.penaltySeconds),
          homeDisplay: clock(home.penaltySeconds),
        }),
      ],
    },
  ];
}

export function teamsFor(stats: GameStats['data'], game: Pick<GameDetail['data'], 'away' | 'home'>): { away: T; home: T } | null {
  const away = stats.teams.find((t) => t.teamId === game.away.team.id);
  const home = stats.teams.find((t) => t.teamId === game.home.team.id);
  return away && home ? { away, home } : null;
}

// ---------------------------------------------------------------------------
// Player box score
// ---------------------------------------------------------------------------

export interface BoxLine {
  player: PlayerRef;
  stats: PlayerGameStats;
}

export function teamLines(stats: GameStats['data'], teamId: string): BoxLine[] {
  const refs = new Map(stats.playerRefs.map((p) => [p.id, p]));
  return stats.players.flatMap((s) => {
    const player = refs.get(s.playerId);
    return player && s.teamId === teamId ? [{ player, stats: s }] : [];
  });
}

export interface BoxColumn {
  /** Sort key and React key. */
  key: string;
  /** Header text ("G", "FO W-T"). */
  label: string;
  /** Full name for screen readers / tooltip. */
  title: string;
  /** Numeric value to sort on; `null` sorts last. */
  value: (l: BoxLine) => number | null;
  /** Text shown in the cell (defaults to the integer value). */
  display?: (l: BoxLine) => string;
  /**
   * Text of the Totals row (D12). Counts are sums over `rows`; ratios (FO%, SV%) are recomputed from the summed
   * numerators and denominators, never averaged. Defaults to an en dash.
   */
  total?: (rows: readonly BoxLine[]) => string;
}

export interface BoxTable {
  id: 'offense' | 'faceoffs' | 'goalies' | 'penalties';
  title: string;
  columns: BoxColumn[];
  /** Rows that have a stat in this table. */
  rows: BoxLine[];
  /** Column the table starts sorted by (descending). */
  defaultSort: string;
}

const col = (
  key: string,
  label: string,
  title: string,
  value: BoxColumn['value'],
  display?: BoxColumn['display'],
  total?: BoxColumn['total'],
): BoxColumn => ({
  key,
  label,
  title,
  value,
  display,
  total,
});

const num = (pick: (s: PlayerGameStats) => number): BoxColumn['value'] => (l) => pick(l.stats);
const fmt = (pick: (s: PlayerGameStats) => number): BoxColumn['display'] => (l) => formatStat(pick(l.stats));

/** Sum of one stat over the rows of a table. */
const sum = (rows: readonly BoxLine[], pick: (s: PlayerGameStats) => number): number => rows.reduce((acc, l) => acc + pick(l.stats), 0);
const sumFmt = (pick: (s: PlayerGameStats) => number): BoxColumn['total'] => (rows) => formatStat(sum(rows, pick));

const offenseColumns = (): BoxColumn[] => [
  col('goals', 'G', 'Goals', num((s) => s.goals), fmt((s) => s.goals), sumFmt((s) => s.goals)),
  col('assists', 'A', 'Assists', num((s) => s.assists), fmt((s) => s.assists), sumFmt((s) => s.assists)),
  col('points', 'P', 'Points', num((s) => s.points), fmt((s) => s.points), sumFmt((s) => s.points)),
  col('shots', 'SH', 'Shots', num((s) => s.shots), fmt((s) => s.shots), sumFmt((s) => s.shots)),
  col('shotsOnGoal', 'SOG', 'Shots on goal', num((s) => s.shotsOnGoal), fmt((s) => s.shotsOnGoal), sumFmt((s) => s.shotsOnGoal)),
  col('groundBalls', 'GB', 'Ground balls', num((s) => s.groundBalls), fmt((s) => s.groundBalls), sumFmt((s) => s.groundBalls)),
  col('turnovers', 'TO', 'Turnovers', num((s) => s.turnovers), fmt((s) => s.turnovers), sumFmt((s) => s.turnovers)),
  col('causedTurnovers', 'CT', 'Caused turnovers', num((s) => s.causedTurnovers), fmt((s) => s.causedTurnovers), sumFmt((s) => s.causedTurnovers)),
];

const hasOffense = (s: PlayerGameStats) =>
  s.goals + s.assists + s.points + s.shots + s.shotsOnGoal + s.groundBalls + s.turnovers + s.causedTurnovers > 0;

/** Player tables for one team. A table with no rows (nobody has the stat) is left out. */
export function boxTables(lines: readonly BoxLine[]): BoxTable[] {
  const tables: BoxTable[] = [
    {
      id: 'offense',
      title: 'Offense',
      columns: offenseColumns(),
      rows: lines.filter((l) => hasOffense(l.stats)),
      defaultSort: 'points',
    },
    {
      id: 'faceoffs',
      title: 'Faceoffs',
      columns: [
        col('faceoffsWon', 'FO W-T', 'Faceoffs won-taken', num((s) => s.faceoffsWon), (l) => `${formatStat(l.stats.faceoffsWon)}-${formatStat(l.stats.faceoffsTaken)}`, (rows) => `${formatStat(sum(rows, (s) => s.faceoffsWon))}-${formatStat(sum(rows, (s) => s.faceoffsTaken))}`),
        col('faceoffPct', 'FO%', 'Faceoff percentage', (l) => ratio(l.stats.faceoffsWon, l.stats.faceoffsTaken), (l) => pct(ratio(l.stats.faceoffsWon, l.stats.faceoffsTaken)), (rows) => pct(ratio(sum(rows, (s) => s.faceoffsWon), sum(rows, (s) => s.faceoffsTaken)))),
      ],
      rows: lines.filter((l) => l.stats.faceoffsTaken > 0),
      defaultSort: 'faceoffsWon',
    },
    {
      id: 'goalies',
      title: 'Goalies',
      columns: [
        col('saves', 'SV', 'Saves', num((s) => s.saves), fmt((s) => s.saves), sumFmt((s) => s.saves)),
        col('goalsAgainst', 'GA', 'Goals against', num((s) => s.goalsAgainst), fmt((s) => s.goalsAgainst), sumFmt((s) => s.goalsAgainst)),
        col('savePct', 'SV%', 'Save percentage', (l) => ratio(l.stats.saves, l.stats.saves + l.stats.goalsAgainst), (l) => pct(ratio(l.stats.saves, l.stats.saves + l.stats.goalsAgainst)), (rows) => {
          const saves = sum(rows, (s) => s.saves);
          return pct(ratio(saves, saves + sum(rows, (s) => s.goalsAgainst)));
        }),
      ],
      rows: lines.filter((l) => l.stats.saves + l.stats.goalsAgainst > 0),
      defaultSort: 'saves',
    },
    {
      id: 'penalties',
      title: 'Penalties',
      columns: [
        col('penalties', 'PEN', 'Penalties', num((s) => s.penalties), fmt((s) => s.penalties), sumFmt((s) => s.penalties)),
        col('penaltySeconds', 'PIM', 'Penalty minutes', num((s) => s.penaltySeconds), (l) => clock(l.stats.penaltySeconds), (rows) => clock(sum(rows, (s) => s.penaltySeconds))),
      ],
      rows: lines.filter((l) => l.stats.penalties > 0 || l.stats.penaltySeconds > 0),
      defaultSort: 'penaltySeconds',
    },
  ];
  return tables.filter((t) => t.rows.length > 0);
}

/** The Totals row of a table (D12): one text per column, in column order. Sums over every row of the table. */
export function boxTotals(table: Pick<BoxTable, 'columns' | 'rows'>): string[] {
  return table.columns.map((c) => (c.total ? c.total(table.rows) : NO_VALUE));
}

export interface BoxSort {
  /** A column key, or `'player'` for the name column. */
  key: string;
  direction: 'asc' | 'desc';
}

const byName = (a: BoxLine, b: BoxLine) =>
  a.player.lastName.localeCompare(b.player.lastName) || a.player.firstName.localeCompare(b.player.firstName);

/** Default order for offense ties: points, goals, then name. */
const byPoints = (a: BoxLine, b: BoxLine) =>
  b.stats.points - a.stats.points || b.stats.goals - a.stats.goals || byName(a, b);

/** Sorted copy of a table's rows. Missing values (`null`) always go last; ties fall back to points then name. */
export function sortBoxRows(table: BoxTable, sort: BoxSort): BoxLine[] {
  const sign = sort.direction === 'asc' ? 1 : -1;
  const column = table.columns.find((c) => c.key === sort.key);
  return [...table.rows].sort((a, b) => {
    if (sort.key === 'player') return sign * byName(a, b);
    if (!column) return byPoints(a, b);
    const va = column.value(a);
    const vb = column.value(b);
    if (va === null && vb === null) return byPoints(a, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return sign * (va - vb) || byPoints(a, b);
  });
}

/** Next sort after clicking a header: a new column starts descending (names ascending); the same one flips. */
export function nextSort(current: BoxSort, key: string): BoxSort {
  if (current.key === key) return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
  return { key, direction: key === 'player' ? 'asc' : 'desc' };
}
