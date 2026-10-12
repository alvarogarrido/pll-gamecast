import type { GamePreview } from '@pll/data/api';
import type { TeamStatRow } from '../StatsSection/statsSection.logic';

export { overviewRows as gameTotalsRows } from '../StatsSection/statsSection.logic';

type Averages = GamePreview['data']['seasonAverages']['home'];

/** A season value, or `null` (en dash) when the team has not played yet. */
const season = (a: Averages, value: number): number | null => (a.gamesPlayed > 0 ? value : null);

/**
 * Pregame rows: per-game averages to 1 decimal (scores, shots, turnovers), then season percentages.
 * Turnovers per game is lower-is-better.
 */
export function seasonAverageRows(away: Averages, home: Averages): TeamStatRow[] {
  const row = (id: string, label: string, pick: (a: Averages) => number, extra: Partial<TeamStatRow> = {}): TeamStatRow => ({
    id,
    label,
    away: season(away, pick(away)),
    home: season(home, pick(home)),
    ...extra,
  });
  return [
    row('scores', 'Scores/Game', (a) => a.scoresPerGame, { format: 'decimal', digits: 1 }),
    row('shots', 'Shots/Game', (a) => a.shotsPerGame, { format: 'decimal', digits: 1 }),
    row('shootingPct', 'Shooting %', (a) => a.shootingPct, { format: 'pct' }),
    row('turnovers', 'Turnovers/Game', (a) => a.turnoversPerGame, { format: 'decimal', digits: 1, lowerIsBetter: true }),
    row('faceoffPct', 'Faceoff %', (a) => a.faceoffPct, { format: 'pct' }),
    row('savePct', 'Save %', (a) => a.savePct, { format: 'pct' }),
  ];
}
