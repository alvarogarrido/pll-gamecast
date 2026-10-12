import type { ComponentPropsWithoutRef } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { NO_VALUE, pct, statusParts, type StatusParts } from '../../lib/format';
import { teamPairColors } from '../../lib/team-style';
import { Chip } from '../../atoms/Chip';
import { LiveDot } from '../../atoms/LiveDot';
import { RankBadge } from '../../atoms/RankBadge';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { TrendIndicator } from '../../atoms/TrendIndicator';
import { ComparisonBar } from '../../molecules/ComparisonBar';
import { EmptyState } from '../../molecules/EmptyState';
import { GameStatusLabel } from '../../molecules/GameStatusLabel';
import { Linescore } from '../../molecules/Linescore';
import { TeamIdentity } from '../../molecules/TeamIdentity';
import { TeamScope } from '../../molecules/TeamScope';
import { WhereToWatch } from '../../molecules/WhereToWatch';
import {
  attendanceLabel,
  eventTags,
  headerPhase,
  preStatus,
  resultLine,
  sideMovement,
  teamMetaLine,
  venueLabel,
  weatherLabel,
  winnerSide,
  winProbabilitySplit,
  type HeaderGame,
  type HeaderPhase,
  type HeaderSide,
} from './headerBar.logic';

export type HeaderBarVariant = 'full' | 'minimized';

export interface HeaderBarProps extends Omit<ComponentPropsWithoutRef<'section'>, 'children'> {
  /** `GameDetail['data']` from `/games/{id}`. `null` / `undefined` renders an empty state. */
  game?: HeaderGame | null;
  /** Server time in ms (`Date.parse(meta.serverTime)`), never the device clock. Drives the pregame countdown. */
  nowMs: number;
  /** `full` = the whole header, `minimized` = the compact one-row bar the page pins while scrolling. Default `full`. */
  variant?: HeaderBarVariant;
  /** Show the skeleton instead of the game. */
  loading?: boolean;
  /** Display zone for dates and times. Default Eastern. */
  timeZone?: string;
}

const SIDES: readonly HeaderSide[] = ['away', 'home'];
const gridCols = 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]';

function Score({ value, loser, className }: { value: number | null; loser: boolean; className?: string }) {
  return (
    // The sr-only live region in HeaderBar speaks the scores; the digits are decoration for assistive tech.
    <span aria-hidden="true" className={cn('tabular-nums', loser ? 'text-text-secondary' : 'text-text-primary', className)}>
      {value === null ? NO_VALUE : value}
    </span>
  );
}

/** Rank movement, RPI, seed: the small meta line under each team in the full header. */
function TeamMeta({ game, side, phase }: { game: HeaderGame; side: HeaderSide; phase: HeaderPhase }) {
  const s = game[side];
  // D13: unchanged rank / RPI is hidden; only real movement shows.
  const { rank: rankChange, rpi: rpiChange } = sideMovement(s, phase);
  if (s.rpi === null && s.seed === null && rankChange === null) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
      {s.seed !== null && <RankBadge rank={s.seed} kind="seed" />}
      {rankChange !== null && (
        <span className="inline-flex items-center gap-0.5">
          Rank <TrendIndicator change={rankChange} showValue size="sm" />
        </span>
      )}
      {s.rpi !== null && (
        <span className="inline-flex items-center gap-0.5">
          <RankBadge rank={s.rpi} kind="rpi" />
          {rpiChange !== null && <TrendIndicator change={rpiChange} showValue size="sm" />}
        </span>
      )}
    </div>
  );
}

/** Logo, rank, name and record, then rank/RPI meta. Abbreviation in narrow containers, school name from 448px up. */
function TeamBlock({ game, side, phase }: { game: HeaderGame; side: HeaderSide; phase: HeaderPhase }) {
  const s = game[side];
  const color = teamPairColors(game.away.team.colors, game.home.team.colors)[side];
  return (
    <TeamScope team={s.team} primaryOnDark={color} className="flex min-w-0 flex-col items-center gap-1">
      <div className="@md:hidden">
        <TeamIdentity team={s.team} layout="stacked" size="sm" side={side} nameStyle="abbreviation" rank={s.rank} record={s.record} color={color} />
      </div>
      <div className="hidden @md:block">
        <TeamIdentity team={s.team} layout="stacked" size="md" side={side} nameStyle="school" rank={s.rank} record={s.record} color={color} />
      </div>
      <TeamMeta game={game} side={side} phase={phase} />
    </TeamScope>
  );
}

