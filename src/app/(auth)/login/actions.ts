'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server Action: sign in with email + password.
 *
 * Using a Server Action (instead of browser-side signInWithPassword) ensures
 * that @supabase/ssr's `setAll` cookie hook writes the session tokens into the
 * HTTP *response* headers, so the middleware and every subsequent server request
 * automatically receives them in `request.cookies`.
 *
 * If a browser-client sign-in is used instead, the tokens land in document.cookie
 * but the middleware's request.cookies snapshot (taken at the edge before JS runs)
 * may not include them, causing the middleware to redirect back to /login.
 */
export async function signInAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | never> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // redirect() throws internally — must NOT be inside try/catch
  redirect('/dashboard');
}
