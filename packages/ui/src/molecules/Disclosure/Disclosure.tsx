'use client';

import { useId, useState, type ReactNode } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';

export type DisclosureHeadingLevel = 2 | 3 | 4 | 5;

export interface DisclosureProps {
  /** Always-visible title inside the toggle button ("Q3", "2nd Quarter"). */
  title: ReactNode;
  /** Right-aligned summary inside the button (a score "7-5", a play count). */
  summary?: ReactNode;
  children: ReactNode;
  /** Initial state when uncontrolled. Default closed. */
  defaultOpen?: boolean;
  /** Controlled state. Pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Heading level wrapping the button, to keep the outline right. Default 3. */
  headingLevel?: DisclosureHeadingLevel;
  /** Keep the panel mounted while closed (hidden). Default false: closed content is not rendered. */
  keepMounted?: boolean;
  className?: string;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' } as const;

/**
 * Accordion section (WAI-ARIA disclosure): a heading containing a button with `aria-expanded` / `aria-controls`,
 * and a labelled region. Space/Enter toggle it natively. Stack several for play-by-play periods; each opens on its own.
 */
export function Disclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  headingLevel = 3,
  keepMounted = false,
  className,
}: DisclosureProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const baseId = useId();
  const buttonId = `${baseId}-button`;
  const panelId = `${baseId}-panel`;
  const Heading = headingTags[headingLevel];

  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn('border-b border-border-hairline', className)} data-state={open ? 'open' : 'closed'}>
      <Heading>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-headline text-text-primary hover:bg-surface-raised"
        >
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {summary !== undefined && <span className="shrink-0 text-footnote tabular-nums text-text-secondary">{summary}</span>}
          <Icon
            name="chevron-down"
            size={20}
            className={cn('shrink-0 text-text-secondary motion-safe:transition-transform', open && 'rotate-180')}
          />
        </button>
      </Heading>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
        {(open || keepMounted) && children}
      </div>
    </div>
  );
}
