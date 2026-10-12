import { describe, expect, it } from 'vitest';
import type { GameSummary, Play, PlayerRef } from '@pll/data/api';
import {
  buildAreaSegments,
  buildLinePath,
  chartDomain,
  clampTooltipLeft,
  axisFraction,
  axisSeconds,
  clockAtSeconds,
  createScale,
  describeSeries,
  displayProbability,
  finalResult,
  goalLabel,
  goalMarkers,
  goalsAtSeconds,
  MAX_OT_SHARE,
  MIN_OT_SHARE,
  layoutBands,
  nearestIndex,
  pickChartColors,
  placeGoalDots,
  sortPoints,
  stepIndex,
  summarizeSeries,
  valueAtSeconds,
  type SeriesPoint,
} from './winProbability.logic';
import { teamPairColors } from '../../lib/team-style';

const pt = (elapsedSeconds: number, home: number): SeriesPoint => ({ elapsedSeconds, home });
const REG = 3600;

describe('chartDomain', () => {
  it('is four quarters for regulation, whatever the data', () => {
    const d = chartDomain([pt(0, 0.5), pt(1800, 0.6)], REG);
    expect(d.end).toBe(3600);
    expect(d.periods.map((p) => p.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(d.periods[1]).toMatchObject({ start: 900, end: 1800 });
  });
  it('adds an OT band when the last point is past regulation, and more for each further OT', () => {
    expect(chartDomain([pt(3731, 0.9)], REG).periods.map((p) => p.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'OT']);
    expect(chartDomain([pt(3731, 0.9)], REG).end).toBe(3840);
    const two = chartDomain([pt(3900, 0.9)], REG);
    expect(two.periods.at(-1)).toMatchObject({ label: '2OT', start: 3840, end: 4080 });
    expect(two.end).toBe(4080);
  });
  it('a point exactly at the end of regulation stays regulation', () => {
    expect(chartDomain([pt(3600, 1)], REG).periods).toHaveLength(4);
  });
});

describe('scale', () => {
  const s = createScale(400, 200, { top: 10, right: 40, bottom: 20, left: 0 }, 3600);
  it('maps time to x and probability to y (home 100% at the top)', () => {
    expect(s.x(0)).toBe(0);
    expect(s.x(3600)).toBe(360);
    expect(s.x(1800)).toBe(180);
    expect(s.y(1)).toBe(10);
    expect(s.y(0)).toBe(180);
    expect(s.y(0.5)).toBe(95);
  });
  it('clamps out-of-range values and inverts x', () => {
    expect(s.x(9999)).toBe(360);
    expect(s.y(1.4)).toBe(10);
    expect(s.invertX(180)).toBe(1800);
    expect(s.invertX(-5)).toBe(0);
    expect(s.invertX(1000)).toBe(3600);
  });
  it('survives a zero-size box', () => {
    const z = createScale(0, 0, { top: 4, right: 4, bottom: 4, left: 4 }, 0);
    expect(Number.isFinite(z.x(10))).toBe(true);
    expect(Number.isFinite(z.y(0.3))).toBe(true);
  });
});

describe('paths', () => {
  const s = createScale(400, 200, { top: 0, right: 0, bottom: 0, left: 0 }, 400);
  it('line path', () => {
    expect(buildLinePath([pt(0, 0.5), pt(200, 1), pt(400, 0)], s)).toBe('M0 100 L200 0 L400 200');
    expect(buildLinePath([], s)).toBe('');
  });
  it('one fill per side of 50%, split exactly at the crossing', () => {
    const segs = buildAreaSegments([pt(0, 0.5), pt(100, 0.75), pt(200, 0.25), pt(400, 0.25)], s);
    expect(segs.map((x) => x.side)).toEqual(['home', 'away']);
    // 0.75 -> 0.25 crosses 50% halfway between t=100 and t=200, i.e. at x=150, on the baseline (y=100).
    expect(segs[0]!.d).toContain('L150 100');
    expect(segs[1]!.d.startsWith('M150 100')).toBe(true);
    // Home area never goes below the baseline: its points have y <= 100.
    const ys = [...segs[0]!.d.matchAll(/[ML]\S+ (\S+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
  });
  it('a line that stays on one side gives one segment; a flat 50% line gives none', () => {
    expect(buildAreaSegments([pt(0, 0.6), pt(100, 0.9)], s)).toHaveLength(1);
    expect(buildAreaSegments([pt(0, 0.5), pt(100, 0.5)], s)).toHaveLength(0);
    expect(buildAreaSegments([], s)).toEqual([]);
  });
  it('handles a vertical jump across 50% at the same timestamp', () => {
    const segs = buildAreaSegments([pt(0, 0.4), pt(100, 0.4), pt(100, 0.7), pt(200, 0.7)], s);
    expect(segs.map((x) => x.side)).toEqual(['away', 'home']);
  });
});

describe('bands', () => {
  it('hides a label that does not fit but never the quarter lines', () => {
    const domain = chartDomain([pt(3731, 0.9)], REG);
    const wide = layoutBands(domain, createScale(400, 100, { top: 0, right: 0, bottom: 0, left: 0 }, domain.end));
    expect(wide.every((b) => b.showLabel)).toBe(true);
    const narrow = layoutBands(domain, createScale(120, 100, { top: 0, right: 0, bottom: 0, left: 0 }, domain.end));
    expect(narrow.find((b) => b.label === 'OT')!.showLabel).toBe(false);
    expect(narrow.find((b) => b.label === 'Q1')!.showLabel).toBe(true);
  });
  it('shown labels never overlap', () => {
    const domain = chartDomain([pt(4100, 0.9)], REG);
    for (const w of [200, 260, 320, 400, 600]) {
      const shown = layoutBands(domain, createScale(w, 100, { top: 0, right: 0, bottom: 0, left: 0 }, domain.end)).filter((b) => b.showLabel);
      for (let i = 1; i < shown.length; i += 1) expect(shown[i]!.x0).toBeGreaterThanOrEqual(shown[i - 1]!.x1 - 0.001);
    }
  });
});

describe('scrubbing', () => {
  const pts = [pt(0, 0.5), pt(100, 0.6), pt(100, 0.7), pt(300, 0.4)];
  it('nearest index by time, latest on ties', () => {
    expect(nearestIndex(pts, 0)).toBe(0);
    expect(nearestIndex(pts, 100)).toBe(2);
    expect(nearestIndex(pts, 190)).toBe(2);
    expect(nearestIndex(pts, 210)).toBe(3);
    expect(nearestIndex(pts, 9999)).toBe(3);
    expect(nearestIndex([], 5)).toBe(-1);
  });
  it('keyboard steps stay in range', () => {
    expect(stepIndex(1, 'ArrowRight', 4)).toBe(2);
    expect(stepIndex(3, 'ArrowRight', 4)).toBe(3);
    expect(stepIndex(0, 'ArrowLeft', 4)).toBe(0);
    expect(stepIndex(2, 'Home', 4)).toBe(0);
    expect(stepIndex(2, 'End', 4)).toBe(3);
    expect(stepIndex(10, 'PageUp', 100)).toBe(20);
    expect(stepIndex(2, 'x', 4)).toBe(2);
    expect(stepIndex(0, 'ArrowRight', 0)).toBe(-1);
  });
  it('clock at an elapsed time', () => {
    const d = chartDomain([], REG);
    expect(clockAtSeconds(d, 0).label).toBe('Q1 15:00');
    expect(clockAtSeconds(d, 1800 + 409).label).toBe('Q3 8:11');
    expect(clockAtSeconds(d, 900).label).toBe('Q1 0:00');
    expect(clockAtSeconds(chartDomain([pt(3700, 1)], REG), 3700).label).toBe('OT 2:20');
  });
  it('keeps the tooltip inside the chart', () => {
    expect(clampTooltipLeft(5, 100, 300)).toBe(0);
    expect(clampTooltipLeft(295, 100, 300)).toBe(200);
    expect(clampTooltipLeft(150, 100, 300)).toBe(100);
  });
  it('sortPoints is stable', () => {
    const a = pt(100, 0.6);
    const b = pt(100, 0.7);
    expect(sortPoints([pt(200, 1), b, a]).slice(0, 2)).toEqual([b, a]);
  });
});

describe('summary', () => {
  it('counts favorite changes and reports extremes', () => {
    const s = summarizeSeries([pt(0, 0.5), pt(10, 0.6), pt(20, 0.4), pt(30, 0.5), pt(40, 0.7)]);
    expect(s.leadChanges).toBe(2);
    expect(s.current).toBe(0.7);
    expect(s.high).toEqual({ home: 0.7, elapsedSeconds: 40 });
    expect(s.low).toEqual({ home: 0.4, elapsedSeconds: 20 });
  });
  it('describes in words, with no NaN', () => {
    const text = describeSeries([pt(0, 0.5), pt(10, 0.57)], { home: 'Notre Dame', away: 'Duke' }, { live: true });
    expect(text).toBe('Now, Duke 43.0%, Notre Dame 57.0%, Notre Dame favored. The favorite never changed.');
    expect(describeSeries([], { home: 'A', away: 'B' }, { live: false })).toBe('No win probability data yet.');
    const final = describeSeries([pt(0, 0.5), pt(3600, 0.9995)], { home: 'Cornell', away: 'Penn' }, { live: false, result: { side: 'home', text: 'Cornell won' } });
    expect(final.startsWith('Final: Cornell won.')).toBe(true);
    expect(final).not.toContain('99.9%');
  });
});

describe('pickChartColors (alias of teamPairColors)', () => {
  it('lightens very dark primaries and keeps light ones', () => {
    const out = pickChartColors({ primary: '#E03A3E' }, { primary: '#0C2340', secondary: '#000000' });
    expect(out.away).toBe('#e03a3e');
    expect(out.home).not.toBe('#0c2340');
  });
  it('is the shared helper: look-alikes use the home secondary', () => {
    const duke = { primary: '#003087', secondary: '#FFFFFF' };
    const notreDame = { primary: '#0C2340', secondary: '#C99700' };
    expect(pickChartColors(duke, notreDame)).toEqual(teamPairColors(duke, notreDame));
    expect(pickChartColors(duke, notreDame).home).toBe('#c99700');
  });
  it('passes through invalid colors', () => {
    expect(pickChartColors({ primary: 'red' }, { primary: '#fff' })).toEqual({ away: 'red', home: '#fff' });
  });
});

describe('overtime minimum width (D18)', () => {
  const regOnly = chartDomain([pt(1000, 0.5)], REG);
  const ot = chartDomain([pt(3731, 0.9)], REG);
  const twoOt = chartDomain([pt(3900, 0.9)], REG);
  const pad = { top: 0, right: 0, bottom: 0, left: 0 };

  it('leaves a regulation game linear', () => {
    expect(regOnly.axis).toHaveLength(4);
    expect(axisFraction(regOnly.axis, 1800)).toBeCloseTo(0.5);
    const s = createScale(400, 100, pad, regOnly);
    expect(s.x(900)).toBeCloseTo(100);
  });

  it('gives a single overtime at least 10% of the axis (it is 6.25% by time)', () => {
    const s = createScale(1000, 100, pad, ot);
    const band = layoutBands(ot, s).at(-1)!;
    expect(band.label).toBe('OT');
    expect(band.x1 - band.x0).toBeGreaterThanOrEqual(1000 * MIN_OT_SHARE - 1e-6);
    expect(band.x1).toBeCloseTo(1000);
    // Regulation shrinks to fit, still proportional in time: four equal quarters.
    const quarters = layoutBands(ot, s).slice(0, 4).map((b) => b.x1 - b.x0);
    expect(quarters[0]).toBeCloseTo(quarters[3]!);
    expect(quarters[0]! * 4 + (band.x1 - band.x0)).toBeCloseTo(1000);
  });

  it('keeps the OT label legible on a phone-sized plot', () => {
    const s = createScale(340, 100, { top: 0, right: 36, bottom: 0, left: 0 }, ot);
    expect(layoutBands(ot, s).at(-1)!.showLabel).toBe(true);
  });

  it('is continuous and monotonic, and invertX undoes x', () => {
    const s = createScale(1000, 100, pad, ot);
    let prev = -1;
    for (const sec of [0, 900, 1800, 3000, 3600, 3700, 3731, 3840]) {
      const x = s.x(sec);
      expect(x).toBeGreaterThanOrEqual(prev);
      prev = x;
      expect(s.invertX(x)).toBeCloseTo(sec, 5);
    }
    expect(s.x(3600)).toBeCloseTo(1000 * (1 - MIN_OT_SHARE));
    expect(s.x(99999)).toBeCloseTo(1000);
    expect(s.invertX(-10)).toBe(0);
    expect(s.invertX(5000)).toBe(3840);
  });

  it('a sudden-victory end early in OT sits inside the wider band', () => {
    const s = createScale(1000, 100, pad, ot);
    const x = s.x(3731); // 131 s into the 240 s overtime
    expect(x).toBeGreaterThan(s.x(3600) + 40);
    expect(x).toBeLessThan(1000);
  });

  it('caps the share of several overtimes together', () => {
    const many = chartDomain([pt(3600 + 240 * 5 - 1, 0.5)], REG);
    expect(many.periods.filter((p) => p.period > 4)).toHaveLength(5);
    const otSegs = many.axis.filter((a) => a.start >= 3600);
    expect(otSegs.reduce((m, a) => m + (a.to - a.from), 0)).toBeCloseTo(MAX_OT_SHARE);
    expect(many.axis.at(-1)!.to).toBeCloseTo(1);
    // Two overtimes: 10% each = 20% together.
    expect(twoOt.axis.filter((a) => a.start >= 3600).reduce((m, a) => m + (a.to - a.from), 0)).toBeCloseTo(0.2);
  });

  it('axis helpers clamp to the domain', () => {
    expect(axisFraction(ot.axis, -5)).toBe(0);
    expect(axisFraction(ot.axis, 1e9)).toBeCloseTo(1);
    expect(axisSeconds(ot.axis, 2)).toBe(3840);
    expect(axisSeconds([], 0.5)).toBe(0);
  });
});

describe('displayProbability (D15)', () => {
  it('caps live values at 99.9% / 0.1%', () => {
    expect(displayProbability(1)).toBe(0.999);
    expect(displayProbability(0)).toBe(0.001);
    expect(displayProbability(0.9996)).toBe(0.999);
    expect(displayProbability(0.0002)).toBe(0.001);
  });
  it('leaves other values alone and passes null through', () => {
    expect(displayProbability(0.5)).toBe(0.5);
    expect(displayProbability(0.123)).toBe(0.123);
    expect(displayProbability(null)).toBeNull();
  });
  it('the summary never says 100.0%', () => {
    const text = describeSeries([pt(0, 0.5), pt(3600, 1)], { home: 'Duke', away: 'Yale' }, { live: true });
    expect(text).toContain('Yale 0.1%');
    expect(text).toContain('Duke 99.9%');
    expect(text).not.toContain('100.0%');
  });
});

describe('finalResult (D15)', () => {
  const g = (away: number | null, home: number | null) => ({
    away: { team: { school: 'Yale' }, score: away },
    home: { team: { school: 'Duke' }, score: home },
  });
  it('names the winner', () => {
    expect(finalResult(g(10, 12))).toEqual({ side: 'home', text: 'Duke won' });
    expect(finalResult(g(13, 12))).toEqual({ side: 'away', text: 'Yale won' });
  });
  it('falls back to "Final" for level or missing scores', () => {
    expect(finalResult(g(12, 12))).toEqual({ side: null, text: 'Final' });
    expect(finalResult(g(null, 12))).toEqual({ side: null, text: 'Final' });
  });
});

describe('goalMarkers', () => {
  const game = { home: { team: { id: 'h' } }, away: { team: { id: 'a' } } } as unknown as Pick<GameSummary, 'home' | 'away'>;
  const play = (over: Partial<Play>): Play => ({
    id: 'p',
    seq: 0,
    period: 1,
    clockSeconds: 0,
    elapsedSeconds: 0,
    type: 'goal',
    teamId: 'h',
    playerId: null,
    assistPlayerId: null,
    goalieId: null,
    opponentPlayerId: null,
    description: '',
    homeScore: 0,
    awayScore: 0,
    winProbabilityHome: null,
    details: {},
    ...over,
  });
  const foley = { id: 'k', teamId: 'a', firstName: 'Kyle', lastName: 'Foley', jerseyNumber: 7, position: 'A', classYear: 'Sr', photoUrl: null } as PlayerRef;

  it('keeps only goals, maps the team to a side and labels the scorer', () => {
    const plays = [
      play({ id: '1', elapsedSeconds: 600, teamId: 'a', playerId: 'k' }),
      play({ id: '2', elapsedSeconds: 700, type: 'shot', teamId: 'h' }),
      play({ id: '3', elapsedSeconds: 800, teamId: 'h', playerId: 'unknown' }),
    ];
    expect(goalMarkers(plays, game, [foley])).toEqual([
      { elapsedSeconds: 600, side: 'away', label: 'K. Foley' },
      { elapsedSeconds: 800, side: 'home' },
    ]);
  });
  it('ignores goals without a team or of a team outside the game, and sorts by time', () => {
    const plays = [
      play({ id: '1', elapsedSeconds: 900, teamId: 'h' }),
      play({ id: '2', elapsedSeconds: 100, teamId: null }),
      play({ id: '3', elapsedSeconds: 200, teamId: 'x' }),
      play({ id: '4', elapsedSeconds: 300, teamId: 'a' }),
    ];
    expect(goalMarkers(plays, game).map((g) => [g.elapsedSeconds, g.side])).toEqual([[300, 'away'], [900, 'home']]);
    expect(goalMarkers([], game)).toEqual([]);
  });
});

describe('goal dots on the line', () => {
  const points = [pt(0, 0.5), pt(600, 0.7), pt(1200, 0.3)];
  const scale = createScale(400, 200, { top: 10, right: 40, bottom: 20, left: 0 }, REG);

  it('valueAtSeconds hits points exactly, interpolates between them and is null outside the series', () => {
    expect(valueAtSeconds(points, 600)).toBe(0.7);
    expect(valueAtSeconds(points, 300)).toBeCloseTo(0.6);
    expect(valueAtSeconds(points, 900)).toBeCloseTo(0.5);
    expect(valueAtSeconds(points, 1300)).toBeNull();
    expect(valueAtSeconds([], 0)).toBeNull();
  });
  it('places a dot on the line at the goal time', () => {
    const [dot] = placeGoalDots([{ elapsedSeconds: 600, side: 'home' }], points, scale);
    expect(dot).toMatchObject({ x: scale.x(600), y: scale.y(0.7), side: 'home' });
  });
  it('drops goals past the end of the series and dots that would cover the end marker', () => {
    const goals = [
      { elapsedSeconds: 600, side: 'away' as const },
      { elapsedSeconds: 1200, side: 'home' as const },
      { elapsedSeconds: 2000, side: 'home' as const },
    ];
    expect(placeGoalDots(goals, points, scale)).toHaveLength(2);
    const end = { x: scale.x(1200), y: scale.y(0.3), radius: 10 };
    expect(placeGoalDots(goals, points, scale, end).map((d) => d.elapsedSeconds)).toEqual([600]);
  });
  it('goalsAtSeconds and goalLabel feed the tooltip', () => {
    const goals = [{ elapsedSeconds: 600, side: 'home' as const, label: 'K. Foley' }, { elapsedSeconds: 900, side: 'away' as const }];
    expect(goalsAtSeconds(goals, 600)).toHaveLength(1);
    expect(goalsAtSeconds(goals, 601)).toHaveLength(0);
    expect(goalLabel(goals[0]!)).toBe('GOAL · K. Foley');
    expect(goalLabel(goals[1]!)).toBe('GOAL');
  });
});
