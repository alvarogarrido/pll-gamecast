import { describe, expect, it } from 'vitest';
import type { Play, PlayerRef } from '@pll/data/api';
import {
  countByFilter,
  defaultPlayOrder,
  dividerLabel,
  filterPlays,
  groupPlaysByPeriod,
  matchesFilter,
  playDetail,
  playKind,
  playLabel,
  playerMap,
  selectLatestPlays,
  sortPlays,
} from './playByPlay.logic';

let n = 0;
function play(over: Partial<Play> & Pick<Play, 'type' | 'period'>): Play {
  n += 1;
  return {
    id: `p${n}`,
    seq: n,
    clockSeconds: 600,
    elapsedSeconds: n * 10,
    teamId: 'duke',
    playerId: 'duke-1',
    assistPlayerId: null,
    goalieId: null,
    opponentPlayerId: null,
    description: '',
    homeScore: 0,
    awayScore: 0,
    winProbabilityHome: null,
    details: {},
    ...over,
  };
}

const log: Play[] = [
  play({ type: 'period_start', period: 1 }),
  play({ type: 'faceoff', period: 1 }),
  play({ type: 'shot', period: 1, details: { shotResult: 'saved' } }),
  play({ type: 'goal', period: 1, awayScore: 1 }),
  play({ type: 'turnover', period: 1 }),
  play({ type: 'period_end', period: 1 }),
  play({ type: 'period_start', period: 2 }),
  play({ type: 'penalty', period: 2, details: { penaltyName: 'Slashing', penaltySeconds: 30 } }),
  play({ type: 'timeout', period: 2 }),
  play({ type: 'goal', period: 2, awayScore: 1, homeScore: 1 }),
];

describe('filters', () => {
  it('Shots includes goals, Goals does not include shots', () => {
    const shots = filterPlays(log, 'shots').map((p) => p.type);
    expect(shots).toEqual(['shot', 'goal', 'goal']);
    expect(filterPlays(log, 'goals')).toHaveLength(2);
  });
  it('maps faceoffs, turnovers and penalties one to one', () => {
    expect(filterPlays(log, 'faceoffs').map((p) => p.type)).toEqual(['faceoff']);
    expect(filterPlays(log, 'turnovers').map((p) => p.type)).toEqual(['turnover']);
    expect(filterPlays(log, 'penalties').map((p) => p.type)).toEqual(['penalty']);
  });
  it('dividers appear in All only', () => {
    expect(filterPlays(log, 'all')).toHaveLength(log.length);
    for (const f of ['goals', 'shots', 'faceoffs', 'turnovers', 'penalties'] as const) {
      expect(filterPlays(log, f).some((p) => playKind(p) === 'divider')).toBe(false);
    }
    expect(matchesFilter({ type: 'timeout' }, 'all')).toBe(true);
  });
  it('counts per chip', () => {
    expect(countByFilter(log)).toEqual({ all: 10, goals: 2, shots: 3, faceoffs: 1, turnovers: 1, penalties: 1 });
  });
});

describe('ordering and grouping', () => {
  it('sorts by time, both ways, without mutating', () => {
    const shuffled = [log[3]!, log[0]!, log[2]!];
    expect(sortPlays(shuffled, 'oldest').map((p) => p.seq)).toEqual([log[0]!.seq, log[2]!.seq, log[3]!.seq]);
    expect(sortPlays(shuffled, 'newest').map((p) => p.seq)).toEqual([log[3]!.seq, log[2]!.seq, log[0]!.seq]);
    expect(shuffled[0]).toBe(log[3]);
  });
  it('newest: newest period first, newest play first', () => {
    const groups = groupPlaysByPeriod(log, { order: 'newest' });
    expect(groups.map((g) => g.label)).toEqual(['Q2', 'Q1']);
    expect(groups[0]!.plays[0]!.type).toBe('goal');
    expect(groups[1]!.plays.at(-1)!.type).toBe('period_start');
  });
  it('oldest: chronological', () => {
    const groups = groupPlaysByPeriod(log, { order: 'oldest' });
    expect(groups.map((g) => g.period)).toEqual([1, 2]);
    expect(groups[0]!.plays[0]!.type).toBe('period_start');
  });
  it('drops empty periods under a filter but keeps unfiltered totals and the end score', () => {
    const groups = groupPlaysByPeriod(log, { filter: 'penalties', order: 'oldest' });
    expect(groups).toHaveLength(1);
    expect(groups[0]!.period).toBe(2);
    expect(groups[0]!.totalPlays).toBe(4);
    expect(groups[0]!.goals).toBe(1);
    expect(groups[0]!.endScore).toEqual({ away: 1, home: 1 });
  });
  it('labels overtime periods', () => {
    const ot = [play({ type: 'goal', period: 5 }), play({ type: 'goal', period: 6 })];
    expect(groupPlaysByPeriod(ot).map((g) => g.label)).toEqual(['2OT', 'OT']);
  });
  it('empty log gives no groups', () => {
    expect(groupPlaysByPeriod([])).toEqual([]);
  });
  it('default order: live is a feed, everything else chronological', () => {
    expect(defaultPlayOrder('live')).toBe('newest');
    expect(defaultPlayOrder('final')).toBe('oldest');
    expect(defaultPlayOrder('scheduled')).toBe('oldest');
  });
});

