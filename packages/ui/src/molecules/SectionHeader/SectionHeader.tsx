import type { ReactNode } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';

export type SectionHeaderLevel = 2 | 3 | 4;

interface BaseProps {
  /** Section title. Rendered in `title3`, upper-case. */
  title: ReactNode;
  /** Heading level for the document outline. Default 2. */
  level?: SectionHeaderLevel;
  /** Free slot on the right (e.g. a `Chip` or a button). Wins over `href` / `onClick`. */
  action?: ReactNode;
  /** Accessible name of the chevron control. Default: "View all". Say where it goes, e.g. "View all top performers". */
  actionLabel?: string;
  className?: string;
}

export type SectionHeaderProps = BaseProps & {
  /** Renders the chevron as a plain `<a>` (no framework router: wrap with your own link through `action` if you need one). */
  href?: string;
  /** Renders the chevron as a `<button>`. */
  onClick?: () => void;
};

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

const chevronClass =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-text-primary';

/**
 * Module header: `title3` upper-case title with an optional chevron link/button (or any `action`) on the right.
 * Used at the top of every Gamecast module ("SUMMARY", "TOP PERFORMERS", "TEAM STATS").
 */
export function SectionHeader({
  title,
  level = 2,
  action,
  actionLabel = 'View all',
  href,
  onClick,
  className,
}: SectionHeaderProps) {
  const Heading = headingTags[level];
  const chevron = <Icon name="chevron-right" size={24} />;

  let trailing: ReactNode = action;
  if (!trailing && href !== undefined) {
    trailing = (
      <a href={href} aria-label={actionLabel} className={chevronClass}>
        {chevron}
      </a>
    );
  } else if (!trailing && onClick) {
    trailing = (
      <button type="button" onClick={onClick} aria-label={actionLabel} className={chevronClass}>
        {chevron}
      </button>
    );
  }

  return (
    <div className={cn('flex min-h-10 items-center justify-between gap-2', className)}>
      <Heading className="min-w-0 text-title3 font-bold uppercase text-text-primary">{title}</Heading>
      {trailing}
    </div>
  );
}
