/**
 * Pure geometry and text for the win-probability chart: time domain (regulation plus overtimes), scales, the line and
 * area paths, quarter bands, scrub lookups and the screen-reader summary. No React, no DOM.
 */
import type { WinProbabilitySeries } from '@pll/data/api';
import { clock, pct, periodLabel } from '../../lib/format';
import { teamPairColors, type TeamColorPair } from '../../lib/team-style';

export type SeriesData = WinProbabilitySeries['data'];
export type SeriesPoint = SeriesData['points'][number];

/** Sudden-victory overtime length in the simulated data (packages/data/src/clock.ts). */
export const OT_SECONDS = 240;
export const REGULATION_PERIODS = 4;

export interface PeriodBand {
  period: number;
  /** `Q1`..`Q4`, `OT`, `2OT`. */
  label: string;
  /** Domain seconds. */
  start: number;
  end: number;
}

/**
 * One stretch of the x axis: domain seconds `start..end` are drawn over the axis fractions `from..to` (0..1).
 * Regulation is linear in time; overtime is stretched to a minimum width (D18), so the axis is piecewise linear.
 */
export interface AxisSegment {
  start: number;
  end: number;
  from: number;
  to: number;
}

export interface ChartDomain {
  /** Last second on the x axis: the end of regulation, or of the last overtime reached. */
  end: number;
  periods: PeriodBand[];
  /** Piecewise-linear mapping of seconds onto the axis. Pass the whole domain to {@link createScale} to use it. */
  axis: AxisSegment[];
}

/** Overtime never gets less than this share of the x axis (D18), so its label and a sudden-victory end stay legible. */
export const MIN_OT_SHARE = 0.1;
/** Upper bound for the share of all overtimes together, so a marathon game cannot squeeze regulation. */
export const MAX_OT_SHARE = 0.4;

/**
 * Axis layout for a set of periods. Regulation keeps a time-proportional width; each overtime gets
 * `max(its natural share, MIN_OT_SHARE)` of the axis, all overtimes together capped at `MAX_OT_SHARE`.
 */
export function buildAxis(periods: readonly PeriodBand[], regulationSeconds: number): AxisSegment[] {
  const regulation = periods.filter((p) => p.period <= REGULATION_PERIODS);
  const overtimes = periods.filter((p) => p.period > REGULATION_PERIODS);
  const total = periods.length > 0 ? periods[periods.length - 1]!.end : 0;
  const natural = total > 0 ? (overtimes.length > 0 ? overtimes.reduce((m, p) => m + (p.end - p.start), 0) / total : 0) : 0;
  const perOt = overtimes.length > 0 ? Math.max(natural / overtimes.length, MIN_OT_SHARE) : 0;
  const otShare = Math.min(MAX_OT_SHARE, perOt * overtimes.length);
  const regShare = 1 - otShare;
  const segments: AxisSegment[] = [];
  let cursor = 0;
  for (const p of regulation) {
    const width = regulationSeconds > 0 ? ((p.end - p.start) / regulationSeconds) * regShare : 0;
    segments.push({ start: p.start, end: p.end, from: cursor, to: cursor + width });
    cursor += width;
  }
  for (const p of overtimes) {
    const width = otShare / overtimes.length;
    segments.push({ start: p.start, end: p.end, from: cursor, to: cursor + width });
    cursor += width;
  }
  return segments;
}

/** Seconds to an axis fraction (0..1), clamped to the domain. */
export function axisFraction(axis: readonly AxisSegment[], seconds: number): number {
  const first = axis[0];
  const last = axis[axis.length - 1];
  if (!first || !last) return 0;
  if (seconds <= first.start) return first.from;
  if (seconds >= last.end) return last.to;
  const seg = axis.find((a) => seconds <= a.end) ?? last;
  return seg.end > seg.start ? seg.from + ((seconds - seg.start) / (seg.end - seg.start)) * (seg.to - seg.from) : seg.from;
}

/** Axis fraction (0..1) back to seconds, clamped to the domain. */
export function axisSeconds(axis: readonly AxisSegment[], fraction: number): number {
  const first = axis[0];
  const last = axis[axis.length - 1];
  if (!first || !last) return 0;
  if (fraction <= first.from) return first.start;
  if (fraction >= last.to) return last.end;
  const seg = axis.find((a) => fraction <= a.to) ?? last;
  return seg.to > seg.from ? seg.start + ((fraction - seg.from) / (seg.to - seg.from)) * (seg.end - seg.start) : seg.start;
}

