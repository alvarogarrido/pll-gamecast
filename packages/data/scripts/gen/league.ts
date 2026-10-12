/** Static league data: conferences and the 16 real D1 programs (colors, mascots, home venues). */
import type { Conference } from '../../src/schema';

export const CONFERENCES: Conference[] = [
  { id: 'acc', name: 'Atlantic Coast Conference', shortName: 'ACC' },
  { id: 'big-ten', name: 'Big Ten Conference', shortName: 'Big Ten' },
  { id: 'ivy', name: 'Ivy League', shortName: 'Ivy' },
  { id: 'big-east', name: 'Big East Conference', shortName: 'Big East' },
];

export type TimeZone = 'ET' | 'MT';

export interface TeamSeed {
  id: string;
  school: string;
  mascot: string;
  abbreviation: string;
  conferenceId: string;
  primary: string;
  secondary: string;
  /** ESPN CDN team id, verified with HEAD requests (200). */
  espnId: number;
  /** null when not certain of the current coach. */
  headCoach: string | null;
  venue: { name: string; city: string; state: string };
  indoor: boolean;
  timeZone: TimeZone;
  /** Typical mid-March high temperature at the venue, deg F. */
  marchHighF: number;
  /** Hidden preseason strength in goals of expected margin vs an average team. */
  strength: number;
}

