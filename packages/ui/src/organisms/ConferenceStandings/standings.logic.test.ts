import { describe, expect, it } from 'vitest';
import type { ConferenceStandings } from '@pll/data/api';
import { isGameTeam, sortStandings, standingsCells, standingsView, type StandingsRowData } from './standings.logic';

const row = (id: string, cw: number, cl: number, w: number, l: number): StandingsRowData =>
  ({ team: { id, school: id }, rank: null, conferenceRecord: { wins: cw, losses: cl }, record: { wins: w, losses: l } }) as StandingsRowData;
const conf = (id: string, rows: StandingsRowData[]): ConferenceStandings => ({ conferenceId: id, name: id, shortName: id, rows });
const game = { away: { team: { id: 'a' } }, home: { team: { id: 'h' } } } as never;

describe('sortStandings', () => {
  it('orders by conference win pct, then overall', () => {
    const out = sortStandings([row('x', 1, 2, 3, 3), row('y', 3, 0, 3, 3), row('z', 1, 2, 5, 1)]);
    expect(out.map((r) => r.team.id)).toEqual(['y', 'z', 'x']);
  });
  it('puts winless 0-0 teams after teams with wins, without NaN', () => {
    const out = sortStandings([row('x', 0, 0, 0, 0), row('y', 1, 1, 2, 2)]);
    expect(out.map((r) => r.team.id)).toEqual(['y', 'x']);
  });
});

describe('standingsView', () => {
  it('defaults to the away conference', () => {
    const view = standingsView([conf('c1', [row('h', 1, 0, 1, 0)]), conf('c2', [row('a', 1, 0, 1, 0)])], game);
    expect(view.tables).toHaveLength(2);
    expect(view.defaultConferenceId).toBe('c2');
  });
  it('handles a single shared table and no data', () => {
    expect(standingsView([conf('c1', [row('a', 1, 0, 1, 0), row('h', 0, 1, 0, 1)])], game).tables).toHaveLength(1);
    expect(standingsView([], game).defaultConferenceId).toBeNull();
  });
});

describe('isGameTeam', () => {
  it('flags the two teams', () => {
    expect(isGameTeam(row('a', 0, 0, 0, 0), game)).toBe(true);
    expect(isGameTeam(row('q', 0, 0, 0, 0), game)).toBe(false);
  });
});

describe('standingsCells (D11)', () => {
  it('splits conference and overall records into four number columns', () => {
    expect(standingsCells(row('x', 3, 1, 8, 2))).toEqual({ confWins: '3', confLosses: '1', wins: '8', losses: '2' });
    expect(standingsCells(row('x', 0, 0, 0, 0))).toEqual({ confWins: '0', confLosses: '0', wins: '0', losses: '0' });
  });
  it('prints an en dash for missing data, never NaN', () => {
    const missing = { conferenceRecord: null, record: null } as unknown as StandingsRowData;
    expect(standingsCells(missing)).toEqual({ confWins: '–', confLosses: '–', wins: '–', losses: '–' });
  });
});
