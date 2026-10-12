import { describe, expect, it } from 'vitest';
import type { GameDetail, GamePreview, GameStats, PlayerRef } from '@pll/data/api';
import {
  buildPlayersToWatch,
  buildTopPerformers,
  isEmptySections,
  ratio,
  selectTopFaceoff,
  selectTopGoalie,
  selectTopScorer,
  type Candidate,
} from './topPerformers.logic';

const zero = { goals: 0, assists: 0, shots: 0, turnovers: 0, saves: 0, goalsAgainst: 0, faceoffsWon: 0, faceoffsTaken: 0 };

const ref = (id: string, teamId: string, position: PlayerRef['position'] = 'A', jerseyNumber = 1): PlayerRef => ({
  id,
  teamId,
  firstName: 'First',
  lastName: id,
  jerseyNumber,
  position,
  classYear: 'Jr',
  photoUrl: null,
});

const cand = (id: string, tally: Partial<typeof zero> & { points?: number }, position: PlayerRef['position'] = 'A', jersey = 1): Candidate => ({
  player: ref(id, 'a', position, jersey),
  tally: { ...zero, ...tally },
});

describe('selectTopScorer', () => {
  it('picks most points', () => {
    const top = selectTopScorer([cand('x', { goals: 1, assists: 1 }), cand('y', { goals: 1, assists: 3 })]);
    expect(top?.player.id).toBe('y');
  });
  it('breaks a points tie with goals, then fewer shots', () => {
    expect(selectTopScorer([cand('x', { goals: 1, assists: 2 }), cand('y', { goals: 2, assists: 1 })])?.player.id).toBe('y');
    expect(
      selectTopScorer([cand('x', { goals: 2, assists: 1, shots: 9 }), cand('y', { goals: 2, assists: 1, shots: 5 })])?.player.id,
    ).toBe('y');
  });
  it('uses an explicit points field when present', () => {
    expect(selectTopScorer([cand('x', { goals: 3, points: 3 }), cand('y', { goals: 1, assists: 1, points: 4 })])?.player.id).toBe('y');
  });
  it('is null when nobody has a point', () => {
    expect(selectTopScorer([cand('x', { shots: 4 })])).toBeNull();
    expect(selectTopScorer([])).toBeNull();
  });
});

describe('selectTopGoalie', () => {
  it('only considers goalies, most saves', () => {
    const top = selectTopGoalie([cand('f', { saves: 20 }, 'D'), cand('g1', { saves: 8 }, 'G'), cand('g2', { saves: 11 }, 'G')]);
    expect(top?.player.id).toBe('g2');
  });
  it('breaks ties with fewer goals against', () => {
    expect(selectTopGoalie([cand('g1', { saves: 8, goalsAgainst: 9 }, 'G'), cand('g2', { saves: 8, goalsAgainst: 7 }, 'G')])?.player.id).toBe('g2');
  });
  it('ignores a goalie who has not faced a shot', () => {
    expect(selectTopGoalie([cand('g1', {}, 'G')])).toBeNull();
  });
});

describe('selectTopFaceoff', () => {
  it('needs faceoffs taken and picks most won', () => {
    const top = selectTopFaceoff([cand('a', { faceoffsWon: 5, faceoffsTaken: 12 }), cand('b', { faceoffsWon: 7, faceoffsTaken: 10 }), cand('c', {})]);
    expect(top?.player.id).toBe('b');
  });
  it('breaks ties with FO%', () => {
    expect(selectTopFaceoff([cand('a', { faceoffsWon: 5, faceoffsTaken: 12 }), cand('b', { faceoffsWon: 5, faceoffsTaken: 9 })])?.player.id).toBe('b');
  });
  it('is null with no faceoffs taken', () => {
    expect(selectTopFaceoff([cand('a', { faceoffsWon: 0, faceoffsTaken: 0 })])).toBeNull();
  });
});

