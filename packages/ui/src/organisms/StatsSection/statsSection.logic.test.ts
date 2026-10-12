import { describe, expect, it } from 'vitest';
import type { GameStats, PlayerGameStats, PlayerRef, TeamGameStats } from '@pll/data/api';
import {
  boxTables,
  boxTotals,
  hasGameStats,
  nextSort,
  overviewRows,
  sortBoxRows,
  teamLines,
  teamStatGroups,
  type BoxLine,
} from './statsSection.logic';

const team = (over: Partial<TeamGameStats> = {}): TeamGameStats => ({
  teamId: 't',
  goals: 0, assists: 0, shots: 0, shotsOnGoal: 0, shotPct: 0, groundBalls: 0, turnovers: 0, causedTurnovers: 0,
  faceoffsWon: 0, faceoffsTaken: 0, faceoffPct: 0, saves: 0, goalsAgainst: 0, savePct: 0,
  clears: 0, clearAttempts: 0, clearPct: 0, extraManGoals: 0, extraManOpportunities: 0, penalties: 0, penaltySeconds: 0,
  ...over,
});

const stat = (playerId: string, over: Partial<PlayerGameStats> = {}): PlayerGameStats => ({
  playerId, teamId: 't',
  goals: 0, assists: 0, points: 0, shots: 0, shotsOnGoal: 0, groundBalls: 0, turnovers: 0, causedTurnovers: 0,
  faceoffsWon: 0, faceoffsTaken: 0, saves: 0, goalsAgainst: 0, penalties: 0, penaltySeconds: 0,
  ...over,
});

const ref = (id: string, lastName: string): PlayerRef => ({
  id, teamId: 't', firstName: 'A', lastName, jerseyNumber: 1, position: 'A', classYear: 'Sr', photoUrl: null,
});

describe('team rows', () => {
  it('overview has the six key rows with turnovers lower-is-better', () => {
    const rows = overviewRows(team({ goals: 3 }), team({ goals: 5 }));
    expect(rows.map((r) => r.label)).toEqual(['Goals', 'Shots', 'Shooting %', 'Turnovers', 'Faceoff %', 'Save %']);
    expect(rows.find((r) => r.id === 'turnovers')?.lowerIsBetter).toBe(true);
    expect(rows[0]).toMatchObject({ away: 3, home: 5 });
  });

  it('groups: clears x/y with clear %, EMO "x of y", SOG % guarded against zero shots', () => {
    const groups = teamStatGroups(
      team({ clears: 9, clearAttempts: 11, extraManGoals: 2, extraManOpportunities: 4, penaltySeconds: 90, shots: 10, shotsOnGoal: 5 }),
      team({ extraManOpportunities: 0 }),
    );
    expect(groups.map((g) => g.title)).toEqual(['Overview', 'Shooting', 'Possession', 'Faceoffs', 'Goalie', 'Extra-Man & Penalties']);
    const clears = groups[2]?.rows.find((r) => r.id === 'clears');
    expect(clears).toMatchObject({ awayDisplay: '9/11' });
    const emo = groups[5]?.rows.find((r) => r.id === 'emo');
    expect(emo).toMatchObject({ awayDisplay: '2 of 4', homeDisplay: '0 of 0', away: 0.5, home: null });
    expect(groups[5]?.rows.find((r) => r.id === 'penaltySeconds')?.awayDisplay).toBe('1:30');
    const sog = groups[1]?.rows.find((r) => r.id === 'sogPct');
    expect(sog).toMatchObject({ away: 0.5, home: null });
  });
});

describe('hasGameStats', () => {
  const empty = { teams: [team(), team()], players: [], playerRefs: [] } as unknown as GameStats['data'];
  it('is false before the game and with no activity', () => {
    expect(hasGameStats(empty, { status: 'scheduled' })).toBe(false);
    expect(hasGameStats(empty, { status: 'live' })).toBe(false);
    expect(hasGameStats(null, { status: 'final' })).toBe(false);
  });
  it('is true with activity in a live or final game', () => {
    const s = { ...empty, teams: [team({ shots: 2 }), team()] } as GameStats['data'];
    expect(hasGameStats(s, { status: 'live' })).toBe(true);
    expect(hasGameStats(s, { status: 'final' })).toBe(true);
  });
});

