'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { GameSummary } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { pct } from '../../lib/format';
import { teamColorVars, teamPairColors } from '../../lib/team-style';
import { Card } from '../../atoms/Card';
import { Skeleton } from '../../atoms/Skeleton';
import { StatusPill } from '../../atoms/StatusPill';
import { TeamLogo } from '../../atoms/TeamLogo';
import { ComparisonBar } from '../../molecules/ComparisonBar';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { TeamPercent } from '../../molecules/TeamPercent';
import {
  buildAreaSegments,
  buildLinePath,
  chartDomain,
  clampTooltipLeft,
  clockAtSeconds,
  createScale,
  describeSeries,
  displayProbability,
  finalResult,
  goalLabel,
  goalsAtSeconds,
  layoutBands,
  nearestIndex,
  placeGoalDots,
  sortPoints,
  stepIndex,
  type GoalMarker,
  type SeriesData,
} from './winProbability.logic';

export interface WinProbabilityChartProps {
  series: SeriesData;
  /** `winProbabilityHome` is the pregame value before kickoff (`GameDetail['data']` fits). */
  game: Pick<GameSummary, 'status' | 'home' | 'away'> & { winProbabilityHome?: number | null };
  /**
   * Goals to mark on the line: a small dot in the scoring team's color at each goal's elapsed time, and "GOAL · name" in
   * the scrub tooltip. Build them from the plays with `goalMarkers(plays, game, playerRefs)`. Omit (plays not loaded) for no dots.
   */
  goals?: readonly GoalMarker[];
  loading?: boolean;
  className?: string;
}

const PADDING = { top: 8, right: 36, bottom: 22, left: 0 };
const TOOLTIP_WIDTH = 148;
const DEFAULT_WIDTH = 340;
/** Goal dot radius: 3 = a 6px dot, readable at 375px without crowding the line. */
const GOAL_DOT_RADIUS = 3;
/** A goal dot closer than this to the live end marker (its pulse is r=7) is not drawn, so it never hides the marker. */
const END_MARKER_CLEARANCE = 10;

export function WinProbabilityChartSkeleton({ className }: { className?: string }) {
  return (
    <Card role="status" aria-busy="true" className={cn('flex flex-col gap-3', className)}>
      <span className="sr-only">Loading win probability</span>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton variant="rect" className="h-10 w-full" />
      <Skeleton variant="rect" className="h-40 w-full" />
    </Card>
  );
}

/**
 * Home win probability over game time, PLL style: one line around 50%, the area between the line and 50% filled in
 * the home color when the home team is favored and the away color when it is not. Quarter gridlines, a dashed 50%
 * line, hover/touch scrubbing with a tooltip, arrow-key scrubbing, and a screen-reader summary. Live values are capped at
 * 99.9% / 0.1% (D15); a finished game's header says who won ("Duke won") instead of 100.0% / 0.0%. Overtime is drawn at
 * least 10% of the axis wide (D18). Before kickoff it is a simple split bar instead. The SVG is drawn in real pixels from the measured width, so strokes and text never stretch.
 */
