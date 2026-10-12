'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

/** Sticky strip shown while the browser is offline. Cached data stays visible; polling resumes on reconnect. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-brand-primary px-4 py-2 text-center text-chip text-text-on-brand"
    >
      You&apos;re offline. Showing the last loaded data; updates resume when you reconnect.
    </div>
  );
}
