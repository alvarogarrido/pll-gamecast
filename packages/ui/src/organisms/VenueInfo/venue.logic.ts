import type { GameDetail } from '@pll/data/api';
import { count, pct } from '../../lib/format';

export type VenueGame = Pick<GameDetail['data'], 'venue' | 'weather' | 'neutralSite' | 'attendance'>;
export type Weather = NonNullable<GameDetail['data']['weather']>;
export type WeatherCondition = Weather['condition'];

const conditionLabels: Record<WeatherCondition, string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  wind: 'Windy',
  indoor: 'Indoor',
};

export const weatherLabel = (condition: WeatherCondition): string => conditionLabels[condition];

/** Indoor venues report no weather (`null`) or the `indoor` condition: nothing to forecast either way. */
export const isIndoor = (weather: Weather | null): boolean => weather === null || weather.condition === 'indoor';

/** `"53°F"`. */
export const temperatureLabel = (weather: Pick<Weather, 'temperatureF'>): string => `${Math.round(weather.temperatureF)}°F`;

/** `"9% chance of precipitation"`, `"No precipitation expected"` at 0, `null` when unknown. */
export function precipitationLabel(weather: Pick<Weather, 'precipitationChance'>): string | null {
  const chance = weather.precipitationChance;
  if (chance === null || !Number.isFinite(chance)) return null;
  if (chance <= 0) return 'No precipitation expected';
  return `${pct(chance, 0)} chance of precipitation`;
}

/** `"Princeton, NJ"`. */
export const locationLabel = (venue: Pick<VenueGame['venue'], 'city' | 'state'>): string =>
  [venue.city, venue.state].filter(Boolean).join(', ');

/** `"12,345"`, or `null` while the crowd is unknown (before and during most games). */
export const attendanceLabel = (attendance: number | null): string | null =>
  attendance === null || !Number.isFinite(attendance) || attendance <= 0 ? null : count(attendance);
