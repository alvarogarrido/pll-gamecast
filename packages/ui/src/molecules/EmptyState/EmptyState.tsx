import type { ReactNode } from 'react';
import { Icon, type IconName } from '@pll/icons';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  /** What is missing and, when useful, why or when it appears: "Rosters appear closer to game time." */
  message: ReactNode;
  /** Optional bold first line ("No injuries reported"). */
  title?: ReactNode;
  /** Decorative icon above the text. Default `info`; pass `null` for text only. */
  icon?: IconName | null;
  /** Optional action (a button) under the message. */
  action?: ReactNode;
  className?: string;
}

/**
 * Small inline "no data yet" message for a module that loaded fine but has nothing to show
 * (no plays yet, no injuries, stats before kickoff). Not an error: use the app's error state for failures.
 */
export function EmptyState({ message, title, icon = 'info', action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-6 text-center', className)}>
      {icon && <Icon name={icon} size={24} className="text-text-tertiary" />}
      {title && <p className="text-subhead font-semibold text-text-secondary">{title}</p>}
      <p className="max-w-xs text-footnote text-text-tertiary">{message}</p>
      {action}
    </div>
  );
}
