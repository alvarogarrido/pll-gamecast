import type { ReactNode } from 'react';
import type { GameSummary } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { NO_VALUE, statusLine } from '../../lib/format';
import { teamPairColors } from '../../lib/team-style';
import { RankBadge } from '../../atoms/RankBadge';
import { TeamLogo } from '../../atoms/TeamLogo';
import { GameStatusLabel } from '../GameStatusLabel';
import { gameBucket } from './gameChip.logic';

/** What the chip hands to {@link GameChipProps.renderLink}: spread all of it on the link element. */
export interface GameChipLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  'aria-label': string;
  'aria-current'?: 'page';
}

export type GameChipRenderLink = (props: GameChipLinkProps) => ReactNode;

export interface GameChipProps {
  game: GameSummary;
  /** The game being viewed: outlined in gold, `aria-current="page"`. */
  current?: boolean;
  /** Link target of the chip. */
  href: string;
  /** Server time in ms (`Date.parse(meta.serverTime)`). */
  nowMs: number;
  timeZone?: string;
  /**
   * Render the link yourself, e.g. with your router's `Link`, so switching games is a client-side navigation:
   * `renderLink={(props) => <Link {...props} />}`. Default: a plain `<a>`.
   */
  renderLink?: GameChipRenderLink;
  className?: string;
}

const defaultRenderLink: GameChipRenderLink = (props) => <a {...props} />;

const SIDES = ['away', 'home'] as const;

function TeamLine({ game, side, loser, showScore, color }: { game: GameSummary; side: (typeof SIDES)[number]; loser: boolean; showScore: boolean; color: string }) {
  const s = game[side];
  return (
    <div className="flex items-center gap-2">
      <TeamLogo src={s.team.logoUrl} name={`${s.team.school} ${s.team.mascot}`} abbreviation={s.team.abbreviation} color={color} size="xs" decorative />
      <span className="flex min-w-0 flex-1 items-center gap-1">
        {s.rank !== null && <RankBadge rank={s.rank} />}
        <span className={cn('truncate text-footnote font-semibold', loser ? 'text-text-secondary' : 'text-text-primary')}>{s.team.abbreviation}</span>
      </span>
      {showScore && (
        <span aria-hidden="true" className={cn('font-display text-headline font-bold tabular-nums', loser ? 'text-text-secondary' : 'text-text-primary')}>
          {s.score ?? NO_VALUE}
        </span>
      )}
    </div>
  );
}

/**
 * A game as a compact link chip: logo, rank and abbreviation per team with the score (live and final), and the status
 * line (start time, `Q4 2:23`, `FINAL`). One accessible name for the whole chip ("Duke 12 at Notre Dame 12, LIVE · Q4 2:23,
 * current game"). It is a list item: render it inside a `<ul>` (a horizontal scroller, say; it snaps to its start).
 */
export function GameChip({ game, current = false, href, nowMs, timeZone, renderLink = defaultRenderLink, className }: GameChipProps) {
  const bucket = gameBucket(game);
  const showScore = bucket !== 'upcoming';
  const a = game.away.score ?? 0;
  const h = game.home.score ?? 0;
  const loserSide = bucket === 'completed' && a !== h ? (a > h ? 'home' : 'away') : null;
  const colors = teamPairColors(game.away.team.colors, game.home.team.colors);
  const label = [
    `${game.away.team.school}${showScore ? ` ${a}` : ''} at ${game.home.team.school}${showScore ? ` ${h}` : ''}`,
    statusLine(game, nowMs, { timeZone }),
    current ? 'current game' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    // The data attributes sit on the <li>, not the link, so they survive a custom `renderLink`.
    <li data-current={current ? '' : undefined} data-bucket={bucket} className={cn('snap-start', className)}>
      {renderLink({
        href,
        'aria-label': label,
        'aria-current': current ? 'page' : undefined,
        className: cn(
          'flex w-40 shrink-0 flex-col gap-1 rounded-md border p-2 transition-colors',
          current ? 'border-accent-gold bg-gold-tint' : 'border-border-default bg-surface-card hover:bg-surface-track',
        ),
        children: (
          <>
            {SIDES.map((side) => (
              <TeamLine key={side} game={game} side={side} showScore={showScore} loser={loserSide === side} color={colors[side]} />
            ))}
            <GameStatusLabel game={game} nowMs={nowMs} variant="text" timeZone={timeZone} className="mt-0.5 text-caption" />
          </>
        ),
      })}
    </li>
  );
}
