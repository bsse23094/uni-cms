'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 5 minutes — avoids refetching on every quick navigation.
            // Most CMS data (courses, users, enrollments) doesn't change every minute.
            staleTime: 5 * 60 * 1000,      // 5 minutes
            gcTime: 10 * 60 * 1000,        // 10 minutes
            retry: 1,
            // Re-enable so students pick up new assignments/announcements when they
            // switch back to the CMS tab after a faculty member has added content.
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
