import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions (reads/writes cookies via next/headers).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
            );
          } catch {
            // Server Component – cookies are read-only after response is sent
          }
        },
      },
    },
  );
}

/**
 * Elevated server client using the service role key.
 * NEVER import this in Client Components or expose to the browser.
 * Use only for admin-level server-side operations (e.g. user creation).
 */
export async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
