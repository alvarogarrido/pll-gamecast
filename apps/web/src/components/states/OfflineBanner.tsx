'use client';

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';

/** CSS variable holding the banner's height (0px when hidden), so other sticky bars can sit below it. */
export const OFFLINE_BANNER_HEIGHT_VAR = '--offline-banner-h';

/** Sticky strip shown while the browser is offline. Cached data stays visible; polling resumes on reconnect. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const ref = useRef<HTMLDivElement>(null);

  // Publish the height on <html> so the game page's sticky header can start below the banner.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el) {
      root.style.removeProperty(OFFLINE_BANNER_HEIGHT_VAR);
      return;
    }
    const publish = () => root.style.setProperty(OFFLINE_BANNER_HEIGHT_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(OFFLINE_BANNER_HEIGHT_VAR);
    };
  }, [online]);

  if (online) return null;
  return (
    <div
      ref={ref}
      role="status"
      className="sticky top-0 z-50 bg-accent-gold px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] text-center text-footnote font-semibold text-text-on-accent"
    >
      You&apos;re offline. Showing the last loaded data; updates resume when you reconnect.
    </div>
  );
}
