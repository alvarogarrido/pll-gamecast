'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Card, Skeleton } from '@pll/ui';
import { QueryBoundary } from '@/components/QueryBoundary';

/**
 * Stand-in for a PRD module that is not built yet. It already goes through the real data layer, so
 * loading / error / offline / empty states are exercised end to end. Replace with the real organism.
 */
export function ModulePlaceholder<T>({
  name,
  endpoint,
  query,
  isEmpty,
  summarize,
}: {
  name: string;
  endpoint: string;
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  summarize: (data: T) => ReactNode;
}) {
  return (
    <Card as="section" aria-label={name} bordered className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-h2">{name}</h2>
        <code className="text-chip text-text-tertiary">{endpoint}</code>
      </header>
      <QueryBoundary
        query={query}
        isEmpty={isEmpty}
        empty={{ title: 'No data yet', message: 'This will fill in once the game gets going.' }}
        loading={
          <div aria-busy="true" aria-label={`Loading ${name}`} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton variant="rect" className="h-24 w-full" />
          </div>
        }
      >
        {(data) => <p className="text-body text-text-secondary">{summarize(data)}</p>}
      </QueryBoundary>
    </Card>
  );
}
