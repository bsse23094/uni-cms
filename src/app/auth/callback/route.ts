import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Only allow redirects to internal paths to prevent open-redirect attacks */
function sanitizeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard';
  // Must be a relative path starting with / and not // (protocol-relative)
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) {
    // Additionally restrict to known path prefixes
    const allowed = ['/dashboard', '/profile'];
    if (allowed.some((prefix) => next === prefix || next.startsWith(prefix + '/'))) {
      return next;
    }
  }
  return '/dashboard';
}

/**
 * Handles the OAuth / magic-link callback from Supabase Auth.
 * Supabase redirects here after email confirmation.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed – redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
