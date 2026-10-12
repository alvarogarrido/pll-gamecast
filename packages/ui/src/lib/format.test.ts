import { describe, expect, it } from 'vitest';
import {
  classYearLabel,
  clock,
  countdownLabel,
  count,
  dateLabel,
  formatStat,
  kickoffLabel,
  pct,
  perGame,
  periodLabel,
  playerInitials,
  playerLabel,
  playerMeta,
  playerShortName,
  positionLabel,
  rankLabel,
  record,
  relativeTimeLabel,
  signedChange,
  statusLine,
  statusParts,
  timeLabel,
  type StatusGame,
} from './format';

const iso = (s: string) => Date.parse(s);

describe('numbers', () => {
  it('pct', () => {
    expect(pct(0.4333)).toBe('43.3%');
    expect(pct(0.5, 0)).toBe('50%');
    expect(pct(1)).toBe('100.0%');
    expect(pct(null)).toBe('–');
    expect(pct(Number.NaN)).toBe('–');
  });
  it('perGame', () => {
    expect(perGame(93, 8)).toBe('11.6');
    expect(perGame(93, 8, 2)).toBe('11.63');
    expect(perGame(10, 0)).toBe('–');
    expect(perGame(null, 3)).toBe('–');
  });
  it('count and formatStat', () => {
    expect(count(1234)).toBe('1,234');
    expect(formatStat(13)).toBe('13');
    expect(formatStat(11.63)).toBe('11.6');
    expect(formatStat(0.392, 'pct')).toBe('39.2%');
    expect(formatStat(0.392, 'pct', 0)).toBe('39%');
    expect(formatStat(8.88, 'decimal')).toBe('8.88');
    expect(formatStat(2, (v) => `${v} of 4`)).toBe('2 of 4');
    expect(formatStat(null)).toBe('–');
  });
  it('signedChange', () => {
    expect(signedChange(2)).toBe('+2');
    expect(signedChange(-1)).toBe('−1');
    expect(signedChange(0)).toBe('–');
    expect(signedChange(null)).toBe('–');
  });
});

describe('clock and periods', () => {
  it('clock', () => {
    expect(clock(491)).toBe('8:11');
    expect(clock(0)).toBe('0:00');
    expect(clock(900)).toBe('15:00');
    expect(clock(59.9)).toBe('0:59');
    expect(clock(-3)).toBe('0:00');
    expect(clock(null)).toBe('–');
  });
  it('periodLabel', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(periodLabel)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'OT', '2OT', '3OT']);
  });
});

describe('dates', () => {
  it('timeLabel honours the zone and never depends on the machine zone', () => {
    expect(timeLabel('2027-03-13T20:30:00Z')).toBe('3:30 PM ET');
    expect(timeLabel('2027-04-17T19:30:00Z')).toBe('3:30 PM ET');
    expect(timeLabel('2027-04-17T19:30:00Z', 'America/Los_Angeles')).toBe('12:30 PM PT');
  });
  it('dateLabel', () => {
    expect(dateLabel('2027-03-13T20:30:00Z')).toBe('Mar 13');
    expect(dateLabel('2027-03-13T20:30:00Z', undefined, { weekday: true })).toBe('Sat, Mar 13');
    // 02:00 UTC is still the evening before in New York.
    expect(dateLabel('2027-03-14T02:00:00Z')).toBe('Mar 13');
  });
  it('kickoffLabel', () => {
    const now = iso('2027-03-10T12:00:00Z');
    expect(kickoffLabel('2027-03-13T20:30:00Z', now)).toBe('Sat 3:30 PM ET');
    expect(kickoffLabel('2027-03-30T20:30:00Z', now)).toBe('Mar 30 · 4:30 PM ET');
  });
  it('relativeTimeLabel: coarse units from server time', () => {
    const now = iso('2027-03-13T12:00:00Z');
    expect(relativeTimeLabel('2027-03-13T11:59:50Z', now)).toBe('just now');
    expect(relativeTimeLabel('2027-03-13T11:59:00Z', now)).toBe('1m ago');
    expect(relativeTimeLabel('2027-03-13T11:30:00Z', now)).toBe('30m ago');
    expect(relativeTimeLabel('2027-03-13T11:00:00Z', now)).toBe('1h ago');
    expect(relativeTimeLabel('2027-03-13T09:00:00Z', now)).toBe('3h ago');
    expect(relativeTimeLabel('2027-03-12T12:00:00Z', now)).toBe('1d ago');
    expect(relativeTimeLabel('2027-03-06T12:00:01Z', now)).toBe('6d ago');
  });
  it('relativeTimeLabel: a date from one week on, in the given zone', () => {
    const now = iso('2027-03-13T12:00:00Z');
    expect(relativeTimeLabel('2027-03-06T12:00:00Z', now)).toBe('Mar 6');
    expect(relativeTimeLabel('2027-03-01T12:00:00Z', now)).toBe('Mar 1');
    // 02:00 UTC on Mar 1 is still Feb 28 in New York.
    expect(relativeTimeLabel('2027-03-01T02:00:00Z', now)).toBe('Feb 28');
    expect(relativeTimeLabel('2027-03-01T02:00:00Z', now, 'UTC')).toBe('Mar 1');
  });
  it('relativeTimeLabel: tolerates future timestamps and bad input', () => {
    const now = iso('2027-03-13T12:00:00Z');
    expect(relativeTimeLabel('2027-03-14T12:00:00Z', now)).toBe('just now');
    expect(relativeTimeLabel('nope', now)).toBe('');
    expect(relativeTimeLabel('', now)).toBe('');
  });
  it('countdownLabel', () => {
    expect(countdownLabel(125 * 60_000)).toBe('2h 5m');
    expect(countdownLabel(35 * 60_000)).toBe('35m');
    expect(countdownLabel(60 * 60_000)).toBe('1h 0m');
    expect(countdownLabel(10_000)).toBe('<1m');
  });
});

