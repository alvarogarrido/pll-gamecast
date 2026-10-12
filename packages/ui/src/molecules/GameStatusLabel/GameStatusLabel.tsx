import { cn } from '../../lib/cn';
import { statusParts, type StatusGame, type StatusOptions } from '../../lib/format';
import { LiveDot } from '../../atoms/LiveDot';
import { StatusPill } from '../../atoms/StatusPill';

export type GameStatusLabelVariant = 'pill' | 'stacked' | 'text';

export interface GameStatusLabelProps extends StatusOptions {
  /** A `GameSummary` (or anything with `status`, `startTime`, `clock`, and optionally `periodScores` on the sides). */
  game: StatusGame;
  /** Server time in ms (`Date.parse(meta.serverTime)`), never the device clock. Drives countdowns and day names. */
  nowMs: number;
  /**
   * `pill` = `StatusPill` (cards, headers), `stacked` = status over clock, centered between the scores
   * (game header), `text` = one plain line ("LIVE · Q3 8:11").
   */
  variant?: GameStatusLabelVariant;
  className?: string;
}

/** Game status text from `statusParts`: LIVE / HALF / END Q1 / FINAL / FINAL/OT / countdown / kickoff time. */
export function GameStatusLabel({
  game,
  nowMs,
  variant = 'pill',
  timeZone,
  countdownWithinMs,
  className,
}: GameStatusLabelProps) {
  const parts = statusParts(game, nowMs, { timeZone, countdownWithinMs });
  const isLive = parts.kind === 'live' && parts.label === 'LIVE';

  if (variant === 'pill') {
    const sentence = parts.kind === 'scheduled';
    // Live shows just the clock next to the dot; everything else shows its own label.
    return (
      <StatusPill
        status={parts.kind}
        label={isLive && parts.detail ? parts.detail : parts.label}
        uppercase={!sentence}
        className={className}
      />
    );
  }

  if (variant === 'stacked') {
    return (
      <span
        data-status={parts.kind}
        className={cn('inline-flex flex-col items-center text-center', className)}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1 text-caption font-semibold',
            isLive ? 'text-status-live' : 'text-text-secondary',
          )}
        >
          {parts.label}
          {isLive && <LiveDot size="sm" />}
        </span>
        {parts.detail && <span className="text-clock text-text-primary">{parts.detail}</span>}
      </span>
    );
  }

  return (
    <span data-status={parts.kind} className={cn('inline-flex items-center gap-1 text-footnote', isLive ? 'font-semibold text-status-live' : 'text-text-secondary', className)}>
      {isLive && <LiveDot size="sm" />}
      {parts.line}
    </span>
  );
}
