import { describe, expect, it } from 'vitest';
import type { PreviousResult } from '@pll/data/api';
import { hasAnyResults, lastResults, resultScore, venueMarker } from './previous.logic';

const r = (startTime: string, isHome = true): PreviousResult =>
  ({ gameId: startTime, startTime, isHome, teamScore: 11, opponentScore: 9, result: 'W' }) as PreviousResult;

describe('previous results', () => {
  it('keeps the 3 most recent, newest first', () => {
    const out = lastResults([r('2027-02-01T00:00:00Z'), r('2027-03-01T00:00:00Z'), r('2027-01-01T00:00:00Z'), r('2027-02-15T00:00:00Z')]);
    expect(out.map((x) => x.startTime)).toEqual(['2027-03-01T00:00:00Z', '2027-02-15T00:00:00Z', '2027-02-01T00:00:00Z']);
  });
  it('puts the team score first', () => {
    expect(resultScore({ teamScore: 8, opponentScore: 11 })).toBe('8–11');
  });
  it('marks home and away games', () => {
    expect(venueMarker({ isHome: true })).toBe('vs');
    expect(venueMarker({ isHome: false })).toBe('@');
  });
  it('detects an empty history', () => {
    expect(hasAnyResults({ home: [], away: [] })).toBe(false);
    expect(hasAnyResults({ home: [r('2027-01-01T00:00:00Z')], away: [] })).toBe(true);
  });
});
