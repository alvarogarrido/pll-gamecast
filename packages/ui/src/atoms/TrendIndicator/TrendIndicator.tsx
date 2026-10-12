import { Icon, type IconName } from '@pll/icons';
import { cn } from '../../lib/cn';

export type TrendDirection = 'up' | 'down' | 'equal';
export type TrendIndicatorSize = 'sm' | 'md';

export interface TrendIndicatorProps {
  /** Signed movement (rank, RPI, a stat). Positive = up, negative = down, `0` / `null` = equal. Ignored when `direction` is set. */
  change?: number | null;
  /** Force the direction (e.g. when "down" is the good outcome, pass `direction` and read the color from context). */
  direction?: TrendDirection;
  /** Also print the magnitude next to the arrow (`2`). Off by default: arrow only. */
  showValue?: boolean;
  size?: TrendIndicatorSize;
  /** Hide the "up"/"down"/"unchanged" text for assistive tech when the surrounding text already says it. */
  decorative?: boolean;
  className?: string;
}

const config: Record<TrendDirection, { icon: IconName; color: string; word: string }> = {
  up: { icon: 'trend-up', color: 'text-status-positive', word: 'up' },
  down: { icon: 'trend-down', color: 'text-status-negative', word: 'down' },
  equal: { icon: 'trend-equal', color: 'text-text-tertiary', word: 'unchanged' },
};

const iconSize: Record<TrendIndicatorSize, number> = { sm: 12, md: 16 };
const textSize: Record<TrendIndicatorSize, string> = { sm: 'text-caption2', md: 'text-caption' };

function directionOf(change: number | null | undefined): TrendDirection {
  if (change === null || change === undefined || change === 0) return 'equal';
  return change > 0 ? 'up' : 'down';
}

/** Up / down / equal arrow in status colors, for rank and RPI movement. */
export function TrendIndicator({
  change = null,
  direction,
  showValue = false,
  size = 'md',
  decorative = false,
  className,
}: TrendIndicatorProps) {
  const dir = direction ?? directionOf(change);
  const { icon, color, word } = config[dir];
  const magnitude = change === null || change === undefined ? null : Math.abs(change);
  const spoken = dir !== 'equal' && magnitude ? `${word} ${magnitude}` : word;

  return (
    <span
      data-direction={dir}
      className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums', color, textSize[size], className)}
    >
      <Icon name={icon} size={iconSize[size]} />
      {showValue && magnitude !== null && dir !== 'equal' && <span aria-hidden={decorative || undefined}>{magnitude}</span>}
      {!decorative && <span className="sr-only">{spoken}</span>}
    </span>
  );
}
