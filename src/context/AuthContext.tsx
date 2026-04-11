'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Stable client reference — createClient() must only be called once per mount.
  // Calling it on every render creates competing instances that break cookie sync.
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPathRef = useRef<string | null>(null);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const nextProfile = data ?? null;
      if (!nextProfile || !nextProfile.is_active || nextProfile.deleted_at) {
        setProfile(null);
        return null;
      }

      setProfile(nextProfile);
      return nextProfile;
    },
    [supabase],
  );

  const syncSessionFromCookies = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let nextUser = session?.user ?? null;

      // Fallback for cases where session cache lags behind server-set auth cookies.
      if (!nextUser) {
        const {
          data: { user: fallbackUser },
        } = await supabase.auth.getUser();
        nextUser = fallbackUser ?? null;
      }

      setUser(nextUser);

      if (nextUser) {
        const nextProfile = await fetchProfile(nextUser.id);
        if (!nextProfile) {
          await supabase.auth.signOut();
          queryClient.clear();
          setUser(null);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfile, queryClient]);

  useEffect(() => {
    syncSessionFromCookies();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          // Drop cached protected data after sign-out.
          queryClient.clear();
          setUser(null);
          setProfile(null);
          return;
        }

        // Refresh role/data-driven views after sign-in, token refresh, etc.
        await queryClient.invalidateQueries();

        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          const nextProfile = await fetchProfile(nextUser.id);
          if (!nextProfile) {
            await supabase.auth.signOut();
            queryClient.clear();
            setUser(null);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, syncSessionFromCookies, queryClient]);

  useEffect(() => {
    // Server Action sign-in updates cookies on the server response, but this
    // provider remains mounted across route changes. Re-check session when
    // pathname changes so post-login dashboard renders immediately.
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    syncSessionFromCookies();
  }, [pathname, syncSessionFromCookies]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Use the configured app URL so the verification email works in production.
    // Fallback to window.location.origin for local development.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
