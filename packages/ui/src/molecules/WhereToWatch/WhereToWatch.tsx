import type { GameSummary } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { NetworkBadge } from '../../atoms/NetworkBadge';

export type WhereToWatchSize = 'md' | 'sm';

export interface WhereToWatchProps {
  /** `game.broadcasts`: network name and an optional watch URL. */
  broadcasts: GameSummary['broadcasts'];
  /**
   * `md` (default): each network in an outlined box, centered, wrapping; linked when the API has a URL.
   * `sm`: a tight row of small logos for a pinned bar (no boxes, no links, see `max`).
   */
  size?: WhereToWatchSize;
  /** Logo height in px. Default 16 (`md`) or 12 (`sm`). */
  height?: number;
  /** Show at most this many networks. Default: all for `md`, 3 for `sm`. */
  max?: number;
  className?: string;
}

/** The networks a game airs on, as logos (or short text chips for networks without artwork). Renders nothing without broadcasts. */
export function WhereToWatch({ broadcasts, size = 'md', height, max, className }: WhereToWatchProps) {
  const compact = size === 'sm';
  const shown = broadcasts.slice(0, max ?? (compact ? 3 : broadcasts.length));
  if (shown.length === 0) return null;

  if (compact) {
    return (
      <ul aria-label="Where to watch" className={cn('flex items-center gap-1', className)}>
        {shown.map((b) => (
          <li key={b.network}>
            <NetworkBadge network={b.network} height={height ?? 12} chipSize="sm" />
          </li>
        ))}
      </ul>
    );
  }

  const boxed = 'rounded-xs border border-border-default px-2 py-1';
  return (
    <ul aria-label="Where to watch" className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {shown.map((b) => (
        <li key={b.network} className="flex items-center">
          {b.url ? (
            <a href={b.url} target="_blank" rel="noreferrer" aria-label={`Watch on ${b.network}`} className={boxed}>
              <NetworkBadge network={b.network} height={height ?? 16} />
            </a>
          ) : (
            <span className={boxed}>
              <NetworkBadge network={b.network} height={height ?? 16} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
