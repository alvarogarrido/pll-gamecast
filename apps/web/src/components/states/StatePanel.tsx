import type { ReactNode } from 'react';
import { Card, cn } from '@pll/ui';

/** Shared layout for empty / error / offline panels. */
export function StatePanel({
  title,
  message,
  action,
  tone = 'default',
  role,
  className,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  tone?: 'default' | 'error';
  role?: 'status' | 'alert';
  className?: string;
}) {
  return (
    <Card
      role={role}
      className={cn('flex flex-col items-center gap-2 py-8 text-center', className)}
    >
      <p className={cn('text-headline', tone === 'error' ? 'text-status-negative' : 'text-text-primary')}>{title}</p>
      {message && <p className="max-w-prose text-callout text-text-secondary">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function ActionButton({
  children,
  onClick,
  href,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className =
    'inline-flex min-h-11 items-center justify-center rounded-pill bg-accent-gold px-5 text-footnote font-semibold uppercase text-text-on-accent disabled:cursor-not-allowed disabled:opacity-40';
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn(className, 'cursor-pointer')}>
      {children}
    </button>
  );
}
