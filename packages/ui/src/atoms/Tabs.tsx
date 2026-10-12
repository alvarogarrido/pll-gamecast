'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export type TabsSize = 'sm' | 'md';

export interface TabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Accessible name of the tablist (required: there is no visible label). */
  ariaLabel: string;
  /**
   * Prefix for the generated ids. Pass the same value to `tabPanelProps` so panels can be wired to tabs.
   * Defaults to a React-generated id.
   */
  idBase?: string;
  /** Stretch segments to fill the container width. */
  fullWidth?: boolean;
  size?: TabsSize;
  className?: string;
}

export const tabDomId = (idBase: string, value: string) => `${idBase}-tab-${value}`;
export const tabPanelDomId = (idBase: string, value: string) => `${idBase}-panel-${value}`;

/** Props for the panel element that belongs to a tab: `<div {...tabPanelProps(idBase, value)}>`. */
export const tabPanelProps = (idBase: string, value: string) =>
  ({
    role: 'tabpanel' as const,
    id: tabPanelDomId(idBase, value),
    'aria-labelledby': tabDomId(idBase, value),
    tabIndex: 0,
  }) as const;

const sizes: Record<TabsSize, string> = {
  sm: 'min-h-8 px-3',
  md: 'min-h-10 px-2 sm:px-4',
};

/**
 * PLL-style segmented control: dark track, rounded active pill.
 * WAI-ARIA tabs pattern: roving tabindex, ArrowLeft/Right (+Up/Down) move and select, Home/End jump.
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onValueChange,
  ariaLabel,
  idBase,
  fullWidth = false,
  size = 'md',
  className,
}: TabsProps<T>) {
  const generated = useId();
  const base = idBase ?? generated;
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const select = (item: TabItem<T>) => {
    onValueChange(item.value);
    refs.current.get(item.value)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled);
    if (enabled.length === 0) return;
    const current = enabled.findIndex((i) => i.value === value);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % enabled.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = enabled.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = enabled[next];
    if (target) select(target);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-1 overflow-x-auto rounded-pill bg-surface-track p-1 [scrollbar-width:none]',
        fullWidth ? 'w-full' : 'w-fit max-w-full',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) refs.current.set(item.value, el);
              else refs.current.delete(item.value);
            }}
            type="button"
            role="tab"
            id={tabDomId(base, item.value)}
            aria-selected={selected}
            aria-controls={tabPanelDomId(base, item.value)}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-pill text-footnote font-semibold uppercase transition-colors sm:text-subhead',
              'disabled:cursor-not-allowed disabled:opacity-40',
              sizes[size],
              fullWidth && 'flex-1',
              selected
                ? 'bg-surface-selected text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
