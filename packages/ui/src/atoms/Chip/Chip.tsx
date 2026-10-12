import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ChipTone = 'neutral' | 'outline' | 'accent' | 'gold' | 'live' | 'positive' | 'negative' | 'link';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  tone?: ChipTone;
  size?: ChipSize;
  /** Decorative node rendered before the label (icon, dot). */
  leading?: ReactNode;
}

const tones: Record<ChipTone, string> = {
  neutral: 'bg-surface-chip text-text-secondary',
  outline: 'border border-border-default text-text-secondary',
  accent: 'bg-accent-gold text-text-on-accent',
  gold: 'bg-gold-tint text-accent-gold',
  live: 'bg-live-tint text-status-live',
  positive: 'bg-live-tint text-status-positive',
  negative: 'bg-negative-tint text-status-negative',
  link: 'bg-link/10 text-link',
};

const sizes: Record<ChipSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
};

export function Chip({ tone = 'neutral', size = 'md', leading, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill text-caption',
        tones[tone],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
    </span>
  );
}
