import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser / Client Components.
 * Call once per component or use the hook at src/hooks/useSupabase.ts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
