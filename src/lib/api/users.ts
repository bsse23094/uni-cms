import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, PaginatedResponse } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface UserFilters {
  role?: string;
  department?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

/** Fetch users with optional filtering and pagination */
export async function getUsers(
  client: Client,
  filters: UserFilters = {},
): Promise<PaginatedResponse<Profile>> {
  const {
    role,
    department,
    search,
    is_active,
    page = 1,
    pageSize = 20,
  } = filters;

  // Cap pageSize to prevent resource exhaustion
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('profiles')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role as Profile['role']);
  if (department) query = query.ilike('department', `%${department}%`);
  if (is_active !== undefined) query = query.eq('is_active', is_active);
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

/** Get a single profile by ID */
export async function getUserById(client: Client, id: string): Promise<Profile> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update a user profile (admin-level) */
export async function updateUser(
  client: Client,
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'department' | 'phone' | 'bio' | 'is_active'>>,
): Promise<Profile> {
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Soft-delete a user */
export async function softDeleteUser(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Restore a soft-deleted user */
export async function restoreUser(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ deleted_at: null, is_active: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Upload a user avatar and update the profile */
export async function uploadAvatar(
  client: Client,
  userId: string,
  file: File,
): Promise<string> {
  // Validate file type – only allow safe image formats
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
  }

  // Validate file size – max 5 MB
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File too large. Maximum size is 5 MB.');
  }

  // Derive extension from MIME type (never trust file.name extension)
  const EXT_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const ext = EXT_MAP[file.type];
  // Scope to userId so users can only write to their own folder
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = client.storage.from('avatars').getPublicUrl(path);

  const { error: updateError } = await client
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId);

  if (updateError) throw new Error(updateError.message);
  return urlData.publicUrl;
}
