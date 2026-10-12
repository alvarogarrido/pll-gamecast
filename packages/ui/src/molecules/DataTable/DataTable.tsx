'use client';

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';

/*
 * DataTable primitives. Compose them like the native elements:
 *
 *   <DataTable caption="Duke box score">
 *     <DataTableHeader>
 *       <DataTableRow zebra={false}>
 *         <DataTableHeadCell sticky>Player</DataTableHeadCell>
 *         <DataTableHeadCell numeric sort="desc" onSort={...}>G</DataTableHeadCell>
 *       </DataTableRow>
 *     </DataTableHeader>
 *     <DataTableBody>
 *       <DataTableRow><DataTableCell sticky>B. Dowd</DataTableCell><DataTableCell numeric>3</DataTableCell></DataTableRow>
 *     </DataTableBody>
 *   </DataTable>
 *
 * Sticky cells use `bg-inherit`, so they take the row's (zebra) background and hide what scrolls beneath them.
 * Sorting is controlled: the table never reorders rows, the caller sorts the data and passes `sort` / `onSort`.
 */

export interface DataTableProps extends Omit<ComponentPropsWithoutRef<'table'>, 'children'> {
  /** Accessible name of the table and of its scroll region (shown to screen readers only). */
  caption: string;
  children: React.ReactNode;
  /** Class names for the scrolling wrapper (the `table` itself takes `className`). */
  wrapperClassName?: string;
}

/**
 * Horizontally scrollable table inside a focusable region. Shows a fade at the edge that has more content, and
 * flags `data-scrolled` so sticky cells can draw a divider once the content has moved under them.
 */
export function DataTable({ caption, children, className, wrapperClassName, ...rest }: DataTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    measure();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div
      className={cn('group/table relative overflow-hidden rounded-md bg-surface-card', wrapperClassName)}
      data-scrolled={edges.start ? '' : undefined}
    >
      <div
        ref={scrollRef}
        role="region"
        aria-label={caption}
        tabIndex={0}
        onScroll={measure}
        className="overflow-x-auto overscroll-x-contain"
      >
        <table className={cn('w-full min-w-max border-separate border-spacing-0 text-footnote', className)} {...rest}>
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      {/* Scroll fades: decorative, never intercept the pointer. */}
      <span
        aria-hidden="true"
        data-fade="end"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-surface-card to-transparent transition-opacity',
          edges.end ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}

export function DataTableHeader({ className, ...rest }: ComponentPropsWithoutRef<'thead'>) {
  return <thead className={className} {...rest} />;
}

export function DataTableBody({ className, ...rest }: ComponentPropsWithoutRef<'tbody'>) {
  return <tbody className={className} {...rest} />;
}

export function DataTableFooter({ className, ...rest }: ComponentPropsWithoutRef<'tfoot'>) {
  return <tfoot className={cn('font-semibold', className)} {...rest} />;
}

export interface DataTableRowProps extends ComponentPropsWithoutRef<'tr'> {
  /** Alternate row background (`surface.track` on even rows). On by default; turn off for header rows. */
  zebra?: boolean;
}

export function DataTableRow({ zebra = true, className, ...rest }: DataTableRowProps) {
  return <tr className={cn('bg-surface-card', zebra && 'even:bg-surface-track', className)} {...rest} />;
}

interface CellBase {
  /** Right-align with tabular figures. For numbers and anything that should line up on the digit. */
  numeric?: boolean;
  /** Pin to the left while the rest scrolls (use on the first cell of every row, header included). */
  sticky?: boolean;
}

const alignment = (numeric?: boolean) => (numeric ? 'text-right tabular-nums' : 'text-left');
const stickyClass =
  'sticky left-0 z-10 border-r border-r-transparent bg-inherit group-data-scrolled/table:border-r-border-default';

export type DataTableCellProps = ComponentPropsWithoutRef<'td'> & CellBase;

export function DataTableCell({ numeric, sticky, className, ...rest }: DataTableCellProps) {
  return (
    <td
      className={cn(
        'whitespace-nowrap border-b border-border-hairline px-3 py-2 text-text-primary',
        alignment(numeric),
        sticky && stickyClass,
        className,
      )}
      {...rest}
    />
  );
}

export type SortDirection = 'asc' | 'desc';

export type DataTableHeadCellProps = ComponentPropsWithoutRef<'th'> &
  CellBase & {
    /** Current sort of this column. `none` = sortable but not the active column. Leave undefined for non-sortable columns. */
    sort?: SortDirection | 'none';
    /** Click handler that makes the header sortable (renders a button). The caller re-sorts its rows. */
    onSort?: () => void;
  };

const ariaSort = { asc: 'ascending', desc: 'descending', none: 'none' } as const;

/** Column header. With `onSort` it becomes a button and sets `aria-sort`. */
export function DataTableHeadCell({
  numeric,
  sticky,
  sort,
  onSort,
  className,
  children,
  scope = 'col',
  ...rest
}: DataTableHeadCellProps) {
  const sortable = onSort !== undefined;
  const state = sort ?? 'none';
  return (
    <th
      scope={scope}
      aria-sort={sortable ? ariaSort[state] : undefined}
      className={cn(
        'whitespace-nowrap border-b border-border-default px-3 py-2 text-caption font-medium text-text-secondary',
        alignment(numeric),
        sticky && stickyClass,
        className,
      )}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            'inline-flex items-center gap-1 rounded-xs hover:text-text-primary',
            numeric && 'flex-row-reverse',
            state !== 'none' && 'text-text-primary',
          )}
        >
          {children}
          <Icon
            name={state === 'asc' ? 'arrow-up' : state === 'desc' ? 'arrow-down' : 'sort'}
            size={14}
            className={state === 'none' ? 'opacity-60' : undefined}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}
