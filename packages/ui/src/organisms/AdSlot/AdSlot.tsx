import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export type AdSlotSize = 'skyscraper' | 'rectangle' | 'mobile-bar';

export interface AdSlotProps {
  /**
   * `skyscraper` 160×600 (desktop outer columns), `rectangle` 300×250 (medium rectangle), `mobile-bar` 320×50
   * (mobile bottom bar).
   */
  size: AdSlotSize;
  /** Stick to the bottom edge of the viewport (for `mobile-bar`). The page must leave room for it. */
  pinned?: boolean;
  className?: string;
}

/** IAB standard sizes in px. They are fixed by the ad format, not by our spacing scale, so they live in `style`. */
const dimensions: Record<AdSlotSize, { width: number; height: number }> = {
  skyscraper: { width: 160, height: 600 },
  rectangle: { width: 300, height: 250 },
  'mobile-bar': { width: 320, height: 50 },
};

/**
 * Neutral placeholder for an ad (PRD: ads may go in the outer columns on desktop and in a bottom bar on mobile).
 * Labelled "Advertisement"; loads no external script. A real ad tag would replace the inner box.
 */
export function AdSlot({ size, pinned = false, className }: AdSlotProps) {
  const { width, height } = dimensions[size];
  const style: CSSProperties = { width, height };
  const compact = size === 'mobile-bar';
  return (
    <aside
      aria-label="Advertisement"
      data-size={size}
      className={cn(
        pinned && 'sticky bottom-0 z-10 flex justify-center bg-surface-page',
        className,
      )}
    >
      <div
        style={style}
        className={cn(
          'relative flex max-w-full shrink-0 items-center justify-center overflow-hidden rounded-xs border border-dashed border-border-default bg-surface-card text-text-tertiary',
        )}
      >
        <span className={cn('uppercase tracking-wide', compact ? 'text-caption2' : 'absolute left-2 top-2 text-caption2')}>
          Advertisement
        </span>
        {!compact && (
          <span aria-hidden="true" className="text-caption text-text-disabled">
            {width}×{height}
          </span>
        )}
      </div>
    </aside>
  );
}
