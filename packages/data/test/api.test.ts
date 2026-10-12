import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GameInsights, GamePlays, GamePreview, GameMedia, ScoreboardResponse, WinProbabilitySeries } from '../src/api';
import { buildApi, resolveApiPath, schemaForPath, validateApi } from '../src/build-api';
import { scoreFromPlays } from '../src/derive';
import { api, db, detailOf, finalGames, get, statsOf } from './helpers';

const live = db.games.filter((g) => g.status === 'live');
const scheduled = db.games.filter((g) => g.status === 'scheduled');
const sumPlayers = (id: string, teamId: string, pick: (p: ReturnType<typeof statsOf>['players'][number]) => number) =>
  statsOf(id).players.filter((p) => p.teamId === teamId).reduce((s, p) => s + pick(p), 0);

describe('buildApi', () => {
  it('produces the full path set and every value validates against its zod schema', () => {
    expect(api.size).toBe(1 + db.games.length * 7);
    expect(validateApi(api)).toEqual([]);
    for (const path of api.keys()) expect(schemaForPath(path)).toBeDefined();
  });

  it('stamps meta.serverTime with now (default: snapshot time)', () => {
    expect(get<ScoreboardResponse>('/scoreboard').meta.serverTime).toBe(db.meta.snapshotTime);
    const later = buildApi(db, { now: '2027-03-13T22:00:00Z' });
    for (const value of later.values()) expect((value as { meta: { serverTime: string } }).meta.serverTime).toBe('2027-03-13T22:00:00Z');
    expect(validateApi(later)).toEqual([]);
  });

  it('scoreboard is the current week, in start order, with live clocks', () => {
    const sb = get<ScoreboardResponse>('/scoreboard').data;
    expect(sb.week).toBe(db.meta.currentWeek);
    expect(sb.games).toHaveLength(8);
    expect(sb.games.map((g) => g.startTime)).toEqual([...sb.games.map((g) => g.startTime)].sort());
    expect(sb.games.map((g) => g.status).sort()).toEqual(['final', 'final', 'final', 'live', 'live', 'scheduled', 'scheduled', 'scheduled']);
    for (const g of sb.games) expect(g.clock !== null).toBe(g.status === 'live');
  });

  it('scheduled games reveal nothing but the pregame win probability', () => {
    for (const g of scheduled) {
      const d = detailOf(g.id);
      expect(d.home.score).toBeNull();
      expect(d.away.score).toBeNull();
      expect(d.home.periodScores).toEqual([]);
      expect(d.clock).toBeNull();
      expect(d.winProbabilityHome).toBe(g.pregameWinProbabilityHome);
      expect(d.lastPlayAt).toBeNull();
      expect(d.attendance).toBeNull();
      expect(get<GamePlays>(`/games/${g.id}/plays`).data.plays).toEqual([]);
      expect(get<GameInsights>(`/games/${g.id}/insights`).data.insights).toEqual([]);
      const stats = statsOf(g.id);
      expect(stats.players).toEqual([]);
      for (const t of stats.teams) expect(Object.values(t).filter((v) => typeof v === 'number').every((v) => v === 0)).toBe(true);
      const wp = get<WinProbabilitySeries>(`/games/${g.id}/win-probability`).data;
      expect(wp.points).toEqual([{ elapsedSeconds: 0, home: g.pregameWinProbabilityHome }]);
    }
  });

  it('box-score team totals equal the sum of player stats', () => {
    for (const g of db.games.filter((x) => x.status !== 'scheduled')) {
      const stats = statsOf(g.id);
      for (const t of stats.teams) {
        const sum = (pick: Parameters<typeof sumPlayers>[2]) => sumPlayers(g.id, t.teamId, pick);
        expect(t.goals).toBe(sum((p) => p.goals));
        expect(t.assists).toBe(sum((p) => p.assists));
        expect(t.shots).toBe(sum((p) => p.shots));
        expect(t.shotsOnGoal).toBe(sum((p) => p.shotsOnGoal));
        expect(t.groundBalls).toBe(sum((p) => p.groundBalls));
        expect(t.turnovers).toBe(sum((p) => p.turnovers));
        expect(t.causedTurnovers).toBe(sum((p) => p.causedTurnovers));
        expect(t.faceoffsWon).toBe(sum((p) => p.faceoffsWon));
        expect(t.faceoffsTaken).toBe(sum((p) => p.faceoffsTaken));
        expect(t.saves).toBe(sum((p) => p.saves));
        expect(t.goalsAgainst).toBe(sum((p) => p.goalsAgainst));
        expect(t.penalties).toBe(sum((p) => p.penalties));
        expect(t.penaltySeconds).toBe(sum((p) => p.penaltySeconds));
      }
      for (const p of stats.players) expect(p.points).toBe(p.goals + p.assists);
      expect(stats.players.every((p) => stats.playerRefs.some((r) => r.id === p.playerId))).toBe(true);
    }
  });

  it('team goals equal the final score and period scores sum to it', () => {
    for (const g of finalGames) {
      const d = detailOf(g.id);
      const stats = statsOf(g.id);
      expect(stats.teams[0]!.goals).toBe(d.home.score);
      expect(stats.teams[1]!.goals).toBe(d.away.score);
      expect(d.home.periodScores.reduce((a, b) => a + b, 0)).toBe(d.home.score);
      expect(d.away.periodScores.reduce((a, b) => a + b, 0)).toBe(d.away.score);
      expect(d.home.periodScores.length).toBe(d.away.periodScores.length);
      expect(d.home.score).not.toBe(d.away.score);
    }
  });

  it('final games add the result to the record and expose rank/RPI movement', () => {
    for (const g of finalGames) {
      const d = detailOf(g.id);
      const homeWon = d.home.score! > d.away.score!;
      expect(d.home.record.wins).toBe(g.home.recordBefore.wins + (homeWon ? 1 : 0));
      expect(d.away.record.losses).toBe(g.away.recordBefore.losses + (homeWon ? 1 : 0));
      expect(d.home.rank).toBe(g.home.rankBefore);
      const expected = g.home.rankBefore !== null && g.home.rankAfter !== null ? g.home.rankBefore - g.home.rankAfter : null;
      expect(d.home.rankChange).toBe(expected);
      expect(d.home.rpiChange).toBe(g.home.rpiBefore! - g.home.rpiAfter!);
    }
    expect(finalGames.some((g) => detailOf(g.id).home.rpiChange !== 0)).toBe(true);
    for (const g of [...live, ...scheduled]) expect(detailOf(g.id).home.rankChange).toBeNull();
  });

  it('win probability: strictly inside (0,1), starts near the prior, ends at ~1 for the winner on finals', () => {
    for (const g of db.games.filter((x) => x.status !== 'scheduled')) {
      const wp = get<WinProbabilitySeries>(`/games/${g.id}/win-probability`).data;
      expect(wp.regulationSeconds).toBe(3600);
      for (const p of wp.points) {
        expect(p.home).toBeGreaterThan(0);
        expect(p.home).toBeLessThan(1);
      }
      expect(Math.abs(wp.points[0]!.home - g.pregameWinProbabilityHome!)).toBeLessThan(0.05);
      const times = wp.points.map((p) => p.elapsedSeconds);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(new Set(times).size).toBe(times.length);
      const plays = get<GamePlays>(`/games/${g.id}/plays`).data.plays;
      for (const p of plays) {
        expect(p.winProbabilityHome).toBeGreaterThan(0);
        expect(p.winProbabilityHome).toBeLessThan(1);
      }
      if (g.status === 'final') {
        const d = detailOf(g.id);
        const last = wp.points.at(-1)!.home;
        if (d.home.score! > d.away.score!) expect(last).toBeGreaterThan(0.99);
        else expect(last).toBeLessThan(0.01);
        expect(d.winProbabilityHome).toBe(plays.at(-1)!.winProbabilityHome);
      }
    }
  });

  it('plays carry running scores, server-rendered descriptions and consistent player refs', () => {
    const g = finalGames[0]!;
    const { plays, playerRefs } = get<GamePlays>(`/games/${g.id}/plays`).data;
    expect(plays.map((p) => p.seq)).toEqual(plays.map((_, i) => i));
    expect(plays.at(-1)!.homeScore).toBe(detailOf(g.id).home.score);
    expect(plays.every((p) => p.description.length > 3)).toBe(true);
    const goal = plays.find((p) => p.type === 'goal')!;
    expect(goal.description).toMatch(/^GOAL by [A-Z]\. \S+ \([A-Z]+\)(, extra-man)?\. (Assist: [A-Z]\. \S+\.|Unassisted\.)$/);
    expect(plays.find((p) => p.type === 'shot' && p.details.shotResult === 'saved')!.description).toMatch(/^Shot by .+ saved by .+\.$/);
    const refIds = new Set(playerRefs.map((r) => r.id));
    for (const p of plays) for (const id of [p.playerId, p.assistPlayerId, p.goalieId, p.opponentPlayerId]) if (id) expect(refIds.has(id)).toBe(true);
  });

  it('insights include lead changes, runs, milestones, droughts and editorial notes', () => {
    const kinds = new Set<string>();
    for (const g of db.games.filter((x) => x.status !== 'scheduled')) {
      for (const i of get<GameInsights>(`/games/${g.id}/insights`).data.insights) {
        kinds.add(i.kind);
        expect(i.title.length).toBeGreaterThan(3);
        expect(i.body).toMatch(/\.$/);
        expect(i.body).not.toMatch(/[a-z0-9]{2}[.!?]\s+[A-Z]/); // one sentence (initials like "B. Dowd" are fine)
      }
    }
    for (const k of ['lead_change', 'run', 'milestone', 'drought']) expect(kinds.has(k)).toBe(true);
    const editorial = db.insights[0]!;
    const g = db.games.find((x) => x.id === editorial.gameId)!;
    if (g.status === 'final') expect(get<GameInsights>(`/games/${g.id}/insights`).data.insights.some((i) => i.id === editorial.id)).toBe(true);
  });

  it('insights carry playerRefs for exactly the players their insights reference', () => {
    let withPlayer = 0;
    for (const g of db.games) {
      const { insights, playerRefs } = get<GameInsights>(`/games/${g.id}/insights`).data;
      const wanted = new Set(insights.flatMap((i) => (i.playerId ? [i.playerId] : [])));
      withPlayer += wanted.size;
      expect(new Set(playerRefs.map((r) => r.id))).toEqual(wanted);
      expect(playerRefs).toHaveLength(wanted.size); // no duplicates
    }
    expect(withPlayer).toBeGreaterThan(0);
    for (const g of scheduled) expect(get<GameInsights>(`/games/${g.id}/insights`).data.playerRefs).toEqual([]);
  });

  it('preview and media modules are populated', () => {
    const g = scheduled[0]!;
    const preview = get<GamePreview>(`/games/${g.id}/preview`).data;
    expect(preview.rosters.home.length).toBeGreaterThanOrEqual(30);
    expect(preview.seasonAverages.home.gamesPlayed).toBeGreaterThan(0);
    expect(preview.previousResults.home.length).toBeGreaterThan(0);
    expect(preview.previousResults.home.length).toBeLessThanOrEqual(3);
    const dates = preview.previousResults.home.map((r) => r.startTime);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(preview.standings.length).toBe(detailOf(g.id).isConferenceGame ? 1 : 2);
    const media = get<GameMedia>(`/games/${g.id}/media`).data;
    expect(media.articles.some((a) => a.kind === 'preview')).toBe(true);
    expect(media.articles.every((a) => a.kind !== 'recap')).toBe(true);
    expect(media.videos.every((v) => v.kind === 'preview' || v.kind === 'other')).toBe(true);
    const finalMedia = get<GameMedia>(`/games/${finalGames[0]!.id}/media`).data;
    expect(finalMedia.articles.some((a) => a.kind === 'recap')).toBe(true);
  });
});

