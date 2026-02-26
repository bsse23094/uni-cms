'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/types';

export interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

/**
 * Admin-only Server Action: create a new auth user + profile.
 * Uses the service-role key so:
 *  - email_confirm is set to true (no confirmation email required)
 *  - the profile row is accessible immediately
 */
export async function createUserAction(
  payload: CreateUserPayload,
): Promise<{ error?: string }> {
  try {
    // Verify the calling user is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
      return { error: 'Insufficient permissions' };
    }

    // Use service-role client for admin operations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Create the Supabase auth user
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true, // admin-created users are confirmed immediately
      user_metadata: {
        full_name: payload.full_name,
        role: payload.role,
      },
    });

    if (createError) return { error: createError.message };
    if (!data.user) return { error: 'User creation returned no user' };

    // The handle_new_user trigger creates the profile with full_name + role from metadata.
    // Apply optional extra fields (department, phone) now.
    if (payload.department || payload.phone) {
      const updates: Record<string, string> = {};
      if (payload.department) updates.department = payload.department;
      if (payload.phone) updates.phone = payload.phone;

      await adminClient.from('profiles').update(updates).eq('id', data.user.id);
    }

    revalidatePath('/dashboard/users');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
