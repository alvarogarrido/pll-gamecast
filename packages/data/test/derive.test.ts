import { describe, expect, it } from 'vitest';
import {
  autoInsights,
  clockAtElapsed,
  describePlay,
  elapsedAtWallClock,
  elapsedOf,
  formatClock,
  periodLabel,
  playsUpTo,
  scoreFromPlays,
  shortName,
  wallClockAt,
  winProbabilityHome,
} from '../src/derive';
import type { PlayRecord } from '../src/schema';
import { db } from './helpers';

const names = {
  players: new Map(db.players.map((p) => [p.id, p])),
  teams: new Map(db.teams.map((t) => [t.id, t])),
};

describe('clock', () => {
  it('maps periods to elapsed seconds, including OT', () => {
    expect(elapsedOf(1, 900)).toBe(0);
    expect(elapsedOf(2, 900)).toBe(900);
    expect(elapsedOf(4, 0)).toBe(3600);
    expect(elapsedOf(5, 240)).toBe(3600);
    expect(elapsedOf(6, 0)).toBe(3600 + 480);
    expect(clockAtElapsed(3700)).toEqual({ period: 5, clockSeconds: 140, phase: 'in_progress' });
    expect(clockAtElapsed(900)).toEqual({ period: 1, clockSeconds: 0, phase: 'break' });
    expect(clockAtElapsed(1800).phase).toBe('halftime');
    expect(periodLabel(5)).toBe('OT');
    expect(formatClock(75)).toBe('1:15');
  });

  it('wall clock and game clock are inverse-consistent and monotone', () => {
    const start = '2027-03-13T18:15:00Z';
    let last = '';
    for (const e of [0, 500, 900, 1800, 2700, 3457, 3600]) {
      const t = wallClockAt(start, e);
      expect(t > last).toBe(true);
      last = t;
      expect(elapsedAtWallClock(start, t, 4000)).toBe(e);
    }
    expect(elapsedAtWallClock(start, '2027-03-13T20:30:00Z')).toBeGreaterThan(3300);
  });
});

describe('win probability model', () => {
  const base = { margin: 0, secondsRemaining: 1800, prior: 0.5 };
  it('is strictly inside (0,1) everywhere', () => {
    for (const margin of [-20, -5, 0, 5, 20]) {
      for (const secondsRemaining of [0, 1, 60, 900, 3600]) {
        for (const prior of [0.01, 0.5, 0.99]) {
          for (const over of [false, true]) {
            const p = winProbabilityHome({ margin, secondsRemaining, prior, over });
            expect(p).toBeGreaterThan(0);
            expect(p).toBeLessThan(1);
          }
        }
      }
    }
  });
  it('increases with home margin and with the prior', () => {
    let last = 0;
    for (let margin = -8; margin <= 8; margin++) {
      const p = winProbabilityHome({ ...base, margin });
      expect(p).toBeGreaterThan(last);
      last = p;
    }
    let lastPrior = 0;
    for (const prior of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const p = winProbabilityHome({ ...base, prior });
      expect(p).toBeGreaterThan(lastPrior);
      lastPrior = p;
    }
  });
  it('rewards the leader as time runs out and gives a tie back the prior', () => {
    let last = 0;
    for (const secondsRemaining of [3600, 2400, 1200, 600, 120, 10]) {
      const p = winProbabilityHome({ margin: 2, secondsRemaining, prior: 0.5 });
      expect(p).toBeGreaterThan(last);
      last = p;
    }
    expect(winProbabilityHome({ margin: -2, secondsRemaining: 10, prior: 0.5 })).toBeLessThan(0.05);
    expect(winProbabilityHome({ margin: 0, secondsRemaining: 3600, prior: 0.7 })).toBeCloseTo(0.7, 1);
    expect(winProbabilityHome({ margin: 1, secondsRemaining: 0, prior: 0.5, over: true })).toBeGreaterThan(0.999);
  });
});

