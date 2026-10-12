import { describe, expect, it } from 'vitest';
import type { Play } from '@pll/data/api';
import { goalEvents, latestGoal, maxGoalsInPeriod, periodsStarted, quarterFlows, type FlowGame } from './gameFlow.logic';

let seq = 0;
function play(type: Play['type'], period: number, teamId: string | null, extra: Partial<Play> = {}): Play {
  seq += 1;
  return {
    id: `p${seq}`,
    seq,
    period,
    clockSeconds: 600,
    elapsedSeconds: seq * 10,
    type,
    teamId,
    playerId: null,
    assistPlayerId: null,
    goalieId: null,
    opponentPlayerId: null,
    description: '',
    homeScore: 0,
    awayScore: 0,
    winProbabilityHome: null,
    details: {},
    ...extra,
  };
}

const game = (over: Partial<FlowGame> = {}): FlowGame => ({
  status: 'live',
  clock: { period: 3 },
  away: { team: { id: 'duke' }, periodScores: [2, 1, 0] },
  home: { team: { id: 'nd' }, periodScores: [1, 0, 1] },
  ...over,
});

const plays: Play[] = [
  play('period_start', 1, null),
  play('goal', 1, 'duke'),
  play('shot', 1, 'nd'),
  play('goal', 1, 'nd'),
  play('goal', 1, 'duke'),
  play('goal', 2, 'duke'),
  play('goal', 3, 'nd'),
];

describe('goalEvents', () => {
  it('keeps only goals of the two teams, in play order, with their side', () => {
    const events = goalEvents(game(), [...plays].reverse());
    expect(events.map((e) => [e.period, e.side])).toEqual([
      [1, 'away'],
      [1, 'home'],
      [1, 'away'],
      [2, 'away'],
      [3, 'home'],
    ]);
  });
  it('ignores goals of unknown teams or without a team', () => {
    expect(goalEvents(game(), [play('goal', 1, 'other'), play('goal', 1, null)])).toEqual([]);
  });
});

describe('periodsStarted', () => {
  it('is 0 before the game', () => {
    expect(periodsStarted(game({ status: 'scheduled', clock: null, away: { team: { id: 'duke' }, periodScores: [] }, home: { team: { id: 'nd' }, periodScores: [] } }), [])).toBe(0);
  });
  it('takes the max of period scores, live period and plays', () => {
    expect(periodsStarted(game(), plays)).toBe(3);
    expect(periodsStarted(game({ clock: { period: 4 } }), plays)).toBe(4);
    expect(periodsStarted(game({ status: 'final', clock: null }), [play('goal', 5, 'duke')])).toBe(5);
  });
});

describe('quarterFlows', () => {
  const rows = quarterFlows(game(), plays);
  it('has one row per started period with goals per team', () => {
    expect(rows.map((r) => [r.label, r.counts.away, r.counts.home])).toEqual([
      ['Q1', 2, 1],
      ['Q2', 1, 0],
      ['Q3', 0, 1],
    ]);
  });
  it('marks only the live period as in progress', () => {
    expect(rows.map((r) => r.inProgress)).toEqual([false, false, true]);
    expect(quarterFlows(game({ status: 'final', clock: null }), plays).some((r) => r.inProgress)).toBe(false);
  });
  it('labels overtime periods', () => {
    const ot = quarterFlows(game({ status: 'final', clock: null }), [play('goal', 5, 'nd'), play('goal', 6, 'duke')]);
    expect(ot.map((r) => r.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'OT', '2OT']);
  });
  it('shows started periods without goals as empty rows', () => {
    expect(quarterFlows(game({ clock: { period: 4 } }), plays)[3]).toMatchObject({ label: 'Q4', counts: { away: 0, home: 0 } });
  });
});

describe('latestGoal', () => {
  it('is the last goal by play order', () => {
    expect(latestGoal(game(), plays)).toMatchObject({ side: 'home', period: 3 });
  });
  it('is null with no goals', () => {
    expect(latestGoal(game(), [plays[0]!])).toBeNull();
  });
});

describe('maxGoalsInPeriod', () => {
  it('is the widest lane, at least 1', () => {
    expect(maxGoalsInPeriod(quarterFlows(game(), plays))).toBe(2);
    expect(maxGoalsInPeriod([])).toBe(1);
  });
});
