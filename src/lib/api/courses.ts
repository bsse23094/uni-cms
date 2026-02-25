import type { SupabaseClient } from '@supabase/supabase-js';
import type { Course, CourseWithFaculty, PaginatedResponse } from '@/types';
import type { CourseFormSchema } from '@/lib/validations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface CourseFilters {
  status?: string;
  department?: string;
  semester?: string;
  search?: string;
  faculty_id?: string;
  student_id?: string;
  page?: number;
  pageSize?: number;
}

/** List courses with filtering and enrollment counts */
export async function getCourses(
  client: Client,
  filters: CourseFilters = {},
): Promise<PaginatedResponse<CourseWithFaculty>> {
  const { status, department, semester, search, faculty_id, student_id, page = 1, pageSize = 20 } =
    filters;

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('courses')
    .select(
      `*, course_faculty!inner(faculty:profiles(id,full_name,avatar_url,email), is_primary)`,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status as Course['status']);
  if (department) query = query.ilike('department', `%${department}%`);
  if (semester) query = query.eq('semester', semester);
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,course_code.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }
  if (faculty_id) {
    query = query.eq('course_faculty.faculty_id', faculty_id);
  }

  if (student_id) {
    // Courses the student is enrolled in with approved status
    const { data: enrolData } = await client
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student_id)
      .eq('status', 'approved')
      .is('deleted_at', null);

    const ids = (enrolData ?? []).map((e) => e.course_id);
    if (ids.length === 0) {
      return { data: [], count: 0, page: safePage, pageSize: safePageSize, totalPages: 0 };
    }
    query = query.in('id', ids);
  }

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as CourseWithFaculty[],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

/** Get a single course with full faculty and enrollment details */
export async function getCourseById(
  client: Client,
  id: string,
): Promise<CourseWithFaculty> {
  const { data, error } = await client
    .from('courses')
    .select(`*, course_faculty(faculty:profiles(id,full_name,avatar_url,email,role), is_primary, assigned_at)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as CourseWithFaculty;
}

/** Create a new course */
export async function createCourse(
  client: Client,
  payload: CourseFormSchema & { created_by: string },
): Promise<Course> {
  const { data, error } = await client
    .from('courses')
    .insert({
      ...payload,
      academic_year: payload.academic_year ?? '',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update a course */
export async function updateCourse(
  client: Client,
  id: string,
  updates: Partial<CourseFormSchema>,
): Promise<Course> {
  const { data, error } = await client
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Soft-delete a course */
export async function deleteCourse(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from('courses')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Assign faculty to a course */
export async function assignFaculty(
  client: Client,
  courseId: string,
  facultyId: string,
  isPrimary: boolean,
  assignedById: string,
): Promise<void> {
  const { error } = await client.from('course_faculty').upsert(
    { course_id: courseId, faculty_id: facultyId, is_primary: isPrimary, assigned_by: assignedById },
    { onConflict: 'course_id,faculty_id' },
  );
  if (error) throw new Error(error.message);
}

/** Remove a faculty assignment */
export async function removeFaculty(
  client: Client,
  courseId: string,
  facultyId: string,
): Promise<void> {
  const { error } = await client
    .from('course_faculty')
    .delete()
    .eq('course_id', courseId)
    .eq('faculty_id', facultyId);

  if (error) throw new Error(error.message);
}
