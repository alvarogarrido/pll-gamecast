import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '../lib/cn';

export type CardTone = 'card' | 'scoreboard' | 'row' | 'rowRaised' | 'rowSunken';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /** Rendered element. Defaults to `div`. */
  as?: ElementType;
  /** Surface token: `card` (default), `scoreboard`, or one of the three inner-row surfaces. */
  tone?: CardTone;
  padding?: CardPadding;
  /** Adds the subtle 1px border. */
  bordered?: boolean;
}

const tones: Record<CardTone, string> = {
  card: 'bg-surface-card',
  scoreboard: 'bg-surface-scoreboard',
  row: 'bg-surface-row-default',
  rowRaised: 'bg-surface-row-raised',
  rowSunken: 'bg-surface-row-sunken',
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
  bordered = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-lg text-text-primary',
        tones[tone],
        paddings[padding],
        bordered && 'border border-border-subtle',
        className,
      )}
      {...rest}
    />
  );
}