describe('box tables', () => {
  const stats = {
    teams: [],
    playerRefs: [ref('a', 'Adams'), ref('b', 'Baker'), ref('c', 'Clark'), ref('g', 'Gray')],
    players: [
      stat('a', { goals: 2, points: 2, shots: 4 }),
      stat('b', { goals: 1, assists: 2, points: 3, shots: 3, faceoffsWon: 3, faceoffsTaken: 8 }),
      stat('c', { groundBalls: 5 }),
      stat('g', { saves: 7, goalsAgainst: 3, penalties: 1, penaltySeconds: 60 }),
      { ...stat('x', { goals: 9, points: 9 }), teamId: 'other' },
    ],
  } as unknown as GameStats['data'];
  const lines = teamLines(stats, 't');

  it('filters to the team and drops players without a ref', () => {
    expect(lines.map((l) => l.player.id)).toEqual(['a', 'b', 'c', 'g']);
  });

  it('builds only tables where somebody has a stat', () => {
    const ids = boxTables(lines).map((t) => t.id);
    expect(ids).toEqual(['offense', 'faceoffs', 'goalies', 'penalties']);
    expect(boxTables([lines[2] as BoxLine]).map((t) => t.id)).toEqual(['offense']);
    expect(boxTables([])).toEqual([]);
  });

  it('formats cells', () => {
    const [offense, faceoffs, goalies, penalties] = boxTables(lines);
    const b = lines[1] as BoxLine;
    expect(faceoffs?.columns[0]?.display?.(b)).toBe('3-8');
    expect(faceoffs?.columns[1]?.display?.(b)).toBe('37.5%');
    const g = lines[3] as BoxLine;
    expect(goalies?.columns[2]?.display?.(g)).toBe('70.0%');
    expect(penalties?.columns[1]?.display?.(g)).toBe('1:00');
    expect(offense?.columns.map((c) => c.label)).toEqual(['G', 'A', 'P', 'SH', 'SOG', 'GB', 'TO', 'CT']);
  });

  it('sorts by points by default, then by other columns and name', () => {
    const offense = boxTables(lines)[0]!;
    expect(sortBoxRows(offense, { key: 'points', direction: 'desc' }).map((l) => l.player.id)).toEqual(['b', 'a', 'c']);
    expect(sortBoxRows(offense, { key: 'groundBalls', direction: 'desc' })[0]?.player.id).toBe('c');
    expect(sortBoxRows(offense, { key: 'points', direction: 'asc' })[0]?.player.id).toBe('c');
    expect(sortBoxRows(offense, { key: 'player', direction: 'asc' }).map((l) => l.player.id)).toEqual(['a', 'b', 'c']);
  });

  it('faceoff table only lists players who took a faceoff', () => {
    const faceoffsTable = boxTables([...lines, { player: ref('z', 'Zed'), stats: stat('z', { faceoffsTaken: 0, goals: 1 }) }])[1]!;
    expect(faceoffsTable.rows).toHaveLength(1);
  });

  it('totals row sums counts and recomputes percentages from the sums (D12)', () => {
    const extra: BoxLine[] = [
      { player: ref('f2', 'Fox'), stats: stat('f2', { faceoffsWon: 1, faceoffsTaken: 2 }) },
      { player: ref('g2', 'Hale'), stats: stat('g2', { saves: 1, goalsAgainst: 1, penalties: 2, penaltySeconds: 90 }) },
    ];
    const [offense, faceoffs, goalies, penalties] = boxTables([...lines, ...extra]);
    // G A P SH SOG GB TO CT
    expect(boxTotals(offense!)).toEqual(['3', '2', '5', '7', '0', '5', '0', '0']);
    // 3-8 + 1-2 = 4-10 => 40.0% (an average of 37.5% and 50.0% would be 43.8%)
    expect(boxTotals(faceoffs!)).toEqual(['4-10', '40.0%']);
    // saves 7 + 1 = 8, goals against 3 + 1 = 4 => 66.7% (an average of 70% and 50% would be 60%)
    expect(boxTotals(goalies!)).toEqual(['8', '4', '66.7%']);
    // penalties 1 + 2, penalty time 60 + 90 s
    expect(boxTotals(penalties!)).toEqual(['3', '2:30']);
  });

  it('totals row has one entry per column and never NaN', () => {
    for (const t of boxTables(lines)) expect(boxTotals(t)).toHaveLength(t.columns.length);
    const noneTaken = boxTotals({ columns: boxTables(lines)[1]!.columns, rows: [] });
    expect(noneTaken).toEqual(['0-0', '–']);
  });

  it('nextSort starts descending, flips on repeat, names ascending', () => {
    expect(nextSort({ key: 'points', direction: 'desc' }, 'goals')).toEqual({ key: 'goals', direction: 'desc' });
    expect(nextSort({ key: 'goals', direction: 'desc' }, 'goals')).toEqual({ key: 'goals', direction: 'asc' });
    expect(nextSort({ key: 'goals', direction: 'desc' }, 'player')).toEqual({ key: 'player', direction: 'asc' });
  });
});
