import { describe, expect, it } from 'vitest';
import { buildApi, createApi, schemaForPath, validateApi } from '@pll/data/build-api';
import type { GamePlays, GamePreview, GameStats } from '@pll/data/api';
import { applyPreset, createDefaultState, resolveScenario, logEnd } from '../src';
import { NOW, db, gameBy, run } from './helpers';

const liveGame = gameBy((g) => g.status === 'live' && g.snapshotElapsedSeconds === 3457);
const finalGame = gameBy((g) => g.id === '531c71d4-db8a-4f11-9d1b-db4eea1dea85');
const scheduledGame = gameBy((g) => g.id === '5a80179e-949b-4eea-a9f9-300233d1a3cb');
const ids = db.games.map((g) => g.id);

describe('resolveScenario: default', () => {
  it('reproduces the shipped API when nothing is overridden', () => {
    const r = resolveScenario(db, createDefaultState(liveGame.id), NOW);
    expect(r.db).toBe(db);
    expect(r.opts.now).toBeUndefined();
    expect(r.info.timeTravel).toBe(false);
    expect([...buildApi(r.db, r.opts)]).toEqual([...buildApi(db)]);
  });

  it('never mutates the input db', () => {
    const before = JSON.stringify(db);
    const states = [
      applyPreset(db, scheduledGame.id, 'missing-data'),
      applyPreset(db, scheduledGame.id, 'start-of-season'),
      applyPreset(db, liveGame.id, 'live-q4'),
      { ...applyPreset(db, liveGame.id, 'default'), dataFlags: { hideWeather: true, hideRanks: true, hidePhotos: true, noPlays: true, noMedia: true, longNames: true } },
    ];
    for (const s of states) {
      const r = resolveScenario(db, s, NOW);
      expect(r.db).not.toBe(db);
      buildApi(r.db, r.opts);
    }
    expect(JSON.stringify(db)).toBe(before);
  });
});

describe('time travel', () => {
  it('derives the DB slate from the wall clock at the snapshot moment', () => {
    const state = { ...createDefaultState(liveGame.id), nowOverride: db.meta.snapshotTime };
    const r = run(state);
    for (const g of db.games.filter((x) => x.week === 6)) {
      const d = r.detail(g.id);
      expect(d.data.status, g.id).toBe(g.status);
    }
    // Records recomputed from the finals equal the stored recordBefore for every game.
    for (const g of r.db.games) {
      const stored = db.games.find((x) => x.id === g.id)!;
      expect(g.home.recordBefore, g.id).toEqual(stored.home.recordBefore);
      expect(g.away.recordBefore, g.id).toEqual(stored.away.recordBefore);
    }
  });

  it('start of season: everything scheduled, every record 0-0, standings empty', () => {
    const state = applyPreset(db, scheduledGame.id, 'start-of-season');
    const r = run(state);
    expect(Date.parse(r.info.nowIso)).toBeLessThan(Math.min(...db.games.map((g) => Date.parse(g.startTime))));
    const board = r.scoreboard();
    expect(board.data.week).toBe(scheduledGame.week);
    expect(board.data.games.length).toBeGreaterThan(0);
    for (const g of db.games) {
      const d = r.detail(g.id).data;
      expect(d.status).toBe('scheduled');
      expect(d.home.score).toBeNull();
      expect(d.home.record).toEqual({ wins: 0, losses: 0 });
      expect(d.away.record).toEqual({ wins: 0, losses: 0 });
    }
    const preview = r.get<GamePreview>(`/games/${scheduledGame.id}/preview`).data;
    expect(preview.previousResults.home).toEqual([]);
    expect(preview.seasonAverages.home.gamesPlayed).toBe(0);
    for (const s of preview.standings) for (const row of s.rows) expect(row.record).toEqual({ wins: 0, losses: 0 });
    expect(validateApi(new Map([...createApi(r.db, r.opts).paths()].map((p) => [p, r.get(p)])))).toEqual([]);
  });

  it('pregame: two hours before the start', () => {
    const r = run(applyPreset(db, scheduledGame.id, 'pregame'));
    expect(Date.parse(scheduledGame.startTime) - Date.parse(r.info.nowIso)).toBe(2 * 3_600_000);
    const d = r.detail(scheduledGame.id).data;
    expect(d.status).toBe('scheduled');
    expect(d.clock).toBeNull();
    expect(r.get<GamePlays>(`/games/${scheduledGame.id}/plays`).data.plays).toEqual([]);
    // The rest of the slate follows the same moment: a 19:40 start is live at 19:00+ ... a 22:00 start is not yet.
    expect(r.detail('5490a6eb-2cf6-4841-94ff-f7d2384c0d7e').data.status).toBe('scheduled');
    expect(r.detail('e7f7c7dd-6164-48fe-af7e-75b543926859').data.status).toBe('live'); // 17:00 start: two hours in
  });
});