function PreCenter({ game, nowMs, timeZone }: { game: HeaderGame; nowMs: number; timeZone?: string }) {
  const pre = preStatus(game, nowMs, timeZone);
  return (
    <div data-status={pre.kind} className="flex flex-col items-center gap-1 text-center">
      <span className="text-headline text-text-primary">{pre.date}</span>
      <span className="text-subhead text-text-secondary">{pre.time}</span>
      {pre.notice && <Chip tone="outline" size="sm">{pre.notice}</Chip>}
      {pre.countdown && <Chip tone="gold" size="sm">{pre.countdown}</Chip>}
    </div>
  );
}

function FullHeader({ game, nowMs, timeZone, className }: { game: HeaderGame; nowMs: number; timeZone?: string; className?: string }) {
  const phase = headerPhase(game);
  const winner = winnerSide(game);
  const tags = phase === 'pre' ? eventTags(game) : [];
  const venue = venueLabel(game.venue);
  const weather = weatherLabel(game.weather);
  const scoreClass = 'text-score @md:text-score-hero';
  // Both teams side by side on a dark card: navy is lightened and look-alikes (Duke / Notre Dame) are told apart.
  const stripColors = teamPairColors(game.away.team.colors, game.home.team.colors);

  return (
    <div className={cn('overflow-hidden rounded-md border border-border-default bg-surface-card text-text-primary', className)}>
      {/* Team color strip: away left, home right. */}
      <div aria-hidden="true" className="grid h-1 grid-cols-2">
        {SIDES.map((side) => (
          <TeamScope key={side} team={game[side].team} primaryOnDark={stripColors[side]} className="bg-team-primary-on-dark" />
        ))}
      </div>
      <div className="flex flex-col gap-3 p-4">
        {tags.length > 0 && (
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Event">
            {tags.map((tag, i) => (
              <li key={tag}>
                <Chip tone={i === 0 && game.label ? 'gold' : 'outline'} size="sm">{tag}</Chip>
              </li>
            ))}
          </ul>
        )}

        <div className={cn(gridCols, 'items-start gap-2')}>
          <TeamBlock game={game} side="away" phase={phase} />
          <div className="mt-2 flex items-center justify-center gap-2 @md:mt-4 @md:gap-4">
            {phase === 'pre' ? (
              <PreCenter game={game} nowMs={nowMs} timeZone={timeZone} />
            ) : (
              <>
                <Score value={game.away.score} loser={winner === 'home'} className={scoreClass} />
                <GameStatusLabel game={game} nowMs={nowMs} variant="stacked" timeZone={timeZone} />
                <Score value={game.home.score} loser={winner === 'away'} className={scoreClass} />
              </>
            )}
          </div>
          <TeamBlock game={game} side="home" phase={phase} />
        </div>

        {game.broadcasts.length > 0 ? (
          <WhereToWatch broadcasts={game.broadcasts} />
        ) : (
          phase === 'pre' && <p className="text-center text-footnote text-text-tertiary">Broadcast to be announced</p>
        )}

        {phase !== 'pre' && (
          <div className="border-t border-border-hairline pt-2">
            <Linescore game={game} />
          </div>
        )}

        {phase === 'pre' && (
          <div className="flex flex-col items-center gap-1 border-t border-border-hairline pt-3 text-center text-footnote text-text-secondary @md:flex-row @md:justify-center @md:gap-4">
            <p className="inline-flex min-w-0 items-center gap-1">
              <Icon name="location" size={16} className="shrink-0 text-text-tertiary" />
              <span className="min-w-0">
                {venue.name}
                {venue.place && <span className="text-text-tertiary"> · {venue.place}</span>}
              </span>
            </p>
            {weather && <p>{weather}</p>}
          </div>
        )}
      </div>
    </div>
  );
}


// ---- Desktop band (D22): container >= 1024px ------------------------------

/** Schools with more letters than this ("Johns Hopkins") stay at `title3` until an 80rem container; others grow to `title1` from 72rem. */
const LONG_SCHOOL = 11;

type PairColors = ReturnType<typeof teamPairColors>;

