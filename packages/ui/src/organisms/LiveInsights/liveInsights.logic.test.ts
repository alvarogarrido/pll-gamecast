import { describe, expect, it } from 'vitest';
import type { Insight, PlayerRef } from '@pll/data/api';
import { insightIcon, insightPlayer, sortInsights, splitInsights } from './liveInsights.logic';

const ins = (id: string, elapsedSeconds: number, kind: Insight['kind'] = 'note'): Insight => ({
  id,
  elapsedSeconds,
  period: 1,
  clockSeconds: 0,
  kind,
  title: id,
  body: '',
  teamId: null,
  playerId: null,
});

describe('insights', () => {
  it('icons by kind', () => {
    expect(insightIcon('run')).toBe('fire');
    expect(insightIcon('streak')).toBe('fire');
    expect(insightIcon('lead_change')).toBe('trend-up');
    expect(insightIcon('milestone')).toBe('trophy');
    expect(insightIcon('record')).toBe('trophy');
    expect(insightIcon('drought')).toBe('clock');
  });
  it('sorts newest first and does not mutate', () => {
    const input = [ins('a', 10), ins('b', 30), ins('c', 20)];
    expect(sortInsights(input).map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(input[0]!.id).toBe('a');
  });
  it('splits latest, 3 older, and the rest hidden', () => {
    const input = [1, 2, 3, 4, 5, 6].map((n) => ins(`i${n}`, n * 10));
    const s = splitInsights(input);
    expect(s.latest!.id).toBe('i6');
    expect(s.older.map((i) => i.id)).toEqual(['i5', 'i4', 'i3']);
    expect(s.hidden).toBe(2);
    const all = splitInsights(input, { expanded: true });
    expect(all.older).toHaveLength(5);
    expect(all.hidden).toBe(0);
  });
  it('handles none and one', () => {
    expect(splitInsights([])).toEqual({ latest: null, older: [], hidden: 0 });
    expect(splitInsights([ins('a', 1)])).toEqual({ latest: ins('a', 1), older: [], hidden: 0 });
  });
});

describe('insightPlayer', () => {
  const ref = (id: string): PlayerRef => ({
    id,
    teamId: 't1',
    firstName: 'Brennan',
    lastName: 'Dowd',
    jerseyNumber: 11,
    position: 'A',
    classYear: 'Sr',
    photoUrl: null,
  });
  it('finds the referenced player', () => {
    expect(insightPlayer({ playerId: 'p2' }, [ref('p1'), ref('p2')])?.id).toBe('p2');
  });
  it('is null for team-level insights, a missing ref or no refs at all', () => {
    expect(insightPlayer({ playerId: null }, [ref('p1')])).toBeNull();
    expect(insightPlayer({ playerId: 'p9' }, [ref('p1')])).toBeNull();
    expect(insightPlayer({ playerId: 'p1' })).toBeNull();
  });
});