describe('live clock', () => {
  const t0 = NOW;
  const live = (speed = 1) => {
    let s = applyPreset(db, finalGame.id, 'live-q1'); // 300 s
    s = { ...s, clock: { playing: true, speed, anchorRealMs: t0, anchorElapsed: 300 } };
    return s;
  };

  it('advances elapsed with real time x speed', () => {
    const at = (realMs: number) => run(live(10), realMs);
    expect(at(t0).info.focus.elapsed).toBe(300);
    expect(at(t0 + 30_000).info.focus.elapsed).toBe(600);
    const a = at(t0 + 30_000);
    expect(a.detail(finalGame.id).data.status).toBe('live');
    // serverTime follows the game second, so it advances while the clock plays
    expect(Date.parse(at(t0 + 60_000).info.nowIso)).toBeGreaterThan(Date.parse(a.info.nowIso));
  });

  it('does not run while paused', () => {
    const s = { ...live(), clock: { ...live().clock, playing: false } };
    expect(run(s, t0 + 999_999).info.focus.elapsed).toBe(300);
  });

  it('clamps to the end of the log, which becomes final', () => {
    const end = logEnd(db, finalGame.id);
    const r = run(live(60), t0 + 3_600_000);
    expect(r.info.focus).toMatchObject({ status: 'final', elapsed: end });
    const d = r.detail(finalGame.id).data;
    expect(d.status).toBe('final');
    expect(d.clock).toBeNull();
    expect(Date.parse(r.info.nowIso)).toBeGreaterThan(Date.parse(finalGame.startTime));
  });

  it('with nowOverride, serverTime advances by the same real delta x speed', () => {
    const s = { ...applyPreset(db, scheduledGame.id, 'pregame') };
    const anchor = s.nowOverride!;
    const playing = { ...s, clock: { playing: true, speed: 60, anchorRealMs: t0, anchorElapsed: 0 } };
    const r = run(playing, t0 + 10_000);
    expect(Date.parse(r.info.nowIso) - Date.parse(anchor)).toBe(600_000);
  });

  it('time-driven play: the game kicks off by itself', () => {
    const s = applyPreset(db, scheduledGame.id, 'pregame');
    const playing = { ...s, clock: { playing: true, speed: 60, anchorRealMs: t0, anchorElapsed: 0 } };
    expect(run(playing, t0 + 100_000).detail(scheduledGame.id).data.status).toBe('scheduled'); // 100 min after -2h
    expect(run(playing, t0 + 140_000).detail(scheduledGame.id).data.status).toBe('live'); // 140 min
  });
});

