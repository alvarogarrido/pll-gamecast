import { describe, expect, it } from 'vitest';
import {
  buildAreaSegments,
  buildLinePath,
  chartDomain,
  clampTooltipLeft,
  clockAtSeconds,
  createScale,
  describeSeries,
  layoutBands,
  nearestIndex,
  pickChartColors,
  sortPoints,
  stepIndex,
  summarizeSeries,
  type SeriesPoint,
} from './winProbability.logic';

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
  });
});

describe('pickChartColors', () => {
  it('lightens very dark primaries and keeps light ones', () => {
    const out = pickChartColors({ primary: '#E03A3E' }, { primary: '#0C2340', secondary: '#000000' });
    expect(out.away).toBe('#e03a3e');
    expect(out.home).not.toBe('#0c2340');
  });
  it('uses the home secondary when both teams look alike', () => {
    const out = pickChartColors({ primary: '#003087', secondary: '#FFFFFF' }, { primary: '#0C2340', secondary: '#C99700' });
    expect(out.home).toBe('#c99700');
  });
  it('keeps both primaries when they differ', () => {
    const out = pickChartColors({ primary: '#E03A3E' }, { primary: '#7BAFD4', secondary: '#13294B' });
    expect(out).toEqual({ away: '#e03a3e', home: '#7bafd4' });
  });
  it('passes through invalid colors', () => {
    expect(pickChartColors({ primary: 'red' }, { primary: '#fff' })).toEqual({ away: 'red', home: '#fff' });
  });
});
