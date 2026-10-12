/** Invented rosters: ~33 players per team in a realistic positional mix. */
import type { ClassYear, Player, Position } from '../../src/schema';
import type { Rng } from './rng';
import type { SimPlayer } from './sim';

const FIRST_NAMES = [
  'Aiden', 'Alex', 'Andrew', 'Ben', 'Blake', 'Brady', 'Brendan', 'Brody', 'Caleb', 'Cameron', 'Carter', 'Chase', 'Christian',
  'Colby', 'Colin', 'Connor', 'Cooper', 'Dane', 'Daniel', 'Declan', 'Dominic', 'Drew', 'Dylan', 'Eli', 'Elliot', 'Ethan', 'Evan',
  'Finn', 'Gavin', 'George', 'Grant', 'Griffin', 'Hayden', 'Henry', 'Hudson', 'Jack', 'Jackson', 'Jake', 'James', 'Jared', 'Jason',
  'Jesse', 'Joe', 'Jonah', 'Jordan', 'Josh', 'Kai', 'Keegan', 'Kevin', 'Kyle', 'Landon', 'Liam', 'Logan', 'Lucas', 'Luke', 'Mason',
  'Matt', 'Max', 'Miles', 'Nate', 'Nick', 'Noah', 'Owen', 'Parker', 'Patrick', 'Peter', 'Quinn', 'Reid', 'Riley', 'Ryan', 'Sam',
  'Sean', 'Shane', 'Spencer', 'Tanner', 'Theo', 'Thomas', 'Tim', 'Toby', 'Tom', 'Trevor', 'Tyler', 'Wesley', 'Will', 'Zach', 'Rory',
  'Beckett', 'Callum', 'Emmett', 'Graham', 'Harrison', 'Ian', 'Jonas', 'Kellan', 'Lennox', 'Murphy', 'Nolan', 'Preston', 'Rhys',
  'Sawyer', 'Tate', 'Vince', 'Walker', 'Xavier', 'Yusuf', 'Zane',
];

const LAST_NAMES = [
  'Abbott', 'Adler', 'Ames', 'Baker', 'Barlow', 'Bennett', 'Boyle', 'Brandt', 'Brennan', 'Briggs', 'Burke', 'Byrne', 'Callahan',
  'Cardone', 'Carver', 'Cassidy', 'Cavanaugh', 'Clancy', 'Coburn', 'Colby', 'Conlon', 'Cullen', 'Dalton', 'Davenport', 'Delaney',
  'Dempsey', 'Dillon', 'Donnelly', 'Doyle', 'Draper', 'Dunne', 'Eastwood', 'Ellison', 'Emery', 'Fallon', 'Farrell', 'Finnegan',
  'Fitch', 'Flynn', 'Foley', 'Garrity', 'Gentry', 'Gilmore', 'Gorman', 'Grady', 'Hadley', 'Halloran', 'Hanley', 'Hargrove', 'Hayes',
  'Hendry', 'Holloway', 'Hurley', 'Ingram', 'Jennings', 'Kearney', 'Keller', 'Kendall', 'Kilbride', 'Kinsella', 'Lang', 'Larkin',
  'Lennon', 'Linden', 'Lockhart', 'Lyons', 'Mahoney', 'Maloney', 'Mancuso', 'Marek', 'Marsh', 'McAllister', 'McBride', 'McCoy',
  'McGrath', 'McKenna', 'Mercer', 'Merritt', 'Monahan', 'Moran', 'Mulvey', 'Nash', 'Nolan', 'Novak', "O'Brien", "O'Hara", 'Orr',
  'Pearce', 'Penn', 'Pierce', 'Prescott', 'Quigley', 'Radcliffe', 'Rafferty', 'Reardon', 'Regan', 'Rooney', 'Rourke', 'Rowan',
  'Sagan', 'Scanlon', 'Shea', 'Sinclair', 'Slater', 'Sullivan', 'Sweeney', 'Tierney', 'Thackeray', 'Tolan', 'Trainor', 'Underhill',
  'Vance', 'Voss', 'Wald', 'Walsh', 'Whelan', 'Whitlock', 'Wyatt', 'Yeager', 'Zimmer', 'Aldridge', 'Barrett', 'Calloway', 'Dunmore',
  'Ferris', 'Galvin', 'Haskell', 'Kessler', 'Lombardi', 'Meadows', 'Rutledge', 'Stafford', 'Thorne', 'Winslow',
];