/**
 * X domain 0..regulationSeconds, extended by one overtime band for every started overtime. The overtime bands are drawn
 * wider than their time (D18, see {@link buildAxis}); pass the whole domain to `createScale` to get that mapping.
 */
export function chartDomain(points: readonly SeriesPoint[], regulationSeconds: number, otSeconds = OT_SECONDS): ChartDomain {
  const quarter = regulationSeconds / REGULATION_PERIODS;
  const periods: PeriodBand[] = [];
  for (let i = 0; i < REGULATION_PERIODS; i += 1) {
    periods.push({ period: i + 1, label: periodLabel(i + 1), start: i * quarter, end: (i + 1) * quarter });
  }
  const last = points.reduce((m, p) => Math.max(m, p.elapsedSeconds), 0);
  const otCount = last > regulationSeconds ? Math.ceil((last - regulationSeconds) / otSeconds) : 0;
  for (let i = 0; i < otCount; i += 1) {
    const period = REGULATION_PERIODS + 1 + i;
    periods.push({
      period,
      label: periodLabel(period),
      start: regulationSeconds + i * otSeconds,
      end: regulationSeconds + (i + 1) * otSeconds,
    });
  }
  return { end: periods[periods.length - 1]!.end, periods, axis: buildAxis(periods, regulationSeconds) };
}

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Scale {
  plot: { left: number; right: number; top: number; bottom: number; width: number; height: number };
  /** Seconds to px. */
  x: (seconds: number) => number;
  /** Home win probability (0..1) to px; 1 is the top, 0 the bottom. */
  y: (probability: number) => number;
  /** px to seconds, clamped to the domain. */
  invertX: (px: number) => number;
}

/**
 * Pixel scale for a plot box. `domain` is either the last second (a plain linear x axis) or the whole {@link ChartDomain},
 * whose piecewise axis gives overtime its minimum width (D18).
 */
