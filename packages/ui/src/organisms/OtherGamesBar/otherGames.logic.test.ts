import { describe, expect, it } from 'vitest';
import { gameBucket, orderOtherGames, rankFacts } from './otherGames.logic';

type G = Parameters<typeof orderOtherGames>[0][number];

let n = 0;
function game(
  id: string,
  status: G['status'],
  startTime: string,
  awayRank: number | null = null,
  homeRank: number | null = null,
): G & { id: string } {
  n += 1;
  return {
    id: id || `g${n}`,
    status,
    startTime,
    away: { rank: awayRank },
    home: { rank: homeRank },
  } as G & { id: string };
}
const ids = (games: { id: string }[]) => games.map((g) => g.id);

describe('gameBucket', () => {
  it('maps statuses to buckets', () => {
    expect(gameBucket({ status: 'live' })).toBe('live');
    expect(gameBucket({ status: 'final' })).toBe('completed');
    for (const s of ['scheduled', 'delayed', 'postponed', 'canceled'] as const) expect(gameBucket({ status: s })).toBe('upcoming');
  });
});

describe('rankFacts', () => {
  it('counts ranked teams, sums ranks and finds the best one', () => {
    expect(rankFacts({ away: { rank: 3 }, home: { rank: 9 } } as G)).toEqual({ rankedCount: 2, rankSum: 12, bestRank: 3 });
  });
  it('treats unranked as Infinity', () => {
    expect(rankFacts({ away: { rank: null }, home: { rank: 9 } } as G)).toEqual({ rankedCount: 1, rankSum: Infinity, bestRank: 9 });
    expect(rankFacts({ away: { rank: null }, home: { rank: null } } as G)).toEqual({ rankedCount: 0, rankSum: Infinity, bestRank: Infinity });
  });
});

describe('orderOtherGames', () => {
  it('puts live first, then upcoming, then completed', () => {
    const list = [
      game('final', 'final', '2027-03-13T14:00:00Z'),
      game('later', 'scheduled', '2027-03-13T23:00:00Z'),
      game('live', 'live', '2027-03-13T19:00:00Z'),
    ];
    expect(ids(orderOtherGames(list))).toEqual(['live', 'later', 'final']);
  });

  it('sorts by start time ascending inside a bucket, whatever the rankings', () => {
    const list = [
      game('b', 'scheduled', '2027-03-13T21:00:00Z', 1, 2),
      game('a', 'scheduled', '2027-03-13T18:00:00Z'),
    ];
    expect(ids(orderOtherGames(list))).toEqual(['a', 'b']);
  });

  it('breaks start-time ties by ranked-team count, descending', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [game('none', 'scheduled', t), game('one', 'scheduled', t, null, 4), game('two', 'scheduled', t, 15, 18)];
    expect(ids(orderOtherGames(list))).toEqual(['two', 'one', 'none']);
  });

  it('then by rank sum ascending', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [game('sum20', 'scheduled', t, 10, 10), game('sum6', 'scheduled', t, 1, 5), game('sum12', 'scheduled', t, 4, 8)];
    expect(ids(orderOtherGames(list))).toEqual(['sum6', 'sum12', 'sum20']);
  });

  it('then by best single rank ascending (equal sums)', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [game('best5', 'scheduled', t, 5, 7), game('best1', 'scheduled', t, 1, 11), game('best3', 'scheduled', t, 3, 9)];
    expect(ids(orderOtherGames(list))).toEqual(['best1', 'best3', 'best5']);
  });

  it('uses best rank to separate games that each have one ranked team (sum is Infinity for both)', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [game('r9', 'scheduled', t, null, 9), game('r2', 'scheduled', t, 2, null)];
    expect(ids(orderOtherGames(list))).toEqual(['r2', 'r9']);
  });

  it('applies the whole rule inside the live and completed buckets too', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [
      game('f-unranked', 'final', t),
      game('f-ranked', 'final', t, 6, 12),
      game('l-late', 'live', '2027-03-13T19:00:00Z', 1, 2),
      game('l-early', 'live', t),
    ];
    expect(ids(orderOtherGames(list))).toEqual(['l-early', 'l-late', 'f-ranked', 'f-unranked']);
  });

  it('keeps input order for complete ties and does not mutate the input', () => {
    const t = '2027-03-13T18:00:00Z';
    const list = [game('x', 'scheduled', t), game('y', 'scheduled', t), game('z', 'scheduled', t)];
    const copy = [...list];
    expect(ids(orderOtherGames(list))).toEqual(['x', 'y', 'z']);
    expect(list).toEqual(copy);
  });
});
