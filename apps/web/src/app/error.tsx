'use client';

import { ErrorState } from '@/components/states/ErrorState';

/** Last-resort boundary for render errors (data errors are handled per module by QueryBoundary). */
export default function GlobalRouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-12 md:px-6">
      <ErrorState error={error} onRetry={reset} />
    </main>
  );
}
