import { describe, expect, it } from 'vitest';
import { attendanceLabel, isIndoor, locationLabel, precipitationLabel, temperatureLabel, weatherLabel } from './venue.logic';

describe('venue logic', () => {
  it('treats null weather and the indoor condition as indoor', () => {
    expect(isIndoor(null)).toBe(true);
    expect(isIndoor({ temperatureF: 68, condition: 'indoor', precipitationChance: null })).toBe(true);
    expect(isIndoor({ temperatureF: 53, condition: 'wind', precipitationChance: 0.09 })).toBe(false);
  });
  it('formats weather', () => {
    expect(temperatureLabel({ temperatureF: 52.6 })).toBe('53°F');
    expect(weatherLabel('partly_cloudy')).toBe('Partly cloudy');
    expect(precipitationLabel({ precipitationChance: 0.09 })).toBe('9% chance of precipitation');
    expect(precipitationLabel({ precipitationChance: 0 })).toBe('No precipitation expected');
    expect(precipitationLabel({ precipitationChance: null })).toBeNull();
  });
  it('formats location and attendance', () => {
    expect(locationLabel({ city: 'Princeton', state: 'NJ' })).toBe('Princeton, NJ');
    expect(attendanceLabel(12345)).toBe('12,345');
    expect(attendanceLabel(null)).toBeNull();
    expect(attendanceLabel(0)).toBeNull();
  });
});
