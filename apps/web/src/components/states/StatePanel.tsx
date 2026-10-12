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
      tone="row"
      role={role}
      className={cn('flex flex-col items-center gap-2 py-8 text-center', className)}
    >
      <p className={cn('text-stat-label', tone === 'error' ? 'text-negative' : 'text-text-primary')}>{title}</p>
      {message && <p className="max-w-prose text-body text-text-secondary">{message}</p>}
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
    'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-primary px-5 text-nav uppercase text-text-on-brand disabled:cursor-not-allowed disabled:opacity-40';
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
