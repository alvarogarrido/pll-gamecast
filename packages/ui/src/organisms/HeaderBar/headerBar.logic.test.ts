import { describe, expect, it } from 'vitest';
import { eventTags, headerPhase, preStatus, realMovement, venueLabel, weatherLabel, type HeaderGame } from './headerBar.logic';

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

describe('realMovement (D13)', () => {
  it('keeps real movement, up or down', () => {
    expect(realMovement(2)).toBe(2);
    expect(realMovement(-3)).toBe(-3);
  });
  it('hides unchanged and unknown', () => {
    expect(realMovement(0)).toBeNull();
    expect(realMovement(null)).toBeNull();
    expect(realMovement(undefined)).toBeNull();
    expect(realMovement(Number.NaN)).toBeNull();
  });
});
