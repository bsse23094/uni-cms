import type { SupabaseClient } from '@supabase/supabase-js';
import type { Assignment, AssignmentWithCourse, PaginatedResponse } from '@/types';
import type { AssignmentFormSchema } from '@/lib/validations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface AssignmentFilters {
  course_id?: string;
  is_published?: boolean;
  student_id?: string;
  page?: number;
  pageSize?: number;
}

/** List assignments (respects RLS) */
export async function getAssignments(
  client: Client,
  filters: AssignmentFilters = {},
): Promise<PaginatedResponse<AssignmentWithCourse>> {
  const { course_id, is_published, page = 1, pageSize = 20 } = filters;

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('assignments')
    .select(`*, course:courses(id,course_code,title)`, { count: 'exact' })
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (course_id) query = query.eq('course_id', course_id);
  if (is_published !== undefined) query = query.eq('is_published', is_published);

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as AssignmentWithCourse[],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

/** Get a single assignment */
export async function getAssignmentById(
  client: Client,
  id: string,
): Promise<AssignmentWithCourse> {
  const { data, error } = await client
    .from('assignments')
    .select(`*, course:courses(id,course_code,title)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as AssignmentWithCourse;
}

/** Create a new assignment */
export async function createAssignment(
  client: Client,
  courseId: string,
  createdBy: string,
  payload: AssignmentFormSchema,
): Promise<Assignment> {
  const { data, error } = await client
    .from('assignments')
    .insert({
      course_id: courseId,
      created_by: createdBy,
      title: payload.title,
      description: payload.description ?? null,
      instructions: payload.instructions ?? null,
      due_date: payload.due_date.toISOString(),
      max_points: payload.max_points,
      allow_late: payload.allow_late,
      late_penalty_pct: payload.late_penalty_pct,
      is_published: payload.is_published,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Upload assignment attachment(s) and return storage paths */
export async function uploadAssignmentFiles(
  client: Client,
  assignmentId: string,
  files: File[],
): Promise<string[]> {
  const paths: string[] = [];

  for (const file of files) {
    const path = `${assignmentId}/${Date.now()}-${file.name}`;
    const { error } = await client.storage.from('assignments').upload(path, file);
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

/** Update an assignment */
export async function updateAssignment(
  client: Client,
  id: string,
  updates: Partial<AssignmentFormSchema> & { attachment_urls?: string[] },
): Promise<Assignment> {
  const payload: Record<string, unknown> = { ...updates };
  if (updates.due_date) payload.due_date = (updates.due_date as Date).toISOString();

  const { data, error } = await client
    .from('assignments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Soft-delete an assignment */
export async function deleteAssignment(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from('assignments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