/** One team of the band: logo (88px, 72px when tight), then rank + school, mascot, meta line and (final) rank / RPI movement. Home mirrors. */
function BandTeam({ game, side, phase, colors }: { game: HeaderGame; side: HeaderSide; phase: HeaderPhase; colors: PairColors }) {
  const s = game[side];
  const mirrored = side === 'home';
  const move = sideMovement(s, phase);
  return (
    <TeamScope team={s.team} primaryOnDark={colors[side]} className={cn('flex min-w-0 items-center gap-3 @6xl:gap-4', mirrored && 'flex-row-reverse text-right')}>
      <div className="size-18 shrink-0 @6xl:size-22">
        <TeamLogo src={s.team.logoUrl} name={`${s.team.school} ${s.team.mascot}`} abbreviation={s.team.abbreviation} color={colors[side]} size="fill" decorative />
      </div>
      <div className={cn('flex min-w-0 flex-col gap-1', mirrored ? 'items-end' : 'items-start')}>
        {/* title3 in the tight band (< 72rem); title1 from 72rem, or from 80rem for long names like "Johns Hopkins". */}
        <p className={cn('max-w-full truncate text-title3 font-bold text-text-primary', s.team.school.length > LONG_SCHOOL ? '@7xl:text-title1' : '@6xl:text-title1')}>
          {s.rank !== null && (
            <>
              <span aria-hidden="true" className="mr-2 text-accent-gold">
                #{s.rank}
              </span>
              <span className="sr-only">Ranked number {s.rank}, </span>
            </>
          )}
          {s.team.school}
        </p>
        <p className="max-w-full truncate text-callout text-text-secondary">{s.team.mascot}</p>
        <p className="max-w-full truncate text-footnote tabular-nums text-text-tertiary">{teamMetaLine(s)}</p>
        {(move.rank !== null || move.rpi !== null) && (
          <p className="flex items-center gap-2.5 text-caption text-text-secondary">
            {move.rank !== null && (
              <span className="inline-flex items-center gap-1">
                Rank <TrendIndicator change={move.rank} showValue size="sm" />
              </span>
            )}
            {move.rpi !== null && (
              <span className="inline-flex items-center gap-1">
                RPI <TrendIndicator change={move.rpi} showValue size="sm" />
              </span>
            )}
          </p>
        )}
      </div>
    </TeamScope>
  );
}

/** The huge score of one side. The sr-only live region in HeaderBar speaks it; the digits are decoration. */
function BandScore({ value, tone }: { value: number | null; tone: 'win' | 'lose' | 'none' }) {
  const pregame = value === null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'text-center tabular-nums',
        pregame ? 'text-score-hero' : 'text-score-display',
        pregame || tone === 'lose' ? 'text-text-tertiary' : 'text-text-primary',
      )}
    >
      {pregame ? NO_VALUE : value}
    </span>
  );
}

