'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';

export interface CarouselRailProps {
  /** Accessible name of the scrolling region (also the prev/next buttons' context). */
  label: string;
  /** `<li>`s. Give each `snap-start shrink-0` and a width (`w-64`). */
  children: ReactNode;
  className?: string;
}

export interface CarouselControlsProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** What is being paged, for the button names: "Previous articles" / "Next articles". */
  label: string;
}

/** Prev / next buttons for a {@link CarouselRail}; kept separate so a section header can host them. */
export function CarouselControls({ canPrev, canNext, onPrev, onNext, label }: CarouselControlsProps) {
  const button =
    'inline-flex size-10 items-center justify-center rounded-full bg-surface-track text-text-primary enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-text-disabled';
  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={onPrev} disabled={!canPrev} aria-label={`Previous ${label}`} className={button}>
        <Icon name="chevron-left" size={20} />
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} aria-label={`Next ${label}`} className={button}>
        <Icon name="chevron-right" size={20} />
      </button>
    </div>
  );
}

/**
 * State of a horizontal scroll-snap carousel: the ref for the {@link CarouselRail}, its scroll handler and the prev/next
 * state, so the owning section can put {@link CarouselControls} wherever it wants (usually its header).
 */
export function useCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const canPrev = el.scrollLeft > 1;
    const canNext = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.canPrev === canPrev && prev.canNext === canNext ? prev : { canPrev, canNext }));
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  return { ref, ...edges, onScroll: measure, prev: () => scrollByPage(-1), next: () => scrollByPage(1) };
}

/** The scrolling region of a carousel: a focusable, named horizontal scroll-snap list. Pass the object from {@link useCarousel}. */
export function CarouselRail({
  label,
  children,
  carousel,
  className,
}: CarouselRailProps & { carousel: ReturnType<typeof useCarousel> }) {
  return (
    <div
      ref={carousel.ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      onScroll={carousel.onScroll}
      className={cn(
        'overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none]',
        className,
      )}
    >
      <ul className="flex snap-x snap-mandatory gap-3">{children}</ul>
    </div>
  );
}

export interface CarouselProps extends CarouselRailProps {
  /** Noun for the button names ("articles" gives "Previous articles"). Defaults to `label`. */
  controlsLabel?: string;
}

/**
 * Self-contained carousel: prev/next buttons on the right above the scroll-snap rail. Use it where there is no section
 * header to host the buttons; otherwise compose {@link useCarousel}, {@link CarouselRail} and {@link CarouselControls}.
 * The buttons stay in place and disable at the ends, so the layout does not jump.
 */
export function Carousel({ label, controlsLabel = label, children, className }: CarouselProps) {
  const carousel = useCarousel();
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex justify-end">
        <CarouselControls canPrev={carousel.canPrev} canNext={carousel.canNext} onPrev={carousel.prev} onNext={carousel.next} label={controlsLabel} />
      </div>
      <CarouselRail label={label} carousel={carousel}>
        {children}
      </CarouselRail>
    </div>
  );
}