const HOMETOWNS = [
  'Garden City, N.Y.', 'Huntington, N.Y.', 'Manhasset, N.Y.', 'Syosset, N.Y.', 'Cold Spring Harbor, N.Y.', 'Rochester, N.Y.',
  'Pittsford, N.Y.', 'Baldwinsville, N.Y.', 'Towson, Md.', 'Annapolis, Md.', 'Bethesda, Md.', 'Severna Park, Md.', 'Baltimore, Md.',
  'Owings Mills, Md.', 'Ellicott City, Md.', 'Darien, Conn.', 'Westport, Conn.', 'Greenwich, Conn.', 'New Canaan, Conn.',
  'Wilton, Conn.', 'Avon, Conn.', 'Radnor, Pa.', 'Malvern, Pa.', 'Newtown Square, Pa.', 'Pittsburgh, Pa.', 'Wayne, Pa.',
  'Summit, N.J.', 'Ridgewood, N.J.', 'Red Bank, N.J.', 'Princeton, N.J.', 'Moorestown, N.J.', 'Charlotte, N.C.',
  'Raleigh, N.C.', 'Atlanta, Ga.', 'Charlottesville, Va.', 'Richmond, Va.', 'McLean, Va.', 'Dover, Mass.', 'Wellesley, Mass.',
  'Duxbury, Mass.', 'Scituate, Mass.', 'Andover, Mass.', 'Cincinnati, Ohio', 'Columbus, Ohio', 'Dublin, Ohio', 'Hinsdale, Ill.',
  'Denver, Colo.', 'Boulder, Colo.', 'Toronto, Ont.', 'Oakville, Ont.', 'Burlington, Ont.', 'Calgary, Alta.', 'Orange County, Calif.',
  'San Diego, Calif.', 'Tampa, Fla.', 'Jacksonville, Fla.', 'Austin, Texas', 'Dallas, Texas', 'Nashville, Tenn.', 'Louisville, Ky.',
];

const POSITION_COUNTS: ReadonlyArray<readonly [Position, number]> = [
  ['A', 7],
  ['M', 10],
  ['D', 6],
  ['LSM', 3],
  ['SSDM', 2],
  ['G', 3],
  ['FO', 2],
];

const CLASS_YEARS: ClassYear[] = ['Fr', 'So', 'Jr', 'Sr', 'Gr'];
const CLASS_WEIGHTS = [0.27, 0.25, 0.22, 0.19, 0.07];

const JERSEY_PREFERENCES: Record<Position, number[]> = {
  A: range(1, 29),
  M: range(1, 49),
  D: range(2, 59),
  LSM: range(2, 59),
  SSDM: range(2, 59),
  FO: range(1, 30),
  G: [1, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41],
};

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export interface GenPlayer {
  player: Player;
  /** Hidden skill used by the simulator (average = 1; FO = baseline win rate). */
  talent: number;
}

export const emptySeason = (): Player['season'] => ({
  gamesPlayed: 0,
  goals: 0,
  assists: 0,
  shots: 0,
  shotsOnGoal: 0,
  groundBalls: 0,
  turnovers: 0,
  causedTurnovers: 0,
  faceoffsWon: 0,
  faceoffsTaken: 0,
  saves: 0,
  goalsAgainst: 0,
});

function talentFor(rng: Rng, position: Position, depth: number): number {
  switch (position) {
    case 'FO':
      return Math.min(0.65, Math.max(0.42, 0.535 - depth * 0.045 + rng.normal(0, 0.03)));
    case 'G':
      return Math.max(0.78, 1.04 - depth * 0.07 + rng.normal(0, 0.07));
    default:
      return Math.exp(rng.normal(0, 0.33)) * (1 - depth * 0.015);
  }
}

/** Generate one team's roster. `usedNames` keeps names unique across the whole league. */
export function generateRoster(rng: Rng, teamId: string, usedNames: Set<string>): GenPlayer[] {
  const jerseys = new Set<number>();
  const takeJersey = (position: Position): number => {
    const preferred = rng.shuffle(JERSEY_PREFERENCES[position]).find((n) => !jerseys.has(n));
    const number = preferred ?? range(0, 99).find((n) => !jerseys.has(n)) ?? 99;
    jerseys.add(number);
    return number;
  };
  const takeName = (): [string, string] => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);
      const key = `${first} ${last}`;
      if (!usedNames.has(key)) {
        usedNames.add(key);
        return [first, last];
      }
    }
    throw new Error('Ran out of unique names');
  };

  const roster: GenPlayer[] = [];
  for (const [position, count] of POSITION_COUNTS) {
    // Sorted by talent so index = depth chart rank.
    const talents = Array.from({ length: count }, (_, depth) => talentFor(rng, position, depth)).sort((a, b) => b - a);
    talents.forEach((talent, depth) => {
      const [firstName, lastName] = takeName();
      const classYear = rng.weighted(CLASS_YEARS, (c) => (CLASS_WEIGHTS[CLASS_YEARS.indexOf(c)] ?? 0.1) * (depth < 2 ? 1.2 : 1));
      roster.push({
        talent,
        player: {
          id: `${teamId}-${roster.length + 1}`,
          teamId,
          firstName,
          lastName,
          jerseyNumber: takeJersey(position),
          position,
          classYear,
          photoUrl: null,
          hometown: rng.pick(HOMETOWNS),
          season: emptySeason(),
        },
      });
    });
  }
  return roster;
}

export const toSimPlayer = (g: GenPlayer): SimPlayer => ({
  id: g.player.id,
  position: g.player.position,
  talent: g.talent,
});
