/** Calendar helpers for the 2027 season. All stored times are UTC ISO strings. */
import type { TimeZone } from './league';

export const SEASON = 2027;
/** Week 1 Saturday: Feb 6, 2027. The snapshot (week 6) is Saturday, March 13, 2027. */
const WEEK_ONE_SATURDAY_UTC = Date.UTC(SEASON, 1, 6);
export const SNAPSHOT_WEEK = 6;
export const SNAPSHOT_DATE = '2027-03-13';
/** 3:30 PM EST (US daylight time starts the next day, March 14). */
export const SNAPSHOT_TIME = '2027-03-13T20:30:00Z';
export const NCAA_QUARTERFINAL_DATE = '2027-05-15';
export const NCAA_QUARTERFINAL_WEEK = 15;

const DAY_MS = 86_400_000;

/** 'YYYY-MM-DD' of the Saturday of `week`, plus `dayOffset` days. */
export function dateForWeek(week: number, dayOffset = 0): string {
  return new Date(WEEK_ONE_SATURDAY_UTC + ((week - 1) * 7 + dayOffset) * DAY_MS).toISOString().slice(0, 10);
}

/** US daylight time in 2027: March 14 - November 6. */
const isDaylightTime = (date: string) => date >= '2027-03-14' && date < '2027-11-07';

/** Local wall-clock time at a venue -> UTC ISO string. */
export function localIso(date: string, hour: number, minute: number, timeZone: TimeZone): string {
  const standard = timeZone === 'ET' ? 5 : 7;
  const offset = isDaylightTime(date) ? standard - 1 : standard;
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, hour + offset, minute)).toISOString().replace('.000Z', 'Z');
}

export const addMinutes = (iso: string, minutes: number): string =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString().replace('.000Z', 'Z');

/** Month index (0 = Jan) of an ISO date. */
export const monthOf = (isoOrDate: string): number => Number(isoOrDate.slice(5, 7)) - 1;

/** "1:15 PM" local to the venue's time zone. */
export function formatLocalTime(iso: string, timeZone: TimeZone): string {
  const date = iso.slice(0, 10);
  const standard = timeZone === 'ET' ? 5 : 7;
  const offset = isDaylightTime(date) ? standard - 1 : standard;
  const local = new Date(Date.parse(iso) - offset * 3_600_000);
  const h = local.getUTCHours();
  const m = local.getUTCMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'} ${timeZone}`;
}
