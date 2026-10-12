import { describe, expect, it } from 'vitest';
import {
  attendanceLabel,
  eventTags,
  headerPhase,
  preStatus,
  realMovement,
  resultLine,
  sideMovement,
  teamMetaLine,
  venueLabel,
  weatherLabel,
  winProbabilitySplit,
  type HeaderGame,
} from './headerBar.logic';

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
    expect(s).toMatchObject({ date: 'Sat, Mar 13', countdown: 'Starts in 2h 0m', notice: null });
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

describe('desktop band helpers (D22)', () => {
  const side = { record: { wins: 4, losses: 0 }, conferenceShortName: 'ACC', rpi: 2, seed: null as number | null };
  it('builds the team meta line and skips missing parts', () => {
    expect(teamMetaLine(side)).toBe('4-0 · ACC · RPI 2');
    expect(teamMetaLine({ ...side, seed: 2 })).toBe('Seed 2 · 4-0 · ACC · RPI 2');
    expect(teamMetaLine({ ...side, rpi: null, conferenceShortName: '' })).toBe('4-0');
  });
  it('shows movement only after the game and only when it moved (D13)', () => {
    const s = { rank: 3, rankChange: 1, rpiChange: 0 };
    expect(sideMovement(s, 'live')).toEqual({ rank: null, rpi: null });
    expect(sideMovement(s, 'final')).toEqual({ rank: 1, rpi: null });
    expect(sideMovement({ ...s, rank: null }, 'final').rank).toBeNull();
  });
  it('words the result', () => {
    const g = (status: HeaderGame['status'], a: number | null, h: number | null) => ({
      status,
      away: { team: { school: 'Penn' }, score: a },
      home: { team: { school: 'Cornell' }, score: h },
    }) as unknown as Parameters<typeof resultLine>[0];
    expect(resultLine(g('final', 8, 11))).toBe('Cornell won by 3');
    expect(resultLine(g('final', 12, 9))).toBe('Penn won by 3');
    expect(resultLine(g('final', 9, 9))).toBeNull();
    expect(resultLine(g('live', 8, 11))).toBeNull();
  });
  it('formats attendance', () => {
    expect(attendanceLabel(4690)).toBe('Att. 4,690');
    expect(attendanceLabel(null)).toBeNull();
    expect(attendanceLabel(0)).toBeNull();
  });
  it('splits the win probability', () => {
    const split = winProbabilitySplit({ winProbabilityHome: 0.61 });
    expect(split?.home).toBe(0.61);
    expect(split?.away).toBeCloseTo(0.39);
    expect(winProbabilitySplit({ winProbabilityHome: null })).toBeNull();
  });
});
