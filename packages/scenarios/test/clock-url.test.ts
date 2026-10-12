import { describe, expect, it } from 'vitest';
import { applyPreset, buildTimeline, createDefaultState, scoreAt, seek, setPlaying, setSpeed, stateFromHash, stateToHash } from '../src';
import { NOW, db, gameBy, run } from './helpers';

const live = gameBy((g) => g.status === 'live' && g.snapshotElapsedSeconds === 3457);
const sched = gameBy((g) => g.id === '5a80179e-949b-4eea-a9f9-300233d1a3cb');

describe('clock helpers', () => {
  it('seek sets the focus elapsed and drops an explicit nowOverride', () => {
    const s = seek(applyPreset(db, sched.id, 'pregame'), 1234, NOW);
    expect(s.nowOverride).toBeUndefined();
    expect(run(s).info.focus).toMatchObject({ status: 'live', elapsed: 1234 });
  });

  it('play continues from the snapshot moment of a live game, pause freezes it', () => {
    let s = setPlaying(db, createDefaultState(live.id), true, NOW);
    expect(run(s, NOW).info.focus.elapsed).toBe(3457);
    expect(run(s, NOW + 10_000).info.focus.elapsed).toBe(3467);
    s = setPlaying(db, s, false, NOW + 10_000);
    expect(run(s, NOW + 99_000).info.focus.elapsed).toBe(3467);
  });

  it('speed changes keep continuity', () => {
    let s = setPlaying(db, applyPreset(db, live.id, 'live-q1'), true, NOW);
    s = setSpeed(db, s, 60, NOW + 10_000); // 310
    expect(run(s, NOW + 10_000).info.focus.elapsed).toBe(310);
    expect(run(s, NOW + 11_000).info.focus.elapsed).toBe(370);
  });

  it('play on a scheduled game starts it at 0; on a final game it replays', () => {
    const a = setPlaying(db, createDefaultState(sched.id), true, NOW);
    expect(run(a, NOW).info.focus).toMatchObject({ status: 'live', elapsed: 0 });
    const b = setPlaying(db, applyPreset(db, sched.id, 'final'), true, NOW);
    expect(run(b, NOW + 5_000).info.focus).toMatchObject({ status: 'live', elapsed: 5 });
  });

  it('time-driven play bakes the moving server time when paused', () => {
    let s = setPlaying(db, applyPreset(db, sched.id, 'pregame'), true, NOW);
    s = { ...s, clock: { ...s.clock, speed: 60 } };
    const paused = setPlaying(db, s, false, NOW + 5_000);
    expect(Date.parse(paused.nowOverride!) - Date.parse(applyPreset(db, sched.id, 'pregame').nowOverride!)).toBe(300_000);
    expect(run(paused, NOW + 500_000).info.nowIso).toBe(paused.nowOverride);
  });
});

describe('timeline', () => {
  it('has period ticks and a running score', () => {
    const tl = buildTimeline(db, live.id);
    expect(tl.ticks.map((t) => t.label).slice(0, 4)).toEqual(['Q1', 'HALF', 'Q3', 'END']);
    const end = scoreAt(tl, tl.end);
    expect(end.home + end.away).toBe(tl.goals.length);
    expect(scoreAt(tl, 0)).toEqual({ home: 0, away: 0 });
    const detail = run(applyPreset(db, live.id, 'live-halftime')).detail(live.id).data;
    expect(scoreAt(tl, 1800)).toEqual({ home: detail.home.score, away: detail.away.score });
  });
});

describe('url hash', () => {
  it('round-trips game, preset and tweaks', () => {
    const base = applyPreset(db, live.id, 'live-q4');
    const tweaked = { ...seek(base, 3000, NOW), network: 'flaky' as const, latencyMs: 800, dataFlags: { ...base.dataFlags, hideRanks: true, longNames: true } };
    const hash = stateToHash(db, tweaked);
    expect(hash).toContain(`game=${live.id}`);
    expect(hash).toContain('preset=live-q4');
    const back = stateFromHash(db, hash, sched.id, NOW);
    expect(back).toMatchObject({ gameId: live.id, presetId: 'live-q4', network: 'flaky', latencyMs: 800 });
    expect(back.perGame[live.id]?.elapsedSeconds).toBe(3000);
    expect(back.dataFlags).toEqual(tweaked.dataFlags);
  });

  it('a plain preset link has no extra params; unknown ids fall back', () => {
    const hash = stateToHash(db, applyPreset(db, live.id, 'live-q4'));
    expect(hash).toBe(`#game=${live.id}&preset=live-q4`);
    const s = stateFromHash(db, '#game=nope&preset=nope', sched.id, NOW);
    expect(s).toMatchObject({ gameId: sched.id, presetId: 'default' });
  });
});
