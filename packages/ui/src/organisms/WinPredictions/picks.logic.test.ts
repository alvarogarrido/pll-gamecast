import { describe, expect, it } from 'vitest';
import { resolvePicks, tallyPicks, winSplit, type StaffPickEntry } from './picks.logic';

const game = { away: { team: { id: 'duke', school: 'Duke' } }, home: { team: { id: 'nd', school: 'Notre Dame' } } } as never;
const pick = (teamId: string): StaffPickEntry => ({ staff: { id: teamId, name: 'S', photoUrl: null, title: null }, pickTeamId: teamId });

describe('tallyPicks', () => {
  it('says "3 of 4 pick Duke"', () => {
    expect(tallyPicks([pick('duke'), pick('duke'), pick('duke'), pick('nd')], game).text).toBe('3 of 4 pick Duke');
  });
  it('reports a split', () => {
    const t = tallyPicks([pick('duke'), pick('nd')], game);
    expect(t.text).toBe('Staff split 1–1');
    expect(t.leader).toBeNull();
  });
  it('ignores picks for other teams and handles none', () => {
    expect(resolvePicks([pick('yale')], game)).toEqual([]);
    expect(tallyPicks([], game).text).toBeNull();
  });
});

describe('winSplit', () => {
  it('splits and clamps', () => {
    expect(winSplit(0.609)!.away).toBeCloseTo(0.391);
    expect(winSplit(1.4)).toEqual({ away: 0, home: 1 });
    expect(winSplit(null)).toBeNull();
  });
});
