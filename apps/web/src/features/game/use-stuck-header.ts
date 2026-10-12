'use client';

import { useEffect, useState, type RefObject } from 'react';
import { OFFLINE_BANNER_HEIGHT_VAR } from '@/components/states/OfflineBanner';
import { useOnlineStatus } from '@/hooks/use-online-status';

/** CSS variable on the page root: height of the minimized header bar (safe area included). */
export const MINI_HEADER_HEIGHT_VAR = '--mini-header-h';

/**
 * True while the full header has scrolled up behind the pinned bar, i.e. when the minimized header should show.
 *
 * - An IntersectionObserver watches the full header; its root margin is pulled down by the height of the minimized bar
 *   (and of the offline banner), so the bar appears at exactly the moment the header passes underneath it.
 * - The bar height is measured (ResizeObserver) and published as `--mini-header-h` on `root`, which the sticky section
 *   selector uses as its `top`, so the selector always sits right under the bar. Nothing here changes layout:
 *   the bar is out of flow (see GameScreen), the selector's sticky offset does not move anything until it sticks.
 */
export function useStuckHeader(
  root: RefObject<HTMLElement | null>,
  header: RefObject<HTMLElement | null>,
  mini: RefObject<HTMLElement | null>,
): boolean {
  const [stuck, setStuck] = useState(false);
  const [miniHeight, setMiniHeight] = useState(0);
  const online = useOnlineStatus();

  useEffect(() => {
    const el = mini.current;
    const rootEl = root.current;
    if (!el || !rootEl) return;
    const measure = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      rootEl.style.setProperty(MINI_HEADER_HEIGHT_VAR, `${height}px`);
      setMiniHeight(height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [root, mini]);

  useEffect(() => {
    const target = header.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const banner = parseFloat(document.documentElement.style.getPropertyValue(OFFLINE_BANNER_HEIGHT_VAR)) || 0;
    const topMargin = Math.ceil(miniHeight + banner);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const rootTop = entry.rootBounds?.top ?? 0;
        setStuck(!entry.isIntersecting && entry.boundingClientRect.top < rootTop);
      },
      { rootMargin: `-${topMargin}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [header, miniHeight, online]);

  return stuck;
}
