import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '../../lib/cn';

export type CardTone = 'card' | 'raised' | 'track';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /** Rendered element. Defaults to `div`. */
  as?: ElementType;
  /** Surface token: `card` (surface.card, default), or `raised` / `track` for rows nested inside a card. */
  tone?: CardTone;
  padding?: CardPadding;
  /** The 1px border.default. On by default (cards are flat and bordered); turn off for nested rows. */
  bordered?: boolean;
}

const tones: Record<CardTone, string> = {
  card: 'bg-surface-card',
  raised: 'bg-surface-raised',
  track: 'bg-surface-track',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-4 md:p-6',
};

export function Card({
  as: Component = 'div',
  tone = 'card',
  padding = 'md',
  bordered = true,
  className,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-md text-text-primary',
        tones[tone],
        paddings[padding],
        bordered && 'border border-border-default',
        className,
      )}
      {...rest}
    />
  );
}
