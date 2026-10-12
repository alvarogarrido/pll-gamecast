import type { ReactNode } from 'react';
import { StatePanel } from './StatePanel';

export function EmptyState({
  label,
  title,
  message,
  action,
  className,
}: {
  label?: string;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return <StatePanel role="status" label={label} title={title} message={message} action={action} className={className} />;
}
