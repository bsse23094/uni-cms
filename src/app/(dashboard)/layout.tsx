// Middleware (src/middleware.ts) already verifies authentication for all /dashboard/* routes
// and redirects unauthenticated visitors to /login before the layout ever runs.
// Repeating auth.getUser() here adds a redundant round-trip to Supabase auth on every
// page navigation — removed for performance.
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';

function DashboardShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-56 border-r border-border/60 p-4 lg:block">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-border/60 px-4 py-3 sm:px-6">
          <Skeleton className="h-8 w-56" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-72" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
    }
  }, [loading, profile, pathname, router]);

  if (loading || !profile) {
    return <DashboardShellSkeleton />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