describe('plays, descriptions and scores', () => {
  const game = db.games.find((g) => g.status === 'final')!;
  const plays = db.plays[game.id]!;

  it('playsUpTo is inclusive within a period and hides the next period at a boundary', () => {
    const at900 = playsUpTo(plays, 900);
    expect(at900.every((p) => p.period === 1)).toBe(true);
    expect(at900.at(-1)!.type).toBe('period_end');
    expect(playsUpTo(plays, null)).toHaveLength(plays.length);
    const mid = playsUpTo(plays, 1000);
    expect(mid.every((p) => p.elapsedSeconds <= 1000)).toBe(true);
    expect(mid.length).toBeLessThan(plays.length);
  });

  it('scoreFromPlays sums goals into periods', () => {
    const s = scoreFromPlays(plays, game.home.teamId);
    expect(s.periodScores.home.reduce((a, b) => a + b, 0)).toBe(s.home);
    expect(plays.filter((p) => p.type === 'goal').length).toBe(s.home + s.away);
  });

  it('describes plays in the documented style', () => {
    const base: PlayRecord = { id: 'x', seq: 0, period: 1, clockSeconds: 10, elapsedSeconds: 890, type: 'goal', teamId: 'duke', playerId: null, assistPlayerId: null, goalieId: null, opponentPlayerId: null, details: {} };
    const duke = db.players.find((p) => p.teamId === 'duke')!;
    const dukeB = db.players.filter((p) => p.teamId === 'duke')[1]!;
    const nd = db.players.find((p) => p.teamId === 'notre-dame')!;
    const nm = shortName(duke);
    expect(describePlay({ ...base, playerId: duke.id, assistPlayerId: dukeB.id }, names)).toBe(`GOAL by ${nm} (DUKE). Assist: ${shortName(dukeB)}.`);
    expect(describePlay({ ...base, playerId: duke.id }, names)).toBe(`GOAL by ${nm} (DUKE). Unassisted.`);
    expect(describePlay({ ...base, type: 'shot', playerId: duke.id, goalieId: nd.id, details: { shotResult: 'saved' } }, names)).toBe(`Shot by ${nm} (DUKE) saved by ${shortName(nd)}.`);
    expect(describePlay({ ...base, type: 'timeout', playerId: null }, names)).toBe('Timeout DUKE.');
    expect(describePlay({ ...base, type: 'period_start', period: 5 }, names)).toBe('Start of overtime.');
    expect(shortName({ firstName: 'Brendan', lastName: 'Dowd' })).toBe('B. Dowd');
  });

  it('auto insights detect leads, runs, hat tricks, saves milestones and droughts from a synthetic log', () => {
    const mk = (seq: number, elapsed: number, type: PlayRecord['type'], teamId: string | null, playerId: string | null, extra: Partial<PlayRecord> = {}): PlayRecord => ({
      id: `s${seq}`, seq, period: elapsed <= 900 ? 1 : 2, clockSeconds: 0, elapsedSeconds: elapsed, type, teamId, playerId,
      assistPlayerId: null, goalieId: null, opponentPlayerId: null, details: {}, ...extra,
    });
    const D = db.players.filter((p) => p.teamId === 'duke');
    const N = db.players.filter((p) => p.teamId === 'notre-dame');
    const log: PlayRecord[] = [];
    let seq = 0;
    const goal = (t: number, team: 'duke' | 'notre-dame', who: string) => log.push(mk(seq++, t, 'goal', team, who));
    goal(100, 'notre-dame', N[0]!.id); // ND 1-0
    goal(200, 'duke', D[0]!.id); // 1-1
    goal(300, 'duke', D[0]!.id); // 2-1 Duke: lead change #1 (ND led first)
    goal(400, 'duke', D[0]!.id); // hat trick + 3-0 run
    goal(500, 'notre-dame', N[1]!.id); // 3-2
    goal(600, 'notre-dame', N[1]!.id); // 3-3
    goal(700, 'notre-dame', N[1]!.id); // 3-4: lead change #2
    for (let i = 0; i < 10; i++) log.push(mk(seq++, 710 + i, 'shot', 'duke', D[1]!.id, { goalieId: N[2]!.id, details: { shotResult: 'saved' } }));
    log.push(mk(seq++, 2000, 'goal', 'duke', D[2]!.id)); // Duke scoreless 700 -> 2000: drought
    const ins = autoInsights(log, { gameId: 'abcdef12-0000', homeId: 'duke', awayId: 'notre-dame', names }, null);
    const kinds = ins.map((i) => i.kind);
    expect(kinds).toContain('lead_change');
    expect(kinds).toContain('run');
    expect(ins.some((i) => i.title.startsWith('Hat trick'))).toBe(true);
    expect(ins.some((i) => i.title.includes('10 saves'))).toBe(true);
    expect(ins.some((i) => i.kind === 'drought' && i.teamId === 'duke')).toBe(true);
    expect(ins.filter((i) => i.kind === 'lead_change')).toHaveLength(2);
    expect(ins.every((i) => i.title && i.body.endsWith('.'))).toBe(true);
  });
});