describe('ratio', () => {
  it('guards a zero denominator', () => {
    expect(ratio(1, 0)).toBeNull();
    expect(ratio(1, 4)).toBe(0.25);
  });
});

const team = (id: string, color: string) => ({ id, colors: { primary: color, secondary: '#000000' } });
const game = { away: { team: team('a', '#111111') }, home: { team: team('h', '#222222') } } as unknown as GameDetail['data'];

const line = (playerId: string, teamId: string, over: Partial<typeof zero> & { points?: number } = {}) => ({
  playerId,
  teamId,
  ...zero,
  points: (over.goals ?? 0) + (over.assists ?? 0),
  shotsOnGoal: 0,
  groundBalls: 0,
  causedTurnovers: 0,
  penalties: 0,
  penaltySeconds: 0,
  ...over,
});

describe('buildTopPerformers', () => {
  const stats = {
    teams: [],
    playerRefs: [ref('p1', 'a'), ref('g1', 'a', 'G'), ref('p2', 'h'), ref('fo2', 'h', 'FO')],
    players: [
      line('p1', 'a', { goals: 3, assists: 2, shots: 7 }),
      line('g1', 'a', { saves: 10, goalsAgainst: 5 }),
      line('p2', 'h', { goals: 1, assists: 0, shots: 2 }),
      line('fo2', 'h', { faceoffsWon: 6, faceoffsTaken: 10, turnovers: 2 }),
    ],
  } as unknown as GameStats['data'];

  it('builds three sections, away and home sides kept apart', () => {
    const [scoring, goalie, faceoff] = buildTopPerformers(stats, game);
    expect(scoring?.away?.player.id).toBe('p1');
    expect(scoring?.away?.primary).toEqual({ value: '3', label: 'Goals' });
    expect(scoring?.away?.secondary).toEqual(['3/7 SH', '2 A', '5 PTS']);
    expect(scoring?.home?.player.id).toBe('p2');
    expect(goalie?.away?.primary.value).toBe('10');
    expect(goalie?.away?.secondary).toEqual(['66.7% SV%']);
    expect(goalie?.home).toBeNull();
    expect(faceoff?.home?.secondary).toEqual(['60.0% FO%', '2 TO']);
    expect(faceoff?.away).toBeNull();
    expect(scoring?.away?.teamColor).toBe('#111111');
  });

  it('handles an empty game (no qualifying player on any side)', () => {
    const sections = buildTopPerformers({ teams: [], players: [], playerRefs: [] } as unknown as GameStats['data'], game);
    expect(isEmptySections(sections)).toBe(true);
  });
});

describe('buildPlayersToWatch', () => {
  const season = (over: Partial<typeof zero> & { gamesPlayed?: number }) => ({ ...zero, gamesPlayed: 4, shotsOnGoal: 0, groundBalls: 0, causedTurnovers: 0, ...over });
  const rp = (id: string, teamId: string, position: PlayerRef['position'], s: ReturnType<typeof season>) => ({ ...ref(id, teamId, position), season: s });
  const preview = {
    rosters: {
      away: [
        rp('a1', 'a', 'A', season({ goals: 10, assists: 2, shots: 25 })),
        rp('ag', 'a', 'G', season({ saves: 40, goalsAgainst: 20 })),
      ],
      home: [rp('h1', 'h', 'A', season({ gamesPlayed: 0 }))],
    },
  } as unknown as GamePreview['data'];

  it('formats season rates to 1 decimal and handles a side without data', () => {
    const [scoring, goalie, faceoff] = buildPlayersToWatch(preview, game);
    expect(scoring?.away?.primary).toEqual({ value: '2.5', label: 'Goals/G' });
    expect(scoring?.away?.secondary).toEqual(['6.3 SH/G', '40.0% SH%']);
    expect(scoring?.home).toBeNull();
    expect(goalie?.away?.primary.value).toBe('10.0');
    expect(goalie?.away?.secondary).toEqual(['66.7% SV%']);
    expect(faceoff?.away).toBeNull();
  });
});
