import type { GameDetail } from '@pll/data/api';
import { dateLabel, pct, statusParts, timeLabel, type StatusKind } from '../../lib/format';

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
    date: dateLabel(game.startTime, timeZone),
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

/** Tags above the matchup: the event label ("NCAA Quarterfinal") and "Neutral site". */
export function eventTags(game: Pick<HeaderGame, 'label' | 'neutralSite'>): string[] {
  const tags: string[] = [];
  if (game.label) tags.push(game.label);
  if (game.neutralSite) tags.push('Neutral site');
  return tags;
}

/** The winner of a final game, or `null` for a tie / unknown / not final. */
export function winnerSide(game: Pick<HeaderGame, 'status' | 'home' | 'away'>): HeaderSide | null {
  if (game.status !== 'final') return null;
  const { home, away } = game;
  if (home.score === null || away.score === null || home.score === away.score) return null;
  return home.score > away.score ? 'home' : 'away';
}

/** Column headings of the linescore: Q1..Q4 always, plus an OT column for each extra period played. */
export function linescorePeriods(game: Pick<HeaderGame, 'home' | 'away'>): number[] {
  const played = Math.max(game.home.periodScores.length, game.away.periodScores.length);
  return Array.from({ length: Math.max(4, played) }, (_, i) => i + 1);
}
