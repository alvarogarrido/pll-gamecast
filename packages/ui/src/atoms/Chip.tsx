import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ChipTone = 'neutral' | 'outline' | 'brand' | 'positive' | 'negative' | 'link';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  tone?: ChipTone;
  size?: ChipSize;
  /** Decorative node rendered before the label (icon, dot). */
  leading?: ReactNode;
}

const tones: Record<ChipTone, string> = {
  neutral: 'bg-surface-row-default text-text-secondary',
  outline: 'border border-border-default text-text-secondary',
  brand: 'bg-brand-primary text-text-on-brand',
  positive: 'bg-positive/15 text-positive',
  negative: 'bg-negative/15 text-negative',
  link: 'bg-link/15 text-link',
};

const sizes: Record<ChipSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
};

export function Chip({ tone = 'neutral', size = 'md', leading, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-chip',
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