/** Center column: event label, then date / kickoff / countdown (pre), LIVE + clock (live) or FINAL + result (final). */
function BandCenter({ game, nowMs, phase, timeZone }: { game: HeaderGame; nowMs: number; phase: HeaderPhase; timeZone?: string }) {
  const tags = phase === 'pre' ? eventTags(game) : game.label ? [game.label] : [];
  const parts = statusParts(game, nowMs, { timeZone });
  const pre = phase === 'pre' ? preStatus(game, nowMs, timeZone) : null;
  const result = resultLine(game);
  return (
    <div data-status={parts.kind} className="flex min-w-0 flex-col items-center gap-2 text-center">
      {tags.length > 0 && (
        <ul className="flex flex-wrap items-center justify-center gap-1" aria-label="Event">
          {tags.map((tag, i) => (
            <li key={tag}>
              <Chip tone={i === 0 && game.label ? 'gold' : 'outline'} size="sm">
                {tag}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      {pre && (
        <>
          <span className="text-caption font-semibold uppercase tracking-wider text-text-secondary">{pre.date}</span>
          <span className="text-clock-lg text-text-primary">{pre.time}</span>
          {pre.notice && (
            <Chip tone="outline" size="sm">
              {pre.notice}
            </Chip>
          )}
          {pre.countdown && <Chip className="text-text-primary">{pre.countdown}</Chip>}
        </>
      )}
      {phase === 'live' && (
        <>
          <span className="inline-flex items-center gap-2 text-footnote font-bold tracking-wider text-status-live">
            <LiveDot />
            LIVE
          </span>
          <span className="text-clock-lg text-text-primary">{parts.label === 'LIVE' ? parts.detail : parts.label}</span>
        </>
      )}
      {phase === 'final' && (
        <>
          <span className="text-footnote font-bold tracking-wider text-text-tertiary">{parts.label}</span>
          {result && <span className="text-subhead font-semibold text-text-primary">{result}</span>}
        </>
      )}
    </div>
  );
}

/** Venue, weather, attendance and where to watch: the right-hand facts of the strip. */
function BandFacts({ game, phase }: { game: HeaderGame; phase: HeaderPhase }) {
  const venue = venueLabel(game.venue);
  const weather = weatherLabel(game.weather);
  const attendance = attendanceLabel(game.attendance);
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-5 gap-y-2 text-footnote text-text-secondary">
      {game.broadcasts.length > 0 ? (
        <WhereToWatch broadcasts={game.broadcasts} height={14} className="justify-start" />
      ) : (
        phase === 'pre' && <span className="text-text-tertiary">Broadcast to be announced</span>
      )}
      <span className="inline-flex max-w-full min-w-0 items-center gap-1">
        <Icon name="location" size={16} className="shrink-0 text-text-tertiary" />
        <span className="min-w-0 truncate">
          {venue.name}
          {venue.place && ` · ${venue.place}`}
        </span>
      </span>
      {weather && <span className="whitespace-nowrap">{weather}</span>}
      {attendance && <span className="whitespace-nowrap">{attendance}</span>}
    </div>
  );
}

/** Pregame split of the win probability, in the two teams' pair colors: `Win probability [bar] YALE 39% · PRIN 61%`. */
function BandWinProbability({ game }: { game: HeaderGame }) {
  const split = winProbabilitySplit(game);
  if (!split) return null;
  const { away, home } = game;
  return (
    <div className="flex min-w-0 items-center gap-3 text-footnote text-text-secondary">
      <span className="whitespace-nowrap">Win probability</span>
      <div className="w-64 shrink-0">
        <ComparisonBar
          away={split.away}
          home={split.home}
          awayColor={away.team.colors.primary}
          homeColor={home.team.colors.primary}
          awaySecondaryColor={away.team.colors.secondary}
          homeSecondaryColor={home.team.colors.secondary}
          awayName={away.team.school}
          homeName={home.team.school}
          format="pct"
          digits={0}
        />
      </div>
      <span aria-hidden="true" className="whitespace-nowrap tabular-nums text-text-primary">
        {away.team.abbreviation} {pct(split.away, 0)} · {home.team.abbreviation} {pct(split.home, 0)}
      </span>
    </div>
  );
}

/**
 * Direction A "Broadcast band" (D22), for a container >= 1024px: [away team | away score | status | home score | home team] with a
 * team-color wash from each edge and a 3px two-color strip on top, then a darker strip with the linescore (live, final) or the
 * win-probability split (pregame) on the left and the facts on the right. The grid and washes are `.hb-*` classes in `styles.css`.
 */
function DesktopHeader({ game, nowMs, timeZone }: { game: HeaderGame; nowMs: number; timeZone?: string }) {
  const phase = headerPhase(game);
  const winner = winnerSide(game);
  const colors = teamPairColors(game.away.team.colors, game.home.team.colors);
  const tone = (side: HeaderSide) => (winner === null ? 'none' : winner === side ? 'win' : 'lose');
  return (
    <div className="hidden overflow-hidden rounded-md border border-border-default bg-surface-card text-text-primary @4xl:block">
      <div className="hb-band relative isolate grid items-center px-6 py-6 @6xl:px-8">
        {SIDES.map((side) => (
          <TeamScope
            key={side}
            team={game[side].team}
            primaryOnDark={colors[side]}
            aria-hidden="true"
            className={cn('pointer-events-none absolute inset-0 -z-10', side === 'away' ? 'hb-wash-away' : 'hb-wash-home')}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 grid h-0.75 grid-cols-2">
          {SIDES.map((side) => (
            <TeamScope key={side} team={game[side].team} primaryOnDark={colors[side]} className="bg-team-primary-on-dark" />
          ))}
        </div>
        <BandTeam game={game} side="away" phase={phase} colors={colors} />
        <BandScore value={game.away.score} tone={tone('away')} />
        <BandCenter game={game} nowMs={nowMs} phase={phase} timeZone={timeZone} />
        <BandScore value={game.home.score} tone={tone('home')} />
        <BandTeam game={game} side="home" phase={phase} colors={colors} />
      </div>
      <div
        className={cn(
          'flex items-center justify-between gap-6 border-t border-border-hairline bg-surface-page/60 px-6 @6xl:px-8',
          phase === 'pre' ? 'py-4' : 'py-3',
        )}
      >
        {phase === 'pre' ? (
          <BandWinProbability game={game} />
        ) : (
          <div className="w-80 shrink-0">
            <Linescore game={game} />
          </div>
        )}
        <BandFacts game={game} phase={phase} />
      </div>
    </div>
  );
}

/** Live clock without the "LIVE" word (the dot says it): `Q4 2:23`; other states keep their label. */
function compactStatus(parts: StatusParts) {
  if (parts.kind === 'live' && parts.label === 'LIVE' && parts.detail) {
    return (
      <span className="inline-flex items-center gap-1 text-clock text-status-live">
        <LiveDot size="sm" />
        {parts.detail}
      </span>
    );
  }
  return <span className={cn('text-caption', parts.kind === 'live' ? 'font-semibold text-status-live' : 'text-text-secondary')}>{parts.label}</span>;
}

function MinimizedHeader({ game, nowMs, timeZone }: { game: HeaderGame; nowMs: number; timeZone?: string }) {
  const phase = headerPhase(game);
  const winner = winnerSide(game);
  const parts = statusParts(game, nowMs, { timeZone });
  return (
    <div className="border-b border-border-default bg-surface-card px-4 py-2 text-text-primary shadow-elevation-2">
      <div className={cn(gridCols, 'items-center gap-2')}>
        <TeamIdentity team={game.away.team} size="sm" side="away" nameStyle="abbreviation" rank={game.away.rank} />
        <div className="flex flex-col items-center">
          {phase === 'pre' ? (
            <>
              <span className="text-caption font-semibold text-text-primary">{parts.label}</span>
              <WhereToWatch broadcasts={game.broadcasts} size="sm" className="mt-0.5" />
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-score-sm">
                <Score value={game.away.score} loser={winner === 'home'} />
                <span aria-hidden="true" className="text-text-tertiary">
                  –
                </span>
                <Score value={game.home.score} loser={winner === 'away'} />
              </span>
              {compactStatus(parts)}
            </>
          )}
        </div>
        <TeamIdentity team={game.home.team} size="sm" side="home" nameStyle="abbreviation" rank={game.home.rank} />
      </div>
    </div>
  );
}

/** Placeholder with the same footprint as the header. */
export function HeaderBarSkeleton({ variant = 'full', className }: { variant?: HeaderBarVariant; className?: string }) {
  if (variant === 'minimized') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading game header" className={cn('flex items-center justify-between gap-4 border-b border-border-default bg-surface-card px-4 py-3', className)}>
        <Skeleton variant="circle" className="size-7" />
        <Skeleton className="h-8 w-24" />
        <Skeleton variant="circle" className="size-7" />
      </div>
    );
  }
  return (
    <div role="status" aria-busy="true" aria-label="Loading game header" className={cn('rounded-md border border-border-default bg-surface-card p-4', className)}>
      <div className={cn(gridCols, 'items-start gap-2')}>
        <div className="flex flex-col items-center gap-2">
          <Skeleton variant="circle" className="size-10" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-2 h-8 w-24" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton variant="circle" className="size-10" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="mx-auto mt-4 h-6 w-20" />
      <Skeleton variant="rect" className="mt-4 h-14 w-full" />
    </div>
  );
}

/**
 * The game header (PRD "Header Bar", MUST). `full`: away left / home right, status and scores in the middle, where to watch,
 * the period linescore (live, final) or venue, weather and event tags (pregame), and rank / RPI movement (final).
 * `minimized`: one compact row for the page to pin while scrolling (the sticky behavior is the page's).
 * Responds to its container width (not the viewport), so it fits a 380px desktop column as well as a phone. From a 1024px
 * container the `full` variant becomes the desktop "Broadcast band" (D22).
 */
export function HeaderBar({ game, nowMs, variant = 'full', loading = false, timeZone, className, ...rest }: HeaderBarProps) {
  if (loading) return <HeaderBarSkeleton variant={variant} className={className} />;
  if (!game) {
    return (
      <section aria-label="Game header" className={className} {...rest}>
        <EmptyState icon="lacrosse-field" title="Game unavailable" message="We could not load this game. Try again in a moment." />
      </section>
    );
  }

  const phase = headerPhase(game);
  const title = `${game.away.team.school} at ${game.home.team.school}`;
  return (
    <section aria-label={title} data-variant={variant} data-phase={phase} className={cn('@container', className)} {...rest}>
      <h2 className="sr-only">{title}</h2>
      {phase !== 'pre' && (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`${game.away.team.school} ${game.away.score ?? 0}, ${game.home.team.school} ${game.home.score ?? 0}`}
        </p>
      )}
      {variant === 'minimized' ? (
        <MinimizedHeader game={game} nowMs={nowMs} timeZone={timeZone} />
      ) : (
        <>
          {/* Below 1024px of container width the stacked layout; from there the broadcast band (D22). */}
          <FullHeader game={game} nowMs={nowMs} timeZone={timeZone} className="@4xl:hidden" />
          <DesktopHeader game={game} nowMs={nowMs} timeZone={timeZone} />
        </>
      )}
    </section>
  );
}