describe('presets', () => {
  it('Live: Q4 close finish lands on a margin of at most 1 where the game has one', () => {
    let found = 0;
    for (const g of db.games.filter((x) => (db.plays[x.id]?.length ?? 0) > 0)) {
      const r = run(applyPreset(db, g.id, 'live-q4'));
      const d = r.detail(g.id).data;
      const margin = Math.abs((d.home.score ?? 0) - (d.away.score ?? 0));
      expect(d.clock?.period).toBe(4);
      if (margin <= 1) found += 1;
    }
    expect(found).toBeGreaterThan(5);
  });

  it('Overtime is only enabled for games with period >= 5', () => {
    const pre = (await_(db)).find((p) => p.id === 'overtime')!;
    const ot = db.games.filter((g) => (db.plays[g.id] ?? []).some((p) => p.period >= 5));
    const regulation = db.games.filter((g) => (db.plays[g.id] ?? []).length > 0 && !ot.includes(g));
    for (const g of regulation) expect(pre.availability!(db, g.id).enabled).toBe(false);
    for (const g of ot) {
      expect(pre.availability!(db, g.id).enabled).toBe(true);
      expect(run(applyPreset(db, g.id, 'overtime')).detail(g.id).data.clock?.period).toBeGreaterThanOrEqual(5);
    }
  });

  it('Final reveals the whole log, even for a game that is scheduled at the snapshot', () => {
    const r = run(applyPreset(db, scheduledGame.id, 'final'));
    const d = r.detail(scheduledGame.id).data;
    expect(d.status).toBe('final');
    expect(d.home.score).not.toBeNull();
    expect(Date.parse(d.lastPlayAt!)).toBeLessThan(Date.parse(r.info.nowIso));
  });

  it('Live: Halftime shows the halftime phase', () => {
    const d = run(applyPreset(db, scheduledGame.id, 'live-halftime')).detail(scheduledGame.id).data;
    expect(d.status).toBe('live');
    expect(d.clock).toEqual({ period: 2, clockSeconds: 0, phase: 'halftime' });
  });

  it('every preset yields valid API responses for the focus game', () => {
    const focus = ids.find((id) => (db.plays[id] ?? []).some((p) => p.period >= 5)) ?? liveGame.id;
    for (const id of [liveGame.id, scheduledGame.id, focus]) {
      for (const p of ['default', 'start-of-season', 'pregame', 'live-q1', 'live-halftime', 'live-q4', 'final', 'missing-data']) {
        const r = run(applyPreset(db, id, p));
        for (const path of ['/scoreboard', `/games/${id}`, `/games/${id}/stats`, `/games/${id}/plays`, `/games/${id}/insights`, `/games/${id}/media`, `/games/${id}/preview`, `/games/${id}/win-probability`]) {
          const parsed = schemaForPath(path)!.safeParse(r.get(path));
          expect(parsed.success, `${p} ${path} ${parsed.success ? '' : parsed.error.message.slice(0, 300)}`).toBe(true);
        }
      }
    }
  });

  it('network presets carry no data changes', () => {
    expect(applyPreset(db, liveGame.id, 'offline').network).toBe('offline');
    expect(applyPreset(db, liveGame.id, 'slow')).toMatchObject({ network: 'slow', latencyMs: 2500 });
    expect(applyPreset(db, liveGame.id, 'errors').network).toBe('server_error');
  });
});

import { presets } from '../src';
function await_(_d: unknown) {
  return presets;
}

describe('data flags', () => {
  const flags = (patch: Partial<ReturnType<typeof createDefaultState>['dataFlags']>) => ({
    ...createDefaultState(finalGame.id),
    dataFlags: { ...createDefaultState('x').dataFlags, ...patch },
  });

  it('hideWeather / hideRanks / hidePhotos', () => {
    const r = run(flags({ hideWeather: true, hideRanks: true, hidePhotos: true }));
    const d = r.detail(finalGame.id).data;
    expect(d.weather).toBeNull();
    expect(d.home.rank).toBeNull();
    expect(d.home.rpi).toBeNull();
    const preview = r.get<GamePreview>(`/games/${finalGame.id}/preview`).data;
    expect(preview.rosters.home.every((p) => p.photoUrl === null)).toBe(true);
  });

  it('noPlays strips the play log; noMedia drops videos and articles', () => {
    const r = run(flags({ noPlays: true, noMedia: true }));
    expect(r.get<GamePlays>(`/games/${finalGame.id}/plays`).data.plays).toEqual([]);
    expect(r.get<GameStats>(`/games/${finalGame.id}/stats`).data.players).toEqual([]);
    const media = r.get<{ data: { videos: unknown[]; articles: unknown[] } }>(`/games/${finalGame.id}/media`).data;
    expect(media.videos).toEqual([]);
    expect(media.articles).toEqual([]);
  });

  it('longNames makes school names very long', () => {
    const d = run(flags({ longNames: true })).detail(finalGame.id).data;
    expect(d.home.team.school.length).toBeGreaterThan(50);
  });
});
