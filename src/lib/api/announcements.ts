import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Announcement,
  AnnouncementWithAuthor,
  PaginatedResponse,
} from '@/types';
import type { AnnouncementFormSchema } from '@/lib/validations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface AnnouncementFilters {
  course_id?: string | null;
  audience?: string;
  /** Pass the current user's role to auto-scope visible announcements. */
  userRole?: 'student' | 'faculty' | 'admin' | 'super_admin';
  is_pinned?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getAnnouncements(
  client: Client,
  filters: AnnouncementFilters = {},
): Promise<PaginatedResponse<AnnouncementWithAuthor>> {
  const { course_id, audience, userRole, is_pinned, page = 1, pageSize = 20 } = filters;

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('announcements')
    .select(
      `*, author:profiles!announcements_author_id_fkey(id,full_name,avatar_url,role),
       course:courses(id,course_code,title)`,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  if (course_id !== undefined) {
    query = course_id ? query.eq('course_id', course_id) : query.is('course_id', null);
  }
  if (audience) query = query.eq('audience', audience as Announcement['audience']);

  // Scope by role: students see 'all'+'students', faculty see 'all'+'faculty',
  // admin/super_admin see everything (no extra filter needed).
  if (userRole === 'student') {
    query = query.in('audience', ['all', 'students']);
  } else if (userRole === 'faculty') {
    query = query.in('audience', ['all', 'faculty']);
  }

  if (is_pinned !== undefined) query = query.eq('is_pinned', is_pinned);

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as AnnouncementWithAuthor[],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

export async function createAnnouncement(
  client: Client,
  authorId: string,
  payload: AnnouncementFormSchema,
): Promise<Announcement> {
  const { data, error } = await client
    .from('announcements')
    .insert({
      author_id: authorId,
      course_id: payload.course_id ?? null,
      title: payload.title,
      content: payload.content,
      audience: payload.audience,
      is_pinned: payload.is_pinned,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAnnouncement(
  client: Client,
  id: string,
  updates: Partial<AnnouncementFormSchema>,
): Promise<Announcement> {
  const { data, error } = await client
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAnnouncement(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from('announcements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
