import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/** Only allow redirects to internal paths to prevent open-redirect attacks */
function sanitizeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard';
  // Must be a relative path starting with / and not // (protocol-relative)
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) {
    // Additionally restrict to known path prefixes
    const allowed = ['/dashboard', '/profile', '/login'];
    if (allowed.some((prefix) => next === prefix || next.startsWith(prefix + '/'))) {
      return next;
    }
  }
  return '/dashboard';
}

/**
 * Handles the OAuth / magic-link / email-confirmation callback from Supabase Auth.
 *
 * Two flows arrive here:
 *   1. PKCE / OAuth — Supabase redirects with `?code=<auth_code>`
 *   2. Email confirmation — Supabase redirects with `?token_hash=<hash>&type=<type>`
 *      (signup, email_change, recovery, invite, etc.)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get('next'));

  const supabase = await createClient();

  // Flow 1: PKCE / OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Flow 2: Email OTP verification (signup confirmation, password recovery, etc.)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      // After email confirmation, send to login with a success message
      const redirectTo = type === 'signup' || type === 'invite'
        ? '/login?verified=true'
        : next;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth failed – redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
