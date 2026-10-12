import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DB_DIR } from '../scripts/load-db';
import { checkDbIntegrity, validateDb } from '../src/db';
import { scoreFromPlays } from '../src/derive';
import { computeBoxScore } from '../src/stats';
import { db, finalGames } from './helpers';

const team = (id: string) => db.teams.find((t) => t.id === id)!;

describe('database', () => {
  it('validates against the zod schemas and has no dangling references', () => {
    expect(() => validateDb(db)).not.toThrow();
    expect(checkDbIntegrity(db)).toEqual([]);
  });

  it('contains the 16 real programs with ESPN logos and four conferences', () => {
    expect(db.teams).toHaveLength(16);
    expect(db.conferences.map((c) => c.shortName).sort()).toEqual(['ACC', 'Big East', 'Big Ten', 'Ivy']);
    for (const t of db.teams) expect(t.logoUrl).toMatch(/^https:\/\/a\.espncdn\.com\/i\/teamlogos\/ncaa\/500-dark\/\d+\.png$/);
    expect(db.teams.filter((t) => t.nationalRank === null).length).toBeGreaterThanOrEqual(2);
  });

  it('has realistic rosters with unique jersey numbers', () => {
    for (const t of db.teams) {
      const roster = db.players.filter((p) => p.teamId === t.id);
      expect(roster.length).toBeGreaterThanOrEqual(30);
      const count = (pos: string) => roster.filter((p) => p.position === pos).length;
      expect([count('FO'), count('G'), count('A'), count('M'), count('LSM'), count('SSDM'), count('D')]).toEqual([2, 3, 7, 10, 3, 2, 6]);
      expect(new Set(roster.map((p) => p.jerseyNumber)).size).toBe(roster.length);
      expect(new Set(roster.map((p) => p.classYear)).size).toBeGreaterThanOrEqual(4);
    }
    expect(db.players.every((p) => p.photoUrl === null && p.hometown)).toBe(true);
  });

  it('has the snapshot Saturday slate in mixed states', () => {
    expect(db.meta.snapshotTime).toBe('2027-03-13T20:30:00Z');
    expect(db.meta.season).toBe(2027);
    const week = db.games.filter((g) => g.week === db.meta.currentWeek);
    expect(week).toHaveLength(8);
    expect(week.filter((g) => g.status === 'final')).toHaveLength(3);
    expect(week.filter((g) => g.status === 'live')).toHaveLength(2);
    expect(week.filter((g) => g.status === 'scheduled')).toHaveLength(3);
    // Previous weeks are all final.
    expect(db.games.filter((g) => g.week < db.meta.currentWeek).every((g) => g.status === 'final')).toBe(true);

    const live = week.filter((g) => g.status === 'live').sort((a, b) => a.snapshotElapsedSeconds! - b.snapshotElapsedSeconds!);
    const [midQ2, lateQ4] = live as [typeof live[number], typeof live[number]];
    expect(midQ2.snapshotElapsedSeconds!).toBeGreaterThan(900);
    expect(midQ2.snapshotElapsedSeconds!).toBeLessThan(1800);
    expect(lateQ4.snapshotElapsedSeconds!).toBeGreaterThan(3600 - 300);
    expect(lateQ4.snapshotElapsedSeconds!).toBeLessThan(3600);
    const atCutoff = scoreFromPlays(db.plays[lateQ4.id]!.filter((p) => p.elapsedSeconds <= lateQ4.snapshotElapsedSeconds!), lateQ4.home.teamId);
    expect(Math.abs(atCutoff.home - atCutoff.away)).toBeLessThanOrEqual(1);
  });

  it('covers ranked-vs-ranked, cross-conference, same-conference and the NCAA quarterfinal', () => {
    const week = db.games.filter((g) => g.week === db.meta.currentWeek);
    const conf = (id: string) => team(id).conferenceId;
    expect(week.some((g) => g.home.rankBefore && g.away.rankBefore)).toBe(true);
    expect(week.some((g) => conf(g.home.teamId) !== conf(g.away.teamId))).toBe(true);
    expect(week.some((g) => conf(g.home.teamId) === conf(g.away.teamId) && g.isConferenceGame)).toBe(true);

    const ncaa = db.games.filter((g) => g.gameType === 'ncaa_tournament');
    expect(ncaa).toHaveLength(1);
    const q = ncaa[0]!;
    expect(q.label).toBe('NCAA Quarterfinal');
    expect(q.neutralSite).toBe(true);
    expect(q.home.seed).not.toBeNull();
    expect(q.away.seed).not.toBeNull();
    expect(q.startTime.slice(5, 7)).toBe('05');
    expect(q.status).toBe('scheduled');
  });

  it('has a complete simulated log for every game, including scheduled ones', () => {
    for (const g of db.games) {
      const plays = db.plays[g.id]!;
      expect(plays.length).toBeGreaterThan(150);
      expect(plays[0]!.type).toBe('period_start');
      expect(plays.at(-1)!.type).toBe('period_end');
      expect(plays.filter((p) => p.type === 'period_start').length).toBeGreaterThanOrEqual(4);
    }
  });

  it('simulates realistic lacrosse', () => {
    for (const g of db.games) {
      const box = computeBoxScore(db.plays[g.id]!, g.home.teamId, g.away.teamId);
      for (const t of box.teams) {
        expect(t.goals).toBeGreaterThanOrEqual(8);
        expect(t.goals).toBeLessThanOrEqual(18);
        expect(t.shots).toBeGreaterThanOrEqual(28);
        expect(t.shots).toBeLessThanOrEqual(46);
        expect(t.extraManGoals).toBeLessThanOrEqual(t.extraManOpportunities);
      }
      expect(box.teams[0].saves).toBe(box.teams[1].shotsOnGoal - box.teams[1].goals);
      expect(box.teams[0].faceoffsTaken).toBe(box.teams[1].faceoffsTaken);
    }
    const plays = Object.values(db.plays).flat();
    const goals = plays.filter((p) => p.type === 'goal');
    const assisted = goals.filter((p) => p.assistPlayerId).length / goals.length;
    expect(assisted).toBeGreaterThan(0.45);
    expect(assisted).toBeLessThan(0.65);
    const kinds = new Set(plays.map((p) => p.type));
    for (const k of ['faceoff', 'goal', 'shot', 'ground_ball', 'turnover', 'clear', 'penalty', 'timeout', 'period_start', 'period_end']) {
      expect(kinds.has(k as never)).toBe(true);
    }
    expect(plays.some((p) => p.type === 'turnover' && p.opponentPlayerId)).toBe(true);
  });

  it('includes an overtime game and a comeback win from 4+ down', () => {
    const finals = finalGames.map((g) => ({ g, plays: db.plays[g.id]! }));
    expect(finals.some(({ plays }) => plays.some((p) => p.period > 4))).toBe(true);
    const comeback = finals.some(({ g, plays }) => {
      const final = scoreFromPlays(plays, g.home.teamId);
      let margin = 0; // home - away
      let minMargin = 0;
      let maxMargin = 0;
      for (const p of plays) {
        if (p.type !== 'goal') continue;
        margin += p.teamId === g.home.teamId ? 1 : -1;
        minMargin = Math.min(minMargin, margin);
        maxMargin = Math.max(maxMargin, margin);
      }
      return final.home > final.away ? minMargin <= -4 : maxMargin >= 4;
    });
    expect(comeback).toBe(true);
  });

  it('keeps records, ranks and season totals consistent with the final games', () => {
    const wins = new Map<string, number>();
    const losses = new Map<string, number>();
    const confWins = new Map<string, number>();
    const confLosses = new Map<string, number>();
    const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    const playerTotals = new Map<string, { gp: number; goals: number; assists: number; shots: number; saves: number; gb: number; fo: number }>();

    for (const g of finalGames) {
      const s = scoreFromPlays(db.plays[g.id]!, g.home.teamId);
      const [w, l] = s.home > s.away ? [g.home.teamId, g.away.teamId] : [g.away.teamId, g.home.teamId];
      inc(wins, w);
      inc(losses, l);
      if (g.isConferenceGame) {
        inc(confWins, w);
        inc(confLosses, l);
      }
      for (const p of computeBoxScore(db.plays[g.id]!, g.home.teamId, g.away.teamId).players) {
        const t = playerTotals.get(p.playerId) ?? { gp: 0, goals: 0, assists: 0, shots: 0, saves: 0, gb: 0, fo: 0 };
        t.gp += 1;
        t.goals += p.goals;
        t.assists += p.assists;
        t.shots += p.shots;
        t.saves += p.saves;
        t.gb += p.groundBalls;
        t.fo += p.faceoffsWon;
        playerTotals.set(p.playerId, t);
      }
    }
    for (const t of db.teams) {
      expect(t.record).toEqual({ wins: wins.get(t.id) ?? 0, losses: losses.get(t.id) ?? 0 });
      expect(t.conferenceRecord).toEqual({ wins: confWins.get(t.id) ?? 0, losses: confLosses.get(t.id) ?? 0 });
    }
    for (const p of db.players) {
      const t = playerTotals.get(p.id);
      expect(p.season.gamesPlayed).toBe(t?.gp ?? 0);
      expect(p.season.goals).toBe(t?.goals ?? 0);
      expect(p.season.assists).toBe(t?.assists ?? 0);
      expect(p.season.shots).toBe(t?.shots ?? 0);
      expect(p.season.saves).toBe(t?.saves ?? 0);
      expect(p.season.groundBalls).toBe(t?.gb ?? 0);
      expect(p.season.faceoffsWon).toBe(t?.fo ?? 0);
    }
    // Game-level record chain: recordBefore of each team's next game = previous recordBefore + result.
    for (const t of db.teams) {
      const mine = finalGames.filter((g) => g.home.teamId === t.id || g.away.teamId === t.id);
      mine.forEach((g, i) => {
        const side = g.home.teamId === t.id ? g.home : g.away;
        const prior = mine.slice(0, i);
        const w = prior.filter((x) => {
          const s = scoreFromPlays(db.plays[x.id]!, x.home.teamId);
          return (x.home.teamId === t.id) === s.home > s.away;
        }).length;
        expect(side.recordBefore).toEqual({ wins: w, losses: prior.length - w });
      });
    }
  });

  it('keeps injured out/doubtful players out of later games and weather null for domes', () => {
    for (const g of db.games.filter((x) => x.venue.name === 'JMA Wireless Dome')) expect(g.weather).toBeNull();
    expect(db.games.some((g) => g.venue.name === 'Arlotta Stadium' && g.weather)).toBe(true);
    expect(db.injuries.length).toBeGreaterThanOrEqual(4);
    for (const i of db.injuries.filter((x) => x.status === 'out' || x.status === 'doubtful')) {
      for (const g of db.games.filter((x) => x.startTime > i.updatedAt)) {
        const used = db.plays[g.id]!.some((p) => [p.playerId, p.assistPlayerId, p.goalieId, p.opponentPlayerId].includes(i.playerId));
        expect(used).toBe(false);
      }
    }
  });

  it('has editorial content for the games', () => {
    expect(db.staff).toHaveLength(4);
    for (const g of db.games) {
      expect(g.stakes && g.stakes.split('. ').length).toBeGreaterThanOrEqual(2);
      expect(g.previewArticleId).not.toBeNull();
      expect(g.recapArticleId !== null).toBe(g.status === 'final');
    }
    const picked = new Set(db.staffPicks.map((p) => p.gameId));
    expect(picked.size / db.games.length).toBeGreaterThan(0.4);
    expect(picked.size / db.games.length).toBeLessThan(0.8);
    expect(db.insights.length).toBeGreaterThan(5);
    expect(db.videos.every((v) => v.thumbnailUrl === '/media/placeholder-thumb.svg')).toBe(true);
    expect(db.articles.every((a) => a.publishedAt <= db.meta.snapshotTime || db.games.find((g) => g.id === a.gameId)!.status === 'scheduled')).toBe(true);
  });

  it('stays small', () => {
    const dir = DEFAULT_DB_DIR;
    const size = (path: string): number =>
      statSync(path).isDirectory() ? readdirSync(path).reduce((sum, name) => sum + size(join(path, name)), 0) : statSync(path).size;
    expect(size(dir)).toBeLessThan(5 * 1024 * 1024);
  });

  it('stores one JSON file per collection plus plays/{gameId}.json', () => {
    const files = readdirSync(DEFAULT_DB_DIR).sort();
    expect(files).toEqual(
      ['articles.json', 'conferences.json', 'games.json', 'injuries.json', 'insights.json', 'meta.json', 'players.json', 'plays', 'staff-picks.json', 'staff.json', 'teams.json', 'videos.json'].sort(),
    );
    expect(readdirSync(join(DEFAULT_DB_DIR, 'plays'))).toHaveLength(db.games.length);
    expect(JSON.parse(readFileSync(join(DEFAULT_DB_DIR, 'meta.json'), 'utf8'))).toMatchObject({ season: 2027, currentWeek: 6 });
  });
});
