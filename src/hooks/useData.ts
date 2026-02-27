import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import * as usersApi from '@/lib/api/users';
import * as coursesApi from '@/lib/api/courses';
import * as enrollmentsApi from '@/lib/api/enrollments';
import * as assignmentsApi from '@/lib/api/assignments';
import * as gradesApi from '@/lib/api/grades';
import * as announcementsApi from '@/lib/api/announcements';
import * as dashboardApi from '@/lib/api/dashboard';
import { createUserAction, type CreateUserPayload } from '@/app/(dashboard)/dashboard/users/actions';
import type { Profile } from '@/types';
import type { CourseFormSchema, AssignmentFormSchema, GradeFormSchema } from '@/lib/validations';
import toast from 'react-hot-toast';

// Re-export filter types
export type { UserFilters } from '@/lib/api/users';
export type { CourseFilters } from '@/lib/api/courses';
export type { EnrollmentFilters } from '@/lib/api/enrollments';
export type { AssignmentFilters } from '@/lib/api/assignments';
export type { SubmissionFilters } from '@/lib/api/grades';
export type { AnnouncementFilters } from '@/lib/api/announcements';

const sb = () => createClient();

/** Resolves the current authenticated user's ID. Throws if not authenticated. */
async function currentUserId(): Promise<string> {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user?.id) throw new Error('Not authenticated');
  return user.id;
}

// ============================================================
// USERS
// ============================================================
export function useUsers(filters: usersApi.UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getUsers(sb(), filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(sb(), id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Pick<Profile, 'full_name' | 'role' | 'department' | 'phone' | 'bio' | 'is_active' | 'email'>>) =>
      usersApi.updateUser(sb(), id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSoftDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.softDeleteUser(sb(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const result = await createUserAction(payload);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============================================================
// COURSES
// ============================================================
export function useCourses(filters: coursesApi.CourseFilters = {}) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => coursesApi.getCourses(sb(), filters),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getCourseById(sb(), id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CourseFormSchema & { created_by?: string }) => {
      const userId = payload.created_by ?? await currentUserId();
      const { created_by: _ignore, ...rest } = payload;
      return coursesApi.createCourse(sb(), { ...rest, created_by: userId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourseFormSchema> }) =>
      coursesApi.updateCourse(sb(), id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.deleteCourse(sb(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course archived');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============================================================
// ENROLLMENTS
// ============================================================
export function useEnrollments(filters: enrollmentsApi.EnrollmentFilters = {}) {
  return useQuery({
    queryKey: ['enrollments', filters],
    queryFn: () => enrollmentsApi.getEnrollments(sb(), filters),
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      enrollmentsApi.enrollStudent(sb(), courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Enrollment request submitted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEnrollmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      actorId,
      notes,
    }: {
      id: string;
      status: Parameters<typeof enrollmentsApi.updateEnrollmentStatus>[2];
      actorId?: string;
      notes?: string;
    }) => {
      const userId = actorId ?? await currentUserId();
      return enrollmentsApi.updateEnrollmentStatus(sb(), id, status, userId, notes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Enrollment status updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============================================================
// ASSIGNMENTS
// ============================================================
export function useAssignments(filters: assignmentsApi.AssignmentFilters = {}) {
  return useQuery({
    queryKey: ['assignments', filters],
    queryFn: () => assignmentsApi.getAssignments(sb(), filters),
    // Assignments are actionable — students need to see them quickly after faculty publish.
    // Use a shorter staleTime (60 s) so the list refreshes more aggressively.
    staleTime: 60 * 1000,
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ['assignments', id],
    queryFn: () => assignmentsApi.getAssignmentById(sb(), id),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AssignmentFormSchema & { course_id: string; created_by?: string }) => {
      const { course_id, created_by, ...rest } = payload;
      const userId = created_by ?? await currentUserId();
      return assignmentsApi.createAssignment(sb(), course_id, userId, rest as AssignmentFormSchema);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<AssignmentFormSchema> & { attachment_urls?: string[] };
    }) => assignmentsApi.updateAssignment(sb(), id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============================================================
// GRADES & SUBMISSIONS
// ============================================================
export function useSubmissions(filters: gradesApi.SubmissionFilters = {}) {
  return useQuery({
    queryKey: ['submissions', filters],
    queryFn: () => gradesApi.getSubmissions(sb(), filters),
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      gradedBy,
      points,
      feedback,
    }: {
      submissionId: string;
      gradedBy?: string;
      points: number;
      feedback?: string;
    }) => {
      const userId = gradedBy ?? await currentUserId();
      return gradesApi.gradeSubmission(sb(), submissionId, userId, { points, feedback });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Grade saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStudentGPA(studentId: string | undefined) {
  return useQuery({
    queryKey: ['gpa', studentId],
    queryFn: () => gradesApi.calculateStudentGPA(sb(), studentId!),
    enabled: !!studentId,
  });
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
export function useAnnouncements(filters: announcementsApi.AnnouncementFilters = {}) {
  return useQuery({
    queryKey: ['announcements', filters],
    queryFn: () => announcementsApi.getAnnouncements(sb(), filters),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Parameters<typeof announcementsApi.createAnnouncement>[2] & { author_id?: string }) => {
      const { author_id, ...rest } = payload;
      const userId = author_id ?? await currentUserId();
      return announcementsApi.createAnnouncement(sb(), userId, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement published');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export function useAdminStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminStats(sb()),
  });
}

export function useFacultyStats(facultyId: string) {
  return useQuery({
    queryKey: ['dashboard', 'faculty', facultyId],
    queryFn: () => dashboardApi.getFacultyStats(sb(), facultyId),
    enabled: !!facultyId,
  });
}

export function useStudentStats(studentId: string) {
  return useQuery({
    queryKey: ['dashboard', 'student', studentId],
    queryFn: () => dashboardApi.getStudentStats(sb(), studentId),
    enabled: !!studentId,
  });
}