describe('status', () => {
  const base: StatusGame = { status: 'scheduled', startTime: '2027-03-13T20:30:00Z', clock: null };
  const now = iso('2027-03-13T18:25:00Z'); // 2h 5m before

  it('live', () => {
    const g: StatusGame = { ...base, status: 'live', clock: { period: 3, clockSeconds: 491, phase: 'in_progress' } };
    expect(statusLine(g, now)).toBe('LIVE · Q3 8:11');
    expect(statusParts(g, now)).toMatchObject({ kind: 'live', label: 'LIVE', detail: 'Q3 8:11' });
  });
  it('halftime and period breaks', () => {
    expect(statusLine({ ...base, status: 'live', clock: { period: 2, clockSeconds: 0, phase: 'halftime' } }, now)).toBe('HALF');
    expect(statusLine({ ...base, status: 'live', clock: { period: 1, clockSeconds: 0, phase: 'break' } }, now)).toBe('END Q1');
    expect(statusParts({ ...base, status: 'live', clock: { period: 2, clockSeconds: 0, phase: 'halftime' } }, now).kind).toBe('halftime');
  });
  it('final and overtime', () => {
    expect(statusLine({ ...base, status: 'final' }, now)).toBe('FINAL');
    const four = { periodScores: [2, 3, 3, 4] };
    expect(statusLine({ ...base, status: 'final', home: four, away: four }, now)).toBe('FINAL');
    const ot = { periodScores: [2, 3, 3, 4, 1] };
    expect(statusLine({ ...base, status: 'final', home: ot, away: four }, now)).toBe('FINAL/OT');
    expect(statusLine({ ...base, status: 'final', home: { periodScores: [1, 1, 1, 1, 1, 1] } }, now)).toBe('FINAL/2OT');
  });
  it('scheduled: countdown, then weekday, then date', () => {
    expect(statusLine(base, now)).toBe('Starts in 2h 5m');
    expect(statusLine(base, iso('2027-03-12T10:00:00Z'))).toBe('Sat 3:30 PM ET');
    expect(statusLine(base, iso('2027-02-20T10:00:00Z'))).toBe('Mar 13 · 3:30 PM ET');
    expect(statusLine(base, iso('2027-03-13T20:31:00Z'))).toBe('Starting soon');
    expect(statusLine(base, now, { timeZone: 'America/Chicago', countdownWithinMs: 0 })).toBe('Sat 2:30 PM CT');
  });
  it('other statuses', () => {
    expect(statusLine({ ...base, status: 'delayed' }, now)).toBe('Delayed');
    expect(statusLine({ ...base, status: 'postponed' }, now)).toBe('Postponed');
    expect(statusLine({ ...base, status: 'canceled' }, now)).toBe('Canceled');
  });
});

describe('teams and players', () => {
  it('record and rank', () => {
    expect(record({ wins: 4, losses: 1 })).toBe('4-1');
    expect(record(null)).toBe('–');
    expect(rankLabel(2)).toBe('#2');
    expect(rankLabel(null)).toBe('');
  });
  it('names', () => {
    expect(playerShortName({ firstName: 'Brennan', lastName: 'Dowd' })).toBe('B. Dowd');
    expect(playerShortName({ firstName: '', lastName: 'Dowd' })).toBe('Dowd');
    expect(playerInitials({ firstName: 'brennan', lastName: 'Dowd' })).toBe('BD');
    expect(playerLabel({ firstName: 'Brennan', lastName: 'Dowd', jerseyNumber: 11 })).toBe('B. Dowd (#11)');
    expect(playerLabel({ firstName: 'Brennan', lastName: 'Dowd', jerseyNumber: 0 })).toBe('B. Dowd (#0)');
    expect(playerLabel({ firstName: 'Brennan', lastName: 'Dowd' })).toBe('B. Dowd');
  });
  it('labels', () => {
    expect(classYearLabel('Jr')).toBe('Jr');
    expect(classYearLabel('Gr', 'long')).toBe('Graduate');
    expect(positionLabel('A')).toBe('A');
    expect(positionLabel('FO', 'long')).toBe('Faceoff');
    expect(playerMeta({ jerseyNumber: 11, position: 'A', classYear: 'Jr' })).toBe('#11 · A · Jr');
  });
});