export function WinProbabilityChart({ series, game, goals, loading = false, className }: WinProbabilityChartProps) {
  const summaryId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(Math.max(1, Math.floor(el.getBoundingClientRect().width)) || DEFAULT_WIDTH);
    return () => ro.disconnect();
  }, [loading]);

  const points = useMemo(() => sortPoints(series.points), [series.points]);
  const domain = useMemo(() => chartDomain(points, series.regulationSeconds), [points, series.regulationSeconds]);

  const away = game.away.team;
  const home = game.home.team;
  // Dark team colors are lightened and look-alike teams separated, so both areas stay readable on the dark card.
  const colors = teamPairColors(away.colors, home.colors);
  const live = game.status === 'live';
  const started = game.status === 'live' || game.status === 'final';

  if (loading) return <WinProbabilityChartSkeleton className={className} />;

  const title = 'Win probability';

  // ---- Pregame: a split bar
  if (!started) {
    const pregame = game.winProbabilityHome ?? points[0]?.home ?? null;
    return (
      <Card as="section" aria-label={title} className={cn('flex flex-col gap-3', className)}>
        <SectionHeader title={title} />
        {pregame === null ? (
          <EmptyState icon="stats" message="The pregame win probability is published closer to kickoff." />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <TeamPercent team={away} value={1 - pregame} side="away" color={colors.away} />
              <TeamPercent team={home} value={pregame} side="home" color={colors.home} />
            </div>
            <ComparisonBar
              away={1 - pregame}
              home={pregame}
              awayColor={away.colors.primary}
              homeColor={home.colors.primary}
              awaySecondaryColor={away.colors.secondary}
              homeSecondaryColor={home.colors.secondary}
              awayName={away.school}
              homeName={home.school}
              format="pct"
              label={undefined}
            />
            <p className="text-center text-caption text-text-tertiary">Pregame probability. The line chart starts at kickoff.</p>
          </>
        )}
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Card as="section" aria-label={title} className={className}>
        <SectionHeader title={title} />
        <EmptyState icon="stats" message="The win probability chart appears after the first play." />
      </Card>
    );
  }

  // ---- Live / final: the line chart
  const height = width < 400 ? 168 : 192;
  // The whole domain, not just its end: overtime is drawn at a minimum width (D18).
  const scale = createScale(width, height, PADDING, domain);
  const bands = layoutBands(domain, scale);
  const linePath = buildLinePath(points, scale);
  const areas = buildAreaSegments(points, scale);
  const lastIndex = points.length - 1;
  const last = points[lastIndex]!;
  // D15: live values never print as a certainty (99.9% / 0.1%); a finished game shows its result instead.
  const current = displayProbability(last.home);
  const final = game.status === 'final';
  const result = finalResult(game);
  const winnerTeam = result.side ? game[result.side].team : null;
  const y50 = scale.y(0.5);
  const active = scrub === null ? null : points[Math.min(scrub, lastIndex)]!;
  const activeX = active ? scale.x(active.elapsedSeconds) : 0;
  const activeY = active ? scale.y(active.home) : 0;
  const tipLeft = clampTooltipLeft(activeX, TOOLTIP_WIDTH, width);
  const tipOnTop = active ? activeY > y50 : true;

  const endX = scale.x(last.elapsedSeconds);
  const endY = scale.y(last.home);
  const goalDots = goals?.length
    ? placeGoalDots(goals, points, scale, live ? { x: endX, y: endY, radius: END_MARKER_CLEARANCE } : undefined)
    : [];
  const activeGoals = active ? goalsAtSeconds(goals ?? [], active.elapsedSeconds) : [];

  const summary = describeSeries(points, { home: home.school, away: away.school }, { live, result: final ? result : undefined });
  const valueIndex = scrub ?? lastIndex;
  const valuePoint = points[valueIndex]!;
  const valueClock = clockAtSeconds(domain, valuePoint.elapsedSeconds).label;
  const shownHome = displayProbability(valuePoint.home);
  const valueGoals = goalsAtSeconds(goals ?? [], valuePoint.elapsedSeconds);
  const valueText = `${valueClock}: ${away.school} ${pct(1 - shownHome)}, ${home.school} ${pct(shownHome)}${valueGoals.map((g) => `. ${goalLabel(g)}`).join('')}`;

  const scrubFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setScrub(nearestIndex(points, scale.invertX(e.clientX - rect.left)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setScrub(null);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return;
    e.preventDefault();
    setScrub(stepIndex(valueIndex, e.key, points.length));
  };

  return (
    <Card as="section" aria-label={title} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={title} action={live ? <StatusPill status="live" /> : undefined} />

      {final ? (
        // D15: the result, not "100.0% / 0.0%". The chart below still shows how the game unfolded.
        <div data-result={result.side ?? 'none'} className="flex items-center justify-center gap-2">
          {winnerTeam && (
            <TeamLogo
              src={winnerTeam.logoUrl}
              name={`${winnerTeam.school} ${winnerTeam.mascot}`}
              abbreviation={winnerTeam.abbreviation}
              color={result.side ? colors[result.side] : undefined}
              size="sm"
              decorative
            />
          )}
          <p className="text-headline text-text-primary">{result.text}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <TeamPercent team={away} value={1 - current} side="away" color={colors.away} />
          <TeamPercent team={home} value={current} side="home" color={colors.home} />
        </div>
      )}

      <p id={summaryId} className="sr-only">
        {summary} Use the left and right arrow keys to move through the game, Home and End to jump to the start or the latest point.
      </p>

      <div ref={hostRef} className="relative w-full">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Win probability over the game"
          aria-describedby={summaryId}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={lastIndex}
          aria-valuenow={valueIndex}
          aria-valuetext={valueText}
          onKeyDown={onKeyDown}
          onBlur={() => setScrub(null)}
          onPointerDown={scrubFromPointer}
          onPointerMove={scrubFromPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setScrub(null);
          }}
          // pan-y: vertical page scroll still works on touch while horizontal drags scrub.
          style={{ touchAction: 'pan-y' }}
          className="relative cursor-crosshair select-none rounded-sm"
        >
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block overflow-visible">
            {/* Quarter gridlines and labels */}
            {bands.slice(0, -1).map((b) => (
              <line key={`g-${b.period}`} x1={b.x1} x2={b.x1} y1={scale.plot.top} y2={scale.plot.bottom} className="stroke-border-default" strokeWidth={1} />
            ))}
            {bands.map((b) =>
              b.showLabel ? (
                <text key={`l-${b.period}`} x={b.mid} y={height - 6} textAnchor="middle" className="fill-text-tertiary text-caption2">
                  {b.label}
                </text>
              ) : null,
            )}

            {/* Frame: 100% and 0% */}
            <line x1={scale.plot.left} x2={scale.plot.right} y1={scale.plot.top} y2={scale.plot.top} className="stroke-border-hairline" strokeWidth={1} />
            <line x1={scale.plot.left} x2={scale.plot.right} y1={scale.plot.bottom} y2={scale.plot.bottom} className="stroke-border-default" strokeWidth={1} />

            {/* Areas between the line and 50%: home above, away below */}
            <g style={teamColorVars(home.colors.primary, null, colors.home)}>
              {areas.filter((a) => a.side === 'home').map((a, i) => <path key={i} d={a.d} className="fill-team-primary-on-dark/80" />)}
            </g>
            <g style={teamColorVars(away.colors.primary, null, colors.away)}>
              {areas.filter((a) => a.side === 'away').map((a, i) => <path key={i} d={a.d} className="fill-team-primary-on-dark/80" />)}
            </g>

            {/* Dashed 50% line */}
            <line x1={scale.plot.left} x2={scale.plot.right} y1={y50} y2={y50} className="stroke-text-secondary" strokeWidth={1} strokeDasharray="4 4" />

            {/* Y labels, home probability */}
            {[
              [1, '100%'],
              [0.5, '50%'],
              [0, '0%'],
            ].map(([p, label]) => (
              <text
                key={label}
                x={width - 2}
                y={scale.y(p as number) + (p === 1 ? 10 : p === 0 ? -3 : 4)}
                textAnchor="end"
                className="fill-text-tertiary text-caption2"
              >
                {label}
              </text>
            ))}

            {/* The line */}
            <path d={linePath} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-text-primary" />

            {/* Goal dots on the line, in the scoring team's color with a 1px card ring; drawn under the end marker */}
            {goalDots.length > 0 && (
              <g>
                {(['away', 'home'] as const).map((side) => (
                  <g key={side} style={teamColorVars(game[side].team.colors.primary, null, colors[side])}>
                    {goalDots
                      .filter((d) => d.side === side)
                      .map((d, i) => (
                        <circle key={i} cx={d.x} cy={d.y} r={GOAL_DOT_RADIUS} strokeWidth={1} className="fill-team-primary-on-dark stroke-surface-card" />
                      ))}
                  </g>
                ))}
              </g>
            )}

            {/* End marker while live */}
            {live && (
              <g>
                <circle
                  cx={endX}
                  cy={endY}
                  r={7}
                  className="fill-status-live/40 motion-safe:animate-live-pulse"
                  // Scale from the circle's own center, not the SVG origin.
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
                <circle cx={endX} cy={endY} r={4} className="fill-status-live stroke-surface-card" strokeWidth={2} />
              </g>
            )}

            {/* Scrub cursor */}
            {active && (
              <g>
                <line x1={activeX} x2={activeX} y1={scale.plot.top} y2={scale.plot.bottom} className="stroke-text-primary" strokeWidth={1} />
                <circle cx={activeX} cy={activeY} r={4.5} className="fill-text-primary stroke-surface-card" strokeWidth={2} />
              </g>
            )}
          </svg>

          {active && (
            <div
              aria-hidden="true"
              // Dynamic left position of the cursor tooltip: cannot be a static utility.
              style={{ left: tipLeft, width: TOOLTIP_WIDTH }}
              className={cn(
                'pointer-events-none absolute rounded-sm border border-border-default bg-surface-raised p-2 shadow-elevation-2',
                tipOnTop ? 'top-2' : 'bottom-6',
              )}
            >
              <p className="font-display text-clock text-text-secondary">{clockAtSeconds(domain, active.elapsedSeconds).label}</p>
              {activeGoals.map((g, i) => (
                <p key={i} className="mt-1 flex items-center gap-1 truncate text-footnote font-semibold text-text-primary">
                  <span
                    aria-hidden="true"
                    style={teamColorVars(game[g.side].team.colors.primary, null, colors[g.side])}
                    className="size-2 shrink-0 rounded-full bg-team-primary-on-dark"
                  />
                  {goalLabel(g)}
                </p>
              ))}
              {[
                { team: away, value: 1 - displayProbability(active.home), color: colors.away },
                { team: home, value: displayProbability(active.home), color: colors.home },
              ].map(({ team, value, color }) => (
                <div key={team.id} className="mt-1 flex items-center gap-2 text-footnote">
                  <TeamLogo src={team.logoUrl} name={team.school} abbreviation={team.abbreviation} color={color} size="xs" decorative />
                  <span className="flex-1 truncate text-text-secondary">{team.abbreviation}</span>
                  <span className="font-semibold tabular-nums text-text-primary">{pct(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
