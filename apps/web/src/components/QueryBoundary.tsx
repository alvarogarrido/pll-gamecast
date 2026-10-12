'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { EmptyState } from './states/EmptyState';
import { ErrorState } from './states/ErrorState';
import { StatePanel } from './states/StatePanel';

/**
 * Renders the right UI for every state of a query:
 *   loading -> `loading` skeleton | offline & nothing cached -> offline panel | failed -> error panel (+retry)
 *   empty -> empty panel | data -> children. A failed background refresh keeps the data and adds a notice.
 */
export function QueryBoundary<T>({
  query,
  loading,
  isEmpty,
  empty,
  children,
  className,
}: {
  query: UseQueryResult<T>;
  loading: ReactNode;
  /** Return true when the loaded data has nothing to show. */
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; message?: string };
  children: (data: T) => ReactNode;
  className?: string;
}) {
  const online = useOnlineStatus();
  const { data, isPending, isError, error, fetchStatus, refetch, isRefetching } = query;

  if (data === undefined) {
    if (isError) {
      return <ErrorState error={error} onRetry={() => void refetch()} retrying={isRefetching} className={className} />;
    }
    if (isPending && (fetchStatus === 'paused' || !online)) {
      return (
        <StatePanel
          role="status"
          title="You're offline"
          message="We'll load this as soon as you're back online."
          className={className}
        />
      );
    }
    return <>{loading}</>;
  }

  if (isEmpty?.(data)) {
    return <EmptyState title={empty?.title ?? 'Nothing here yet'} message={empty?.message} className={className} />;
  }

  return (
    <>
      {isError && (
        <p role="status" className="mb-2 text-caption text-text-tertiary">
          Couldn&apos;t refresh. Showing the last update.
        </p>
      )}
      {children(data)}
    </>
  );
}
