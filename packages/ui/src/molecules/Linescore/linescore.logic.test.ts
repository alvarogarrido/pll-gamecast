import { describe, expect, it } from 'vitest';
import { linescorePeriods, winnerSide } from './linescore.logic';

describe('winnerSide', () => {
  const g = (status: 'final' | 'live', away: number | null, home: number | null) => ({ status, away: { score: away }, home: { score: home } });
  it('picks the higher score of a final game', () => {
    expect(winnerSide(g('final', 8, 11))).toBe('home');
    expect(winnerSide(g('final', 12, 9))).toBe('away');
  });
  it('is null for ties, live games and missing scores', () => {
    expect(winnerSide(g('final', 9, 9))).toBeNull();
    expect(winnerSide(g('live', 9, 3))).toBeNull();
    expect(winnerSide(g('final', null, 3))).toBeNull();
  });
});

describe('linescorePeriods', () => {
  it('is Q1..Q4 and adds a column per overtime', () => {
    const sides = (a: number, h: number) => ({ away: { periodScores: Array(a).fill(0) }, home: { periodScores: Array(h).fill(0) } });
    expect(linescorePeriods(sides(2, 2))).toEqual([1, 2, 3, 4]);
    expect(linescorePeriods(sides(5, 5))).toEqual([1, 2, 3, 4, 5]);
    expect(linescorePeriods(sides(0, 0))).toEqual([1, 2, 3, 4]);
  });
});
