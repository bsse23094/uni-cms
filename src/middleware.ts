import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

// Routes that publicly accessible (no auth required)
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback'];

/** Prevent open-redirect: only allow safe internal redirect paths */
export function sanitizeNextPath(next: string | null): string {
  if (!next) return '/dashboard';
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) {
    return next;
  }
  return '/dashboard';
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // @supabase/ssr v0.3.x uses singular get/set/remove
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]);
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set(name, '');
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 } as Parameters<typeof supabaseResponse.cookies.set>[2]);
        },
      },
    },
  );

  // Refresh session — must be called before any getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes without auth
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    // Redirect logged-in users away from auth pages
    if (user && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch role from profiles using service role to bypass RLS in middleware context.
  // The anon key + authenticated RLS sometimes fails to resolve auth.uid() in the
  // Edge Runtime, returning null and incorrectly triggering the deactivation redirect.
  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, is_active, deleted_at')
    .eq('id', user.id)
    .single();

  // Deactivated / soft-deleted account
  if (!profile || !profile.is_active || profile.deleted_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=account_deactivated', request.url));
  }

  const role = profile.role as UserRole;

  // Route-level role enforcement
  if (pathname.startsWith('/dashboard/users') && !['super_admin', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    pathname.startsWith('/dashboard/announcements/new') &&
    role === 'student'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
