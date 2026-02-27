import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminDashboardStats,
  FacultyDashboardStats,
  StudentDashboardStats,
} from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export async function getAdminStats(client: Client): Promise<AdminDashboardStats> {
  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: pendingEnrollments },
    { count: totalFaculty },
    { count: totalStudents },
    { count: activeCourses },
  ] = await Promise.all([
    client.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    client.from('courses').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    client.from('enrollments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    client
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),
    client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'faculty')
      .is('deleted_at', null),
    client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('deleted_at', null),
    client
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    pendingEnrollments: pendingEnrollments ?? 0,
    totalFaculty: totalFaculty ?? 0,
    totalStudents: totalStudents ?? 0,
    activeCourses: activeCourses ?? 0,
  };
}

export async function getFacultyStats(
  client: Client,
  facultyId: string,
): Promise<FacultyDashboardStats> {
  // Courses this faculty teaches
  const { data: facultyCourses } = await client
    .from('course_faculty')
    .select('course_id')
    .eq('faculty_id', facultyId);

  const courseIds = (facultyCourses ?? []).map((c) => c.course_id);

  if (courseIds.length === 0) {
    return { coursesTaught: 0, totalStudents: 0, pendingSubmissions: 0, upcomingAssignments: 0 };
  }

  // Fetch assignment IDs IN PARALLEL with the enrollment count so that the
  // submissions query (which needs assignment IDs) doesn't create a 3-step serial chain.
  const [{ data: assignmentRows }, { count: totalStudents }, { count: upcomingAssignments }] =
    await Promise.all([
      client
        .from('assignments')
        .select('id')
        .in('course_id', courseIds)
        .is('deleted_at', null),
      client
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('status', 'approved')
        .is('deleted_at', null),
      client
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .gt('due_date', new Date().toISOString())
        .is('deleted_at', null),
    ]);

  const assignmentIds = (assignmentRows ?? []).map((a) => a.id);
  const { count: pendingSubmissions } = assignmentIds.length
    ? await client
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .in('assignment_id', assignmentIds)
        .is('deleted_at', null)
    : { count: 0 };

  return {
    coursesTaught: courseIds.length,
    totalStudents: totalStudents ?? 0,
    pendingSubmissions: pendingSubmissions ?? 0,
    upcomingAssignments: upcomingAssignments ?? 0,
  };
}

export async function getStudentStats(
  client: Client,
  studentId: string,
): Promise<StudentDashboardStats> {
  // All 4 queries run in parallel — gradedSubs was previously a sequential second round-trip.
  const [
    { count: enrolledCourses },
    { count: upcomingDeadlines },
    { count: completedAssignments },
    { data: gradedSubs },
  ] = await Promise.all([
    client
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .is('deleted_at', null),
    client
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .gt('due_date', new Date().toISOString())
      .lt('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_published', true)
      .is('deleted_at', null),
    client
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'submitted')
      .is('deleted_at', null),
    client
      .from('submissions')
      .select(`grade:grades(points), assignment:assignments(max_points)`)
      .eq('student_id', studentId)
      .eq('status', 'graded')
      .is('deleted_at', null),
  ]);

  let averageGrade: number | null = null;
  if (gradedSubs && gradedSubs.length > 0) {
    const sum = gradedSubs.reduce((acc, sub) => {
      const g = sub.grade as unknown as { points: number } | null;
      const a = sub.assignment as unknown as { max_points: number } | null;
      if (g && a) return acc + (g.points / a.max_points) * 100;
      return acc;
    }, 0);
    averageGrade = Math.round(sum / gradedSubs.length);
  }

  return {
    enrolledCourses: enrolledCourses ?? 0,
    upcomingDeadlines: upcomingDeadlines ?? 0,
    completedAssignments: completedAssignments ?? 0,
    averageGrade,
  };
}