export function createScale(width: number, height: number, padding: Padding, domain: number | ChartDomain): Scale {
  const domainEnd = typeof domain === 'number' ? domain : domain.end;
  const axis = typeof domain === 'number' ? null : domain.axis;
  const left = padding.left;
  const right = Math.max(left + 1, width - padding.right);
  const top = padding.top;
  const bottom = Math.max(top + 1, height - padding.bottom);
  const plotW = right - left;
  const plotH = bottom - top;
  const end = domainEnd > 0 ? domainEnd : 1;
  const clampP = (p: number) => Math.min(1, Math.max(0, p));
  return {
    plot: { left, right, top, bottom, width: plotW, height: plotH },
    x: (s) => left + (axis ? axisFraction(axis, s) : Math.min(end, Math.max(0, s)) / end) * plotW,
    y: (p) => bottom - clampP(p) * plotH,
    invertX: (px) => {
      const fraction = Math.min(1, Math.max(0, (px - left) / plotW));
      return axis ? axisSeconds(axis, fraction) : fraction * end;
    },
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Series points in time order (stable: the order of equal timestamps is kept). */
export function sortPoints(points: readonly SeriesPoint[]): SeriesPoint[] {
  return points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.elapsedSeconds - b.p.elapsedSeconds || a.i - b.i)
    .map((e) => e.p);
}

/** SVG path of the probability line: `M x y L x y ...`. Empty string with no points. */
export function buildLinePath(points: readonly SeriesPoint[], scale: Scale): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(scale.x(p.elapsedSeconds))} ${r2(scale.y(p.home))}`).join(' ');
}

export interface AreaSegment {
  /** `home` fills above the 50% line (home team ahead), `away` below it. */
  side: 'home' | 'away';
  d: string;
}

/**
 * Filled areas between the line and the 50% baseline. The line is split exactly where it crosses 50% (linear
 * interpolation), so the color changes on the baseline and never bleeds across it.
 */
export function buildAreaSegments(points: readonly SeriesPoint[], scale: Scale): AreaSegment[] {
  const y50 = scale.y(0.5);
  const segments: AreaSegment[] = [];
  let chunk: Array<[number, number]> = [];
  let chunkSign = 0;

  const flush = () => {
    if (chunkSign !== 0 && chunk.length > 0) {
      const first = chunk[0]!;
      const last = chunk[chunk.length - 1]!;
      const d = `M${r2(first[0])} ${r2(y50)} ${chunk.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join(' ')} L${r2(last[0])} ${r2(y50)} Z`;
      segments.push({ side: chunkSign > 0 ? 'home' : 'away', d });
    }
    chunk = [];
    chunkSign = 0;
  };

  let prev: SeriesPoint | null = null;
  for (const p of points) {
    const s = Math.sign(p.home - 0.5);
    if (prev && s !== 0 && chunkSign !== 0 && s !== chunkSign) {
      const t = (0.5 - prev.home) / (p.home - prev.home);
      const xc = scale.x(prev.elapsedSeconds + t * (p.elapsedSeconds - prev.elapsedSeconds));
      chunk.push([xc, y50]);
      flush();
      chunk.push([xc, y50]);
    }
    if (s !== 0 && chunkSign === 0) chunkSign = s;
    chunk.push([scale.x(p.elapsedSeconds), scale.y(p.home)]);
    prev = p;
  }
  flush();
  return segments;
}

// ---------------------------------------------------------------------------
// Quarter bands
// ---------------------------------------------------------------------------

export interface BandLayout extends PeriodBand {
  x0: number;
  x1: number;
  /** Center of the band, where the label sits. */
  mid: number;
  /** False when the label would not fit inside the band: labels never overlap. */
  showLabel: boolean;
}

/** Rough text width at the caption2 size (11px): about 7px per character. */
export const labelWidth = (label: string) => label.length * 7;

export function layoutBands(domain: ChartDomain, scale: Scale, labelPadding = 4): BandLayout[] {
  return domain.periods.map((b) => {
    const x0 = scale.x(b.start);
    const x1 = scale.x(b.end);
    return { ...b, x0, x1, mid: (x0 + x1) / 2, showLabel: x1 - x0 >= labelWidth(b.label) + labelPadding * 2 };
  });
}

// ---------------------------------------------------------------------------
// Scrubbing
// ---------------------------------------------------------------------------

/** Index of the point closest in time to `seconds`; on equal timestamps the latest one (the state after that moment). */
export function nearestIndex(points: readonly SeriesPoint[], seconds: number): number {
  if (points.length === 0) return -1;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (points[mid]!.elapsedSeconds <= seconds) lo = mid;
    else hi = mid - 1;
  }
  const next = points[lo + 1];
  if (next && Math.abs(next.elapsedSeconds - seconds) < Math.abs(points[lo]!.elapsedSeconds - seconds)) return lo + 1;
  return lo;
}

/** Keyboard scrubbing: arrows step one point, PageUp/PageDown a tenth of the series, Home/End the ends. */
export function stepIndex(index: number, key: string, length: number): number {
  if (length === 0) return -1;
  const big = Math.max(2, Math.round(length / 10));
  const last = length - 1;
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(0, index - 1);
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(last, index + 1);
    case 'PageDown':
      return Math.max(0, index - big);
    case 'PageUp':
      return Math.min(last, index + big);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return index;
  }
}

/** Game clock for an elapsed time: `{ period: 3, clockSeconds: 491, label: "Q3 8:11" }`. Boundaries belong to the ending period. */
export function clockAtSeconds(domain: ChartDomain, seconds: number) {
  const band = domain.periods.find((b) => seconds <= b.end) ?? domain.periods[domain.periods.length - 1]!;
  const clockSeconds = Math.max(0, band.end - Math.min(Math.max(seconds, band.start), band.end));
  return { period: band.period, clockSeconds, label: `${band.label} ${clock(clockSeconds)}` };
}

/** Left edge of a tooltip of `tipWidth` centered on `x`, kept inside `0..width`. */
export function clampTooltipLeft(x: number, tipWidth: number, width: number): number {
  return Math.max(0, Math.min(width - tipWidth, x - tipWidth / 2));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface SeriesSummary {
  /** Latest home probability, or null without points. */
  current: number | null;
  /** How many times the favorite changed (the line crossing 50%). */
  leadChanges: number;
  /** Largest home probability and smallest, with the time they happened. */
  high: { home: number; elapsedSeconds: number } | null;
  low: { home: number; elapsedSeconds: number } | null;
}

export function summarizeSeries(points: readonly SeriesPoint[]): SeriesSummary {
  if (points.length === 0) return { current: null, leadChanges: 0, high: null, low: null };
  let leadChanges = 0;
  let lastSign = 0;
  let high = points[0]!;
  let low = points[0]!;
  for (const p of points) {
    const s = Math.sign(p.home - 0.5);
    if (s !== 0) {
      if (lastSign !== 0 && s !== lastSign) leadChanges += 1;
      lastSign = s;
    }
    if (p.home > high.home) high = p;
    if (p.home < low.home) low = p;
  }
  return {
    current: points[points.length - 1]!.home,
    leadChanges,
    high: { home: high.home, elapsedSeconds: high.elapsedSeconds },
    low: { home: low.home, elapsedSeconds: low.elapsedSeconds },
  };
}

/** Displayed probabilities never reach a certainty before the game is over (D15): 99.9% at most, 0.1% at least. */
export const MAX_DISPLAY_PROBABILITY = 0.999;
export const MIN_DISPLAY_PROBABILITY = 0.001;

/** A win probability as it is displayed while a game is live: capped to 0.1%..99.9% (D15). `null` stays `null`. */
export function displayProbability(p: number): number;
export function displayProbability(p: number | null): number | null;
export function displayProbability(p: number | null): number | null {
  if (p === null || !Number.isFinite(p)) return null;
  return Math.min(MAX_DISPLAY_PROBABILITY, Math.max(MIN_DISPLAY_PROBABILITY, p));
}

export interface FinalResult {
  /** The winning side, or `null` when the final score is level or unknown. */
  side: 'away' | 'home' | null;
  /** `"Duke won"`, or `"Final"` without a winner. */
  text: string;
}

/** The headline of a finished game's win-probability card (D15): the result instead of 100.0% / 0.0%. */
export function finalResult(game: {
  away: { team: { school: string }; score: number | null };
  home: { team: { school: string }; score: number | null };
}): FinalResult {
  const a = game.away.score;
  const h = game.home.score;
  if (a === null || h === null || a === h) return { side: null, text: 'Final' };
  const side = h > a ? 'home' : 'away';
  return { side, text: `${game[side].team.school} won` };
}

/** One sentence per fact, for the screen-reader summary of the chart. */
export function describeSeries(
  points: readonly SeriesPoint[],
  names: { home: string; away: string },
  { live, result }: { live: boolean; result?: FinalResult },
): string {
  const s = summarizeSeries(points);
  if (s.current === null) return 'No win probability data yet.';
  const lead = s.current >= 0.5 ? names.home : names.away;
  const now = displayProbability(s.current);
  // D15: a finished game is described by its result, not by a near-certain probability.
  const opening =
    !live && result?.side
      ? `Final: ${result.text}.`
      : `${live ? 'Now' : 'At the end'}, ${names.away} ${pct(1 - now)}, ${names.home} ${pct(now)}, ${lead} favored.`;
  const parts = [
    opening,
    s.leadChanges === 0 ? 'The favorite never changed.' : `The favorite changed ${s.leadChanges} ${s.leadChanges === 1 ? 'time' : 'times'}.`,
  ];
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Chart colors (moved to lib/team-style.ts; the old names stay exported)
// ---------------------------------------------------------------------------

export { relativeLuminance, type TeamColorPair } from '../../lib/team-style';

/** Luminance a fill needed to stay visible on the dark card. Superseded by the 3:1 contrast rule of `teamColorOnDark`. */
export const MIN_FILL_LUMINANCE = 0.1;
/** RGB distance under which two fills read as the same team. Superseded by the perceptual rule of `teamPairColors`. */
export const MIN_TEAM_DISTANCE = 70;

/**
 * Fill colors for the two areas.
 * @deprecated Alias of `teamPairColors` (`lib/team-style.ts`): primaries are lightened to 3:1 contrast on the dark card
 * (hue kept) and look-alike teams are separated through their secondary color.
 */
export function pickChartColors(away: TeamColorPair, home: TeamColorPair): { away: string; home: string } {
  return teamPairColors(away, home);
}
