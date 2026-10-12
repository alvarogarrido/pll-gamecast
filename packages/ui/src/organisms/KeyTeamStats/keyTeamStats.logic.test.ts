import { describe, expect, it } from 'vitest';
import type { SeasonAverages } from '@pll/data/api';
import { seasonAverageRows } from './keyTeamStats.logic';

const avg = (over: Partial<SeasonAverages> = {}): SeasonAverages => ({
  teamId: 't', gamesPlayed: 5, scoresPerGame: 12.25, shotsPerGame: 40, shootingPct: 0.3, turnoversPerGame: 11, faceoffPct: 0.5, savePct: 0.55, ...over,
});

describe('seasonAverageRows', () => {
  it('lists the six PRD rows, turnovers lower-is-better, per-game as 1-decimal', () => {
    const rows = seasonAverageRows(avg(), avg({ scoresPerGame: 9 }));
    expect(rows.map((r) => r.label)).toEqual(['Scores/Game', 'Shots/Game', 'Shooting %', 'Turnovers/Game', 'Faceoff %', 'Save %']);
    expect(rows[0]).toMatchObject({ away: 12.25, home: 9, format: 'decimal', digits: 1 });
    expect(rows[3]?.lowerIsBetter).toBe(true);
  });
  it('shows no value for a team that has not played', () => {
    const rows = seasonAverageRows(avg({ gamesPlayed: 0 }), avg());
    expect(rows.every((r) => r.away === null)).toBe(true);
    expect(rows.every((r) => r.home !== null)).toBe(true);
  });
});
