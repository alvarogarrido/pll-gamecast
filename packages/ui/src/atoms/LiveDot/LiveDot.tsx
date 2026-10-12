import { cn } from '../../lib/cn';

export type LiveDotSize = 'sm' | 'md';

export interface LiveDotProps {
  size?: LiveDotSize;
  /** Pulse animation (respects reduced motion). On by default. */
  pulse?: boolean;
  className?: string;
}

const sizes: Record<LiveDotSize, string> = { sm: 'size-1.5', md: 'size-2' };

/**
 * The green "live" dot (status.live). Decorative: always pair it with text such as "LIVE".
 * Used by `StatusPill` and `GameStatusLabel`.
 */
export function LiveDot({ size = 'md', pulse = true, className }: LiveDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 rounded-full bg-status-live',
        sizes[size],
        pulse && 'motion-safe:animate-live-pulse',
        className,
      )}
    />
  );
}
