import type { ComponentPropsWithoutRef } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { NO_VALUE, statusParts, type StatusParts } from '../../lib/format';
import { teamPairColors } from '../../lib/team-style';
import { Chip } from '../../atoms/Chip';
import { LiveDot } from '../../atoms/LiveDot';
import { RankBadge } from '../../atoms/RankBadge';
import { Skeleton } from '../../atoms/Skeleton';
import { TrendIndicator } from '../../atoms/TrendIndicator';
import { EmptyState } from '../../molecules/EmptyState';
import { GameStatusLabel } from '../../molecules/GameStatusLabel';
import { Linescore } from '../../molecules/Linescore';
import { TeamIdentity } from '../../molecules/TeamIdentity';
import { TeamScope } from '../../molecules/TeamScope';
import { WhereToWatch } from '../../molecules/WhereToWatch';
import {
  eventTags,
  headerPhase,
  preStatus,
  venueLabel,
  weatherLabel,
  winnerSide,
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
  const post = phase === 'final';
  const showRankChange = post && s.rank !== null && s.rankChange !== null;
  const showRpiChange = post && s.rpiChange !== null;
  if (s.rpi === null && s.seed === null && !showRankChange) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
      {s.seed !== null && <RankBadge rank={s.seed} kind="seed" />}
      {showRankChange && (
        <span className="inline-flex items-center gap-0.5">
          Rank <TrendIndicator change={s.rankChange} showValue size="sm" />
        </span>
      )}
      {s.rpi !== null && (
        <span className="inline-flex items-center gap-0.5">
          <RankBadge rank={s.rpi} kind="rpi" />
          {showRpiChange && <TrendIndicator change={s.rpiChange} showValue size="sm" />}
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

function FullHeader({ game, nowMs, timeZone }: { game: HeaderGame; nowMs: number; timeZone?: string }) {
  const phase = headerPhase(game);
  const winner = winnerSide(game);
  const tags = phase === 'pre' ? eventTags(game) : [];
  const venue = venueLabel(game.venue);
  const weather = weatherLabel(game.weather);
  const scoreClass = 'text-score @md:text-score-hero';
  // Both teams side by side on a dark card: navy is lightened and look-alikes (Duke / Notre Dame) are told apart.
  const stripColors = teamPairColors(game.away.team.colors, game.home.team.colors);

  return (
    <div className="overflow-hidden rounded-md border border-border-default bg-surface-card text-text-primary">
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
              <span className="flex items-center gap-2 text-score">
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
 * Responds to its container width (not the viewport), so it fits a 380px desktop column as well as a phone.
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
        <FullHeader game={game} nowMs={nowMs} timeZone={timeZone} />
      )}
    </section>
  );
}
