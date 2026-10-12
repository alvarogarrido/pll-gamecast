'use client';

import { useRef, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface FilterChipProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The chip is the active filter: gold fill. */
  selected?: boolean;
  /** Result count shown after the label (`12`). Omit for none. */
  count?: number | string;
  children: ReactNode;
}

/**
 * A pill-shaped filter button: neutral chip surface, gold when `selected`, optional count. It does not set a selection
 * role by itself: a lone chip is a toggle button (`aria-pressed`); inside a {@link FilterChipGroup} the group decides
 * (`aria-pressed` or `role="radio"`). 40px tall for touch.
 */
export function FilterChip({ selected = false, count, className, children, type = 'button', ...rest }: FilterChipProps) {
  return (
    <button
      type={type}
      data-selected={selected ? '' : undefined}
      className={cn(
        // `relative` so the sr-only span inside is clipped by a scrolling group instead of widening the page.
        'relative inline-flex min-h-10 shrink-0 items-center gap-1 rounded-pill px-3 text-footnote font-semibold',
        selected ? 'bg-accent-gold text-text-on-accent' : 'bg-surface-chip text-text-secondary hover:text-text-primary',
        className,
      )}
      {...rest}
    >
      {children}
      {count !== undefined && (
        <span className={cn('text-caption2 tabular-nums', selected ? 'text-text-on-accent' : 'text-text-tertiary')}>
          <span className="sr-only"> </span>
          {count}
        </span>
      )}
    </button>
  );
}

export interface FilterChipItem<T extends string = string> {
  id: T;
  label: ReactNode;
  count?: number | string;
}

export type FilterChipGroupSemantics = 'pressed' | 'radio';
export type FilterChipGroupLayout = 'wrap' | 'scroll';

export interface FilterChipGroupProps<T extends string = string> {
  items: readonly FilterChipItem<T>[];
  /** Selected item id. */
  value: T;
  onValueChange: (value: T) => void;
  /** Accessible name of the group ("Filter plays"). */
  label: string;
  /**
   * `pressed` (default): a `group` of toggle buttons with `aria-pressed`, every chip in the tab order.
   * `radio`: a `radiogroup` of `role="radio"` chips with a roving tab stop; arrow keys move and select, like native radios.
   */
  semantics?: FilterChipGroupSemantics;
  /** `wrap` (default) wraps onto more lines; `scroll` keeps one swipeable row that bleeds to the 16px page gutters on phones. */
  layout?: FilterChipGroupLayout;
  className?: string;
}

const layouts: Record<FilterChipGroupLayout, string> = {
  wrap: 'flex flex-wrap gap-2',
  // Arbitrary variants: hide the scrollbar of the swipeable chip row (no token equivalent).
  scroll: '-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden',
};

/** A row of {@link FilterChip}s where exactly one is selected (single choice, like "All / Goals / Shots"). */
export function FilterChipGroup<T extends string = string>({
  items,
  value,
  onValueChange,
  label,
  semantics = 'pressed',
  layout = 'wrap',
  className,
}: FilterChipGroupProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const radio = semantics === 'radio';

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!radio) return;
    const index = items.findIndex((item) => item.id === value);
    const last = items.length - 1;
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index >= last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index <= 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    const target = items[next];
    if (!target) return;
    onValueChange(target.id);
    refs.current.get(target.id)?.focus();
  };

  return (
    <div role={radio ? 'radiogroup' : 'group'} aria-label={label} onKeyDown={onKeyDown} className={cn(layouts[layout], className)}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <FilterChip
            key={item.id}
            ref={(node) => {
              if (node) refs.current.set(item.id, node);
              else refs.current.delete(item.id);
            }}
            selected={selected}
            count={item.count}
            onClick={() => onValueChange(item.id)}
            {...(radio ? { role: 'radio', 'aria-checked': selected, tabIndex: selected ? 0 : -1 } : { 'aria-pressed': selected })}
          >
            {item.label}
          </FilterChip>
        );
      })}
    </div>
  );
}