export const TEAM_SEEDS: TeamSeed[] = [
  { id: 'notre-dame', school: 'Notre Dame', mascot: 'Fighting Irish', abbreviation: 'ND', conferenceId: 'acc', primary: '#0C2340', secondary: '#C99700', espnId: 87, headCoach: 'Kevin Corrigan', venue: { name: 'Arlotta Stadium', city: 'Notre Dame', state: 'IN' }, indoor: false, timeZone: 'ET', marchHighF: 44, strength: 4.5 },
  { id: 'duke', school: 'Duke', mascot: 'Blue Devils', abbreviation: 'DUKE', conferenceId: 'acc', primary: '#003087', secondary: '#FFFFFF', espnId: 150, headCoach: 'John Danowski', venue: { name: 'Koskinen Stadium', city: 'Durham', state: 'NC' }, indoor: false, timeZone: 'ET', marchHighF: 62, strength: 3.6 },
  { id: 'syracuse', school: 'Syracuse', mascot: 'Orange', abbreviation: 'CUSE', conferenceId: 'acc', primary: '#D44500', secondary: '#000E54', espnId: 183, headCoach: 'Gary Gait', venue: { name: 'JMA Wireless Dome', city: 'Syracuse', state: 'NY' }, indoor: true, timeZone: 'ET', marchHighF: 68, strength: 3.2 },
  { id: 'virginia', school: 'Virginia', mascot: 'Cavaliers', abbreviation: 'UVA', conferenceId: 'acc', primary: '#232D4B', secondary: '#F84C1E', espnId: 258, headCoach: 'Lars Tiffany', venue: { name: 'Klöckner Stadium', city: 'Charlottesville', state: 'VA' }, indoor: false, timeZone: 'ET', marchHighF: 58, strength: 2.6 },
  { id: 'north-carolina', school: 'North Carolina', mascot: 'Tar Heels', abbreviation: 'UNC', conferenceId: 'acc', primary: '#7BAFD4', secondary: '#13294B', espnId: 153, headCoach: 'Joe Breschi', venue: { name: 'Fetzer Field', city: 'Chapel Hill', state: 'NC' }, indoor: false, timeZone: 'ET', marchHighF: 63, strength: 1.0 },
  { id: 'maryland', school: 'Maryland', mascot: 'Terrapins', abbreviation: 'UMD', conferenceId: 'big-ten', primary: '#E03A3E', secondary: '#FFD520', espnId: 120, headCoach: 'John Tillman', venue: { name: 'SECU Stadium', city: 'College Park', state: 'MD' }, indoor: false, timeZone: 'ET', marchHighF: 56, strength: 4.0 },
  { id: 'johns-hopkins', school: 'Johns Hopkins', mascot: 'Blue Jays', abbreviation: 'JHU', conferenceId: 'big-ten', primary: '#002D72', secondary: '#68ACE5', espnId: 118, headCoach: 'Peter Milliman', venue: { name: 'Homewood Field', city: 'Baltimore', state: 'MD' }, indoor: false, timeZone: 'ET', marchHighF: 55, strength: 3.0 },
  { id: 'penn-state', school: 'Penn State', mascot: 'Nittany Lions', abbreviation: 'PSU', conferenceId: 'big-ten', primary: '#041E42', secondary: '#96BEE6', espnId: 213, headCoach: 'Jeff Tambroni', venue: { name: 'Panzer Stadium', city: 'University Park', state: 'PA' }, indoor: false, timeZone: 'ET', marchHighF: 47, strength: 2.0 },
  { id: 'michigan', school: 'Michigan', mascot: 'Wolverines', abbreviation: 'MICH', conferenceId: 'big-ten', primary: '#00274C', secondary: '#FFCB05', espnId: 130, headCoach: 'Kevin Conry', venue: { name: 'Michigan Lacrosse Stadium', city: 'Ann Arbor', state: 'MI' }, indoor: false, timeZone: 'ET', marchHighF: 43, strength: 0.6 },
  { id: 'ohio-state', school: 'Ohio State', mascot: 'Buckeyes', abbreviation: 'OSU', conferenceId: 'big-ten', primary: '#BB0000', secondary: '#666666', espnId: 194, headCoach: 'Nick Myers', venue: { name: 'Ohio Stadium', city: 'Columbus', state: 'OH' }, indoor: false, timeZone: 'ET', marchHighF: 50, strength: 0.0 },
  { id: 'princeton', school: 'Princeton', mascot: 'Tigers', abbreviation: 'PRIN', conferenceId: 'ivy', primary: '#FF8F00', secondary: '#000000', espnId: 163, headCoach: 'Matt Madalon', venue: { name: 'Class of 1952 Stadium', city: 'Princeton', state: 'NJ' }, indoor: false, timeZone: 'ET', marchHighF: 51, strength: 2.4 },
  { id: 'cornell', school: 'Cornell', mascot: 'Big Red', abbreviation: 'COR', conferenceId: 'ivy', primary: '#B31B1B', secondary: '#FFFFFF', espnId: 172, headCoach: 'Connor Buczek', venue: { name: 'Schoellkopf Field', city: 'Ithaca', state: 'NY' }, indoor: false, timeZone: 'ET', marchHighF: 41, strength: 4.2 },
  { id: 'penn', school: 'Penn', mascot: 'Quakers', abbreviation: 'PENN', conferenceId: 'ivy', primary: '#011F5B', secondary: '#990000', espnId: 219, headCoach: 'Mike Murphy', venue: { name: 'Franklin Field', city: 'Philadelphia', state: 'PA' }, indoor: false, timeZone: 'ET', marchHighF: 52, strength: -0.6 },
  { id: 'yale', school: 'Yale', mascot: 'Bulldogs', abbreviation: 'YALE', conferenceId: 'ivy', primary: '#00356B', secondary: '#286DC0', espnId: 43, headCoach: 'Andy Shay', venue: { name: 'Reese Stadium', city: 'New Haven', state: 'CT' }, indoor: false, timeZone: 'ET', marchHighF: 46, strength: 1.4 },
  { id: 'georgetown', school: 'Georgetown', mascot: 'Hoyas', abbreviation: 'GTWN', conferenceId: 'big-east', primary: '#041E42', secondary: '#8D817B', espnId: 46, headCoach: 'Kevin Warne', venue: { name: 'Cooper Field', city: 'Washington', state: 'DC' }, indoor: false, timeZone: 'ET', marchHighF: 56, strength: -1.6 },
  { id: 'denver', school: 'Denver', mascot: 'Pioneers', abbreviation: 'DEN', conferenceId: 'big-east', primary: '#BA0C2F', secondary: '#A89968', espnId: 2172, headCoach: 'Matt Brown', venue: { name: 'Peter Barton Lacrosse Stadium', city: 'Denver', state: 'CO' }, indoor: false, timeZone: 'MT', marchHighF: 53, strength: -1.0 },
];

export const logoUrl = (espnId: number) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;

/** Neutral site for the NCAA quarterfinal. */
export const NCAA_VENUE = { name: 'Gillette Stadium', city: 'Foxborough', state: 'MA' };
