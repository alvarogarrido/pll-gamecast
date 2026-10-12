import type { ReactNode } from 'react';
import { StatePanel } from './StatePanel';

export function EmptyState({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return <StatePanel role="status" title={title} message={message} action={action} className={className} />;
}
