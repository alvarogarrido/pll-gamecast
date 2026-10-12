import { describe, expect, it } from 'vitest';
import { eventTags, headerPhase, linescorePeriods, preStatus, venueLabel, weatherLabel, winnerSide, type HeaderGame } from './headerBar.logic';

const at = (iso: string) => Date.parse(iso);
const START = '2027-03-13T22:00:00Z'; // 5:00 PM ET

describe('headerPhase', () => {
  it('maps statuses', () => {
    expect(headerPhase({ status: 'live' })).toBe('live');
    expect(headerPhase({ status: 'final' })).toBe('final');
    for (const s of ['scheduled', 'delayed', 'postponed', 'canceled'] as const) expect(headerPhase({ status: s })).toBe('pre');
  });
});

describe('preStatus', () => {
  it('shows date and time, and a countdown within 12 hours', () => {
    const s = preStatus({ status: 'scheduled', startTime: START }, at('2027-03-13T20:00:00Z'));
    expect(s).toMatchObject({ date: 'Mar 13', countdown: 'Starts in 2h 0m', notice: null });
    expect(s.time).toContain('5:00 PM');
  });
  it('has no countdown further out', () => {
    expect(preStatus({ status: 'scheduled', startTime: START }, at('2027-03-12T08:00:00Z')).countdown).toBeNull();
  });
  it('flags delayed games', () => {
    expect(preStatus({ status: 'delayed', startTime: START }, at('2027-03-13T20:00:00Z')).notice).toBe('Delayed');
  });
  it('says starting soon after the scheduled time', () => {
    expect(preStatus({ status: 'scheduled', startTime: START }, at('2027-03-13T22:05:00Z')).notice).toBe('Starting soon');
  });
});

describe('weatherLabel', () => {
  const w = (over: Partial<NonNullable<HeaderGame['weather']>>) => ({ temperatureF: 52, condition: 'wind' as const, precipitationChance: 0.09, ...over });
  it('formats temperature, condition and precipitation', () => {
    expect(weatherLabel(w({}))).toBe('52°F · Windy · 9% precip');
  });
  it('omits precipitation at zero or unknown', () => {
    expect(weatherLabel(w({ precipitationChance: 0 }))).toBe('52°F · Windy');
    expect(weatherLabel(w({ precipitationChance: null }))).toBe('52°F · Windy');
  });
  it('is null without weather', () => {
    expect(weatherLabel(null)).toBeNull();
  });
});

describe('venueLabel, eventTags', () => {
  it('joins city and state', () => {
    expect(venueLabel({ name: 'Homewood Field', city: 'Baltimore', state: 'MD' })).toEqual({ name: 'Homewood Field', place: 'Baltimore, MD' });
  });
  it('lists label and neutral site', () => {
    expect(eventTags({ label: 'NCAA Quarterfinal', neutralSite: true })).toEqual(['NCAA Quarterfinal', 'Neutral site']);
    expect(eventTags({ label: null, neutralSite: false })).toEqual([]);
  });
});

describe('winnerSide', () => {
  const g = (status: HeaderGame['status'], away: number | null, home: number | null) => ({ status, away: { score: away }, home: { score: home } }) as Pick<HeaderGame, 'status' | 'home' | 'away'>;
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
    const sides = (a: number, h: number) => ({ away: { periodScores: Array(a).fill(0) }, home: { periodScores: Array(h).fill(0) } }) as Pick<HeaderGame, 'home' | 'away'>;
    expect(linescorePeriods(sides(2, 2))).toEqual([1, 2, 3, 4]);
    expect(linescorePeriods(sides(5, 5))).toEqual([1, 2, 3, 4, 5]);
  });
});
