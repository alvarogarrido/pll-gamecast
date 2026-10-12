import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
  /** `text` = one line, `rect` = block (size it with className), `circle` = avatar/logo. */
  variant?: SkeletonVariant;
}

const variants: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-sm',
  rect: 'rounded-md',
  circle: 'size-10 rounded-full',
};

/** Decorative placeholder. Wrap groups in a region with aria-busy / a visually hidden "Loading" label. */
export function Skeleton({ variant = 'text', className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-surface-row-default motion-safe:animate-pulse', variants[variant], className)}
      {...rest}
    />
  );
}