describe('overrides', () => {
  const target = finalGames.find((g) => db.plays[g.id]!.some((p) => p.period > 4)) ?? finalGames[0]!;
  const finalScore = detailOf(target.id);

  it('elapsedOverrides truncate a game: score at mid-game <= final, and it goes live', () => {
    let previous = { home: 0, away: 0, plays: 0 };
    for (const elapsed of [0, 300, 900, 1500, 1800, 2400, 3000, 3500, 3599]) {
      const result = buildApi(db, { elapsedOverrides: { [target.id]: elapsed } });
      expect(validateApi(result)).toEqual([]);
      const d = (result.get(`/games/${target.id}`) as { data: typeof finalScore }).data;
      const plays = (result.get(`/games/${target.id}/plays`) as { data: { plays: unknown[] } }).data.plays;
      expect(d.status).toBe('live');
      expect(d.clock).not.toBeNull();
      expect(d.home.score!).toBeLessThanOrEqual(finalScore.home.score!);
      expect(d.away.score!).toBeLessThanOrEqual(finalScore.away.score!);
      expect(d.home.score!).toBeGreaterThanOrEqual(previous.home);
      expect(d.away.score!).toBeGreaterThanOrEqual(previous.away);
      expect(plays.length).toBeGreaterThanOrEqual(previous.plays);
      expect(plays.length).toBeLessThan(db.plays[target.id]!.length);
      expect(d.home.rankChange).toBeNull();
      expect(d.home.record).toEqual(target.home.recordBefore);
      previous = { home: d.home.score!, away: d.away.score!, plays: plays.length };
    }
  });

  it('period boundaries: halftime hides the third quarter', () => {
    const d = (resolveApiPath(db, { elapsedOverrides: { [target.id]: 1800 } }, `/games/${target.id}`) as { data: typeof finalScore }).data;
    expect(d.clock).toEqual({ period: 2, clockSeconds: 0, phase: 'halftime' });
    expect(d.home.periodScores).toHaveLength(2);
    const plays = (resolveApiPath(db, { elapsedOverrides: { [target.id]: 1800 } }, `/games/${target.id}/plays`) as { data: { plays: Array<{ period: number }> } }).data.plays;
    expect(Math.max(...plays.map((p) => p.period))).toBe(2);
    const mid = (resolveApiPath(db, { elapsedOverrides: { [target.id]: 1000 } }, `/games/${target.id}`) as { data: typeof finalScore }).data;
    expect(mid.clock).toEqual({ period: 2, clockSeconds: 800, phase: 'in_progress' });
    expect(mid.home.periodScores).toHaveLength(2);
  });

  it('an elapsed at or past the end of the log means final; null falls back to the DB', () => {
    const past = resolveApiPath(db, { elapsedOverrides: { [target.id]: 99999 } }, `/games/${target.id}`) as { data: typeof finalScore };
    expect(past.data.status).toBe('final');
    expect(past.data.home.score).toBe(finalScore.home.score);
    const same = resolveApiPath(db, { elapsedOverrides: { [target.id]: null } }, `/games/${target.id}`);
    expect(same).toEqual(api.get(`/games/${target.id}`));
  });

  it('moves the live games: a different snapshotElapsed changes the live state, and the Q4 game can finish', () => {
    const q4 = live.find((g) => g.snapshotElapsedSeconds! > 3000)!;
    const earlier = resolveApiPath(db, { elapsedOverrides: { [q4.id]: 1200 } }, `/games/${q4.id}`) as { data: typeof finalScore };
    const base = detailOf(q4.id);
    expect(earlier.data.home.score! + earlier.data.away.score!).toBeLessThan(base.home.score! + base.away.score!);
    const ended = resolveApiPath(db, { statusOverrides: { [q4.id]: 'final' } }, `/games/${q4.id}`) as { data: typeof finalScore };
    expect(ended.data.status).toBe('final');
    const full = scoreFromPlays(db.plays[q4.id]!, q4.home.teamId);
    expect(ended.data.home.score).toBe(full.home);
    expect(ended.data.clock).toBeNull();
  });

  it('statusOverrides can hide a final game or reveal a scheduled one', () => {
    const hidden = resolveApiPath(db, { statusOverrides: { [target.id]: 'scheduled' } }, `/games/${target.id}`) as { data: typeof finalScore };
    expect(hidden.data.status).toBe('scheduled');
    expect(hidden.data.home.score).toBeNull();
    const sched = scheduled[0]!;
    const shown = buildApi(db, { statusOverrides: { [sched.id]: 'final' } });
    expect(validateApi(shown)).toEqual([]);
    expect((shown.get(`/games/${sched.id}`) as { data: typeof finalScore }).data.home.score).not.toBeNull();
    const asLive = buildApi(db, { statusOverrides: { [sched.id]: 'live' }, elapsedOverrides: { [sched.id]: 2000 } });
    expect(validateApi(asLive)).toEqual([]);
    expect((asLive.get(`/games/${sched.id}`) as { data: typeof finalScore }).data.status).toBe('live');
    // Standings update when a game is finalized.
    const preview = (shown.get(`/games/${sched.id}/preview`) as { data: GamePreview['data'] }).data;
    const total = preview.standings.flatMap((s) => s.rows).reduce((n, r) => n + r.record.wins + r.record.losses, 0);
    const baseTotal = get<GamePreview>(`/games/${sched.id}/preview`).data.standings.flatMap((s) => s.rows).reduce((n, r) => n + r.record.wins + r.record.losses, 0);
    expect(total).toBe(baseTotal + 2);
  });
});

describe('resolveApiPath', () => {
  it('matches buildApi for every path and tolerates the static file form', () => {
    for (const [path, value] of api) expect(resolveApiPath(db, {}, path)).toEqual(value);
    const id = db.games[0]!.id;
    expect(resolveApiPath(db, {}, `/api/v1/games/${id}/stats.json`)).toEqual(api.get(`/games/${id}/stats`));
    expect(resolveApiPath(db, {}, '/scoreboard/')).toEqual(api.get('/scoreboard'));
  });

  it('returns undefined for unknown paths', () => {
    expect(resolveApiPath(db, {}, '/games/nope')).toBeUndefined();
    expect(resolveApiPath(db, {}, `/games/${db.games[0]!.id}/bogus`)).toBeUndefined();
    expect(resolveApiPath(db, {}, '/teams')).toBeUndefined();
  });
});

describe('browser safety', () => {
  it('src/ has no node: or fs imports', () => {
    const dir = join(import.meta.dirname, '..', 'src');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const text = readFileSync(join(dir, file), 'utf8');
      expect(text, file).not.toMatch(/from ['"](node:|fs|path|os|url)/);
      expect(text, file).not.toMatch(/\bprocess\.|require\(/);
    }
  });
});
