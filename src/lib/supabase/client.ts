import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a singleton Supabase browser client.
 *
 * All client components share the same instance so only one
 * Navigator LockManager lock would normally be requested at a time.
 * We also pass a no-op `auth.lock` to bypass the Web Locks API entirely —
 * cross-tab token synchronization is not needed in a single-tab CMS, and
 * the default exclusive lock causes "timed out waiting 10000ms" errors
 * when multiple auth operations (getSession in AuthContext + signInWithPassword
 * on the login page) are in flight simultaneously.
 */
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass Navigator LockManager — safe for single-tab apps.
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) =>
          fn(),
      },
    },
  );
  return _client;
}
