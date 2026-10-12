'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isApiError } from '@/api/client';

const MAX_RETRIES = 2;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        gcTime: 5 * 60_000,
        // Retry transient failures only (network, 5xx, 408/429). 404s and bad payloads fail fast.
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && (!isApiError(error) || error.retryable),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  // One client per browser session; useState keeps it stable across re-renders.
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