const refs: PlayerRef[] = ['duke-1', 'duke-2', 'nd-29'].map((id, i) => ({
  id,
  teamId: id.startsWith('duke') ? 'duke' : 'nd',
  firstName: ['Bo', 'Al', 'Gus'][i]!,
  lastName: ['Dowd', 'Smith', 'Pipe'][i]!,
  jerseyNumber: i,
  position: 'A',
  classYear: 'Jr',
  photoUrl: null,
}));

describe('labels and details', () => {
  it('titles', () => {
    expect(playLabel(play({ type: 'goal', period: 1 }))).toBe('Goal');
    expect(playLabel(play({ type: 'shot', period: 1, details: { shotResult: 'saved' } }))).toBe('Save');
    expect(playLabel(play({ type: 'shot', period: 1 }))).toBe('Shot');
    expect(playLabel(play({ type: 'turnover', period: 1, opponentPlayerId: 'x' }))).toBe('Caused turnover');
    expect(playLabel(play({ type: 'turnover', period: 1 }))).toBe('Turnover');
    expect(dividerLabel(play({ type: 'period_start', period: 3 }))).toBe('Start of Q3');
    expect(dividerLabel(play({ type: 'timeout', period: 3 }), 'DUKE')).toBe('Timeout · DUKE');
  });
  it('details use player refs and tolerate missing ones', () => {
    const m = playerMap(refs);
    expect(playDetail(play({ type: 'goal', period: 1, assistPlayerId: 'duke-2' }), m)).toBe('Assisted by A. Smith');
    expect(playDetail(play({ type: 'goal', period: 1 }), m)).toBe('Unassisted');
    expect(playDetail(play({ type: 'shot', period: 1, goalieId: 'nd-29', details: { shotResult: 'saved' } }), m)).toBe('Saved by G. Pipe');
    expect(playDetail(play({ type: 'faceoff', period: 1, opponentPlayerId: 'ghost' }), m)).toBe('Won');
    expect(playDetail(log[7]!, m)).toBe('Slashing · 30 sec');
  });
  it('playerMap is cached per array', () => {
    expect(playerMap(refs)).toBe(playerMap(refs));
  });
});

describe('selectLatestPlays', () => {
  it('prefers goals, fills with the newest other plays, returns newest first', () => {
    const picked = selectLatestPlays(log, 3);
    expect(picked.map((p) => p.type)).toEqual(['goal', 'penalty', 'goal']);
    expect(picked.every((p, i, a) => i === 0 || a[i - 1]!.elapsedSeconds >= p.elapsedSeconds)).toBe(true);
  });
  it('ignores ground balls, clears, dividers', () => {
    const noisy = [play({ type: 'ground_ball', period: 1 }), play({ type: 'clear', period: 1 }), play({ type: 'period_end', period: 1 })];
    expect(selectLatestPlays(noisy)).toEqual([]);
  });
  it('can be all goals', () => {
    const goals = Array.from({ length: 8 }, () => play({ type: 'goal', period: 1 }));
    expect(selectLatestPlays(goals, 5)).toHaveLength(5);
  });
});
