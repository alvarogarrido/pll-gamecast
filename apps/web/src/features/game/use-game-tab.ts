'use client';

import { useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DEFAULT_TAB, isGameTab, type GameTab } from './tabs';

/**
 * Active section, stored in the query string: `?tab=gamecast|stats|plays|highlights`.
 * Read with useSearchParams (so the page stays statically exportable; callers need a <Suspense>).
 * Written with the native History API, which Next.js syncs back into useSearchParams.
 * The default tab keeps the URL clean (no param).
 */
export function useGameTab(): { tab: GameTab; setTab: (tab: GameTab) => void } {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const raw = searchParams.get('tab');
  const tab = isGameTab(raw) ? raw : DEFAULT_TAB;

  const setTab = useCallback(
    (next: GameTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_TAB) params.delete('tab');
      else params.set('tab', next);
      const query = params.toString();
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
    },
    [pathname, searchParams],
  );

  return { tab, setTab };
}
