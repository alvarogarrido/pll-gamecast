import type { GameDetail } from '@pll/data/api';
import { winnerSide } from '../../molecules/Linescore/linescore.logic';
import { count, dateLabel, pct, record, statusParts, timeLabel, type StatusKind } from '../../lib/format';

export type HeaderGame = GameDetail['data'];
export type HeaderSide = 'away' | 'home';

/** `pre` (not started, including delayed / postponed / canceled), `live` (also halftime) or `final`. */
export type HeaderPhase = 'pre' | 'live' | 'final';

export function headerPhase(game: Pick<HeaderGame, 'status'>): HeaderPhase {
  if (game.status === 'live') return 'live';
  if (game.status === 'final') return 'final';
  return 'pre';
}

export interface PreStatus {
  /** `Mar 13`. */
  date: string;
  /** `3:30 PM ET`. */
  time: string;
  /** `Starts in 2h 5m` when the game starts within the countdown window (12 h), else `null`. */
  countdown: string | null;
  /** `Delayed`, `Postponed`, `Canceled` or `Starting soon`, else `null`. */
  notice: string | null;
  kind: StatusKind;
}

/** Pieces of the pregame center column of the header. */
export function preStatus(game: Pick<HeaderGame, 'status' | 'startTime'>, nowMs: number, timeZone?: string): PreStatus {
  const parts = statusParts({ status: game.status, startTime: game.startTime }, nowMs, { timeZone });
  const countdown = parts.label.startsWith('Starts in') ? parts.label : null;
  const notice = game.status !== 'scheduled' || parts.label === 'Starting soon' ? parts.label : null;
  return {
    date: dateLabel(game.startTime, timeZone, { weekday: true }),
    time: timeLabel(game.startTime, timeZone),
    countdown,
    notice,
    kind: parts.kind,
  };
}

/** `Homewood Field · Baltimore, MD`. */
export function venueLabel(venue: HeaderGame['venue']): { name: string; place: string } {
  const place = [venue.city, venue.state].filter(Boolean).join(', ');
  return { name: venue.name, place };
}

const CONDITIONS: Record<NonNullable<HeaderGame['weather']>['condition'], string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  wind: 'Windy',
  indoor: 'Indoor',
};

/** `52°F · Windy · 9% precip`. Precipitation only when the chance is above zero. `null` without weather. */
export function weatherLabel(weather: HeaderGame['weather']): string | null {
  if (!weather) return null;
  const parts = [`${weather.temperatureF}°F`, CONDITIONS[weather.condition]];
  if (weather.precipitationChance !== null && weather.precipitationChance > 0) {
    parts.push(`${pct(weather.precipitationChance, 0)} precip`);
  }
  return parts.join(' · ');
}

/**
 * Post-game rank / RPI movement (D13): only a real change shows. `0` (unchanged) and `null` (unknown) both give `null`,
 * so the header draws no "=" indicator.
 */
export function realMovement(change: number | null | undefined): number | null {
  return typeof change === 'number' && Number.isFinite(change) && change !== 0 ? change : null;
}

/** Tags above the matchup: the event label ("NCAA Quarterfinal") and "Neutral site". */
export function eventTags(game: Pick<HeaderGame, 'label' | 'neutralSite'>): string[] {
  const tags: string[] = [];
  if (game.label) tags.push(game.label);
  if (game.neutralSite) tags.push('Neutral site');
  return tags;
}


// ---- Desktop band (D22) --------------------------------------------------

/** `Seed 2 · 4-0 · ACC · RPI 2`: the single meta line under a team's name in the desktop band. Missing parts are skipped. */
export function teamMetaLine(side: Pick<HeaderGame['home'], 'record' | 'conferenceShortName' | 'rpi' | 'seed'>): string {
  const parts: string[] = [];
  if (side.seed !== null) parts.push(`Seed ${side.seed}`);
  parts.push(record(side.record));
  if (side.conferenceShortName) parts.push(side.conferenceShortName);
  if (side.rpi !== null) parts.push(`RPI ${side.rpi}`);
  return parts.join(' · ');
}

/** Post-game rank / RPI movement of one side (D13: only real movement). Both `null` before the game ends or when nothing moved. */
export function sideMovement(
  side: Pick<HeaderGame['home'], 'rank' | 'rankChange' | 'rpiChange'>,
  phase: HeaderPhase,
): { rank: number | null; rpi: number | null } {
  if (phase !== 'final') return { rank: null, rpi: null };
  return { rank: side.rank !== null ? realMovement(side.rankChange) : null, rpi: realMovement(side.rpiChange) };
}

/** `Cornell won by 3`. `null` while the game is not final, tied, or a score is unknown. */
export function resultLine(game: Pick<HeaderGame, 'status' | 'away' | 'home'>): string | null {
  if (game.status !== 'final') return null;
  const winner = winnerSide(game);
  const { away, home } = game;
  if (!winner || away.score === null || home.score === null) return null;
  return `${game[winner].team.school} won by ${Math.abs(away.score - home.score)}`;
}

/** `Att. 4,690`, or `null` while the crowd is unknown. */
export function attendanceLabel(attendance: HeaderGame['attendance']): string | null {
  return attendance !== null && Number.isFinite(attendance) && attendance > 0 ? `Att. ${count(attendance)}` : null;
}

/** Away / home win probability as whole-percent fractions for the pregame split, or `null` without a value. */
export function winProbabilitySplit(game: Pick<HeaderGame, 'winProbabilityHome'>): { away: number; home: number } | null {
  const home = game.winProbabilityHome;
  if (home === null || !Number.isFinite(home)) return null;
  const h = Math.min(1, Math.max(0, home));
  return { away: 1 - h, home: h };
}

// The linescore helpers live with the Linescore molecule; re-exported so existing imports of the header logic keep working.
export { linescorePeriods, winnerSide } from '../../molecules/Linescore/linescore.logic';
