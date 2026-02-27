import type { SupabaseClient } from '@supabase/supabase-js';
import type { Enrollment, EnrollmentWithDetails, PaginatedResponse } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface EnrollmentFilters {
  course_id?: string;
  student_id?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/** Get enrollments with student + course details */
export async function getEnrollments(
  client: Client,
  filters: EnrollmentFilters = {},
): Promise<PaginatedResponse<EnrollmentWithDetails>> {
  const { course_id, student_id, status, page = 1, pageSize = 25 } = filters;

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('enrollments')
    .select(
      `*, course:courses(id,course_code,title,semester,credits,department),
       student:profiles!enrollments_student_id_fkey(id,full_name,email,avatar_url,student_id)`,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('enrolled_at', { ascending: false });

  if (course_id) query = query.eq('course_id', course_id);
  if (student_id) query = query.eq('student_id', student_id);
  if (status) query = query.eq('status', status as Enrollment['status']);

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as EnrollmentWithDetails[],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

/** Enroll current student in a course */
export async function enrollStudent(
  client: Client,
  courseId: string,
  studentId: string,
): Promise<Enrollment> {
  // Check capacity: run both queries in parallel instead of sequentially.
  const [{ count: enrolledCount }, { data: course }] = await Promise.all([
    client
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .in('status', ['pending', 'approved'])
      .is('deleted_at', null),
    client.from('courses').select('max_enrollment').eq('id', courseId).single(),
  ]);

  if (course && (enrolledCount ?? 0) >= course.max_enrollment) {
    throw new Error('This course has reached its maximum enrollment capacity.');
  }

  const { data, error } = await client
    .from('enrollments')
    .insert({ course_id: courseId, student_id: studentId, status: 'pending' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update enrollment status (admin/faculty) */
export async function updateEnrollmentStatus(
  client: Client,
  enrollmentId: string,
  status: Enrollment['status'],
  actorId: string,
  notes?: string,
): Promise<Enrollment> {
  const updates: Partial<Enrollment> = { status, notes: notes ?? null };
  const now = new Date().toISOString();

  if (status === 'approved') {
    updates.approved_at = now;
    updates.approved_by = actorId;
  } else if (status === 'rejected') {
    updates.rejected_at = now;
    updates.rejected_by = actorId;
  } else if (status === 'dropped') {
    updates.dropped_at = now;
  }

  const { data, error } = await client
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Student drops a course */
export async function dropEnrollment(client: Client, enrollmentId: string): Promise<void> {
  const { error } = await client
    .from('enrollments')
    .update({ status: 'dropped', dropped_at: new Date().toISOString() })
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);
}
