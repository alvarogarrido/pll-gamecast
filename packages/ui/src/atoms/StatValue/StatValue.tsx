import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';

export type StatValueSize = 'sm' | 'md';

export interface StatValueProps extends ComponentPropsWithoutRef<'span'> {
  /** Leader of the comparison: draws the `surface.chip` pill behind the value. Others keep the same box, so columns align. */
  highlighted?: boolean;
  size?: StatValueSize;
}

const sizes: Record<StatValueSize, string> = {
  sm: 'min-w-8 px-2 text-footnote',
  md: 'min-w-10 px-2 py-0.5 text-subhead',
};

/**
 * A stat number in a comparison row. The leading side gets a rounded chip (the Figma "Team Stats" value);
 * the other side renders the same box without a background. Numbers are tabular so columns line up.
 * Pass an already formatted string (see `formatStat` in `lib/format`).
 */
export function StatValue({ highlighted = false, size = 'md', className, children, ...rest }: StatValueProps) {
  return (
    <span
      data-highlighted={highlighted ? '' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xs text-center tabular-nums text-text-primary',
        sizes[size],
        highlighted ? 'bg-surface-chip font-semibold' : 'font-normal',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
