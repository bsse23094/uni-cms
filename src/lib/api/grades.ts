import type { SupabaseClient } from '@supabase/supabase-js';
import type { Submission, SubmissionWithDetails, Grade, PaginatedResponse } from '@/types';
import type { GradeFormSchema } from '@/lib/validations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface SubmissionFilters {
  assignment_id?: string;
  student_id?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/** List submissions with student details and grade */
export async function getSubmissions(
  client: Client,
  filters: SubmissionFilters = {},
): Promise<PaginatedResponse<SubmissionWithDetails>> {
  const { assignment_id, student_id, status, page = 1, pageSize = 25 } = filters;

  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);

  let query = client
    .from('submissions')
    .select(
      `*,
       assignment:assignments(id,title,due_date,max_points),
       student:profiles!submissions_student_id_fkey(id,full_name,email,student_id,avatar_url),
       grade:grades(id,points,feedback,graded_at,graded_by)`,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('submitted_at', { ascending: false });

  if (assignment_id) query = query.eq('assignment_id', assignment_id);
  if (student_id) query = query.eq('student_id', student_id);
  if (status) query = query.eq('status', status as Submission['status']);

  const from = (safePage - 1) * safePageSize;
  query = query.range(from, from + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as SubmissionWithDetails[],
    count: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

/** Get or create a student's submission for an assignment */
export async function getOrCreateSubmission(
  client: Client,
  assignmentId: string,
  studentId: string,
): Promise<Submission> {
  const { data: existing } = await client
    .from('submissions')
    .select()
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .single();

  if (existing) return existing;

  const { data, error } = await client
    .from('submissions')
    .insert({ assignment_id: assignmentId, student_id: studentId, status: 'draft' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Upload submission files */
export async function uploadSubmissionFiles(
  client: Client,
  submissionId: string,
  studentId: string,
  files: File[],
): Promise<string[]> {
  const paths: string[] = [];

  // Max 20 MB per file, max 10 files per submission
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const MAX_FILES = 10;
  if (files.length > MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files per submission.`);

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds the 20 MB limit.`);
    }
    // Sanitize filename: strip path separators and non-printable chars
    const safeName = file.name
      .replace(/[/\\:*?"<>|\x00-\x1f]/g, '_') // remove dangerous chars
      .replace(/\.{2,}/g, '.')                   // collapse multiple dots (no ..) 
      .slice(0, 200);                             // cap length

    // Scope path to studentId/submissionId to prevent cross-user access
    const path = `${studentId}/${submissionId}/${Date.now()}-${safeName}`;
    const { error } = await client.storage.from('submissions').upload(path, file);
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

/** Submit (or save draft of) a student's work */
export async function submitAssignment(
  client: Client,
  submissionId: string,
  content: string | null,
  attachmentUrls: string[],
  submit: boolean,
  assignment: { due_date: string },
): Promise<Submission> {
  const now = new Date();
  const isLate = now > new Date(assignment.due_date);

  const { data, error } = await client
    .from('submissions')
    .update({
      content,
      attachment_urls: attachmentUrls.length ? attachmentUrls : null,
      status: submit ? 'submitted' : 'draft',
      submitted_at: submit ? now.toISOString() : null,
      is_late: submit ? isLate : false,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Grade a submission (upsert) */
export async function gradeSubmission(
  client: Client,
  submissionId: string,
  gradedBy: string,
  payload: GradeFormSchema,
): Promise<Grade> {
  // Upsert the grade
  const { data: grade, error: gradeError } = await client
    .from('grades')
    .upsert(
      {
        submission_id: submissionId,
        graded_by: gradedBy,
        points: payload.points,
        feedback: payload.feedback ?? null,
        graded_at: new Date().toISOString(),
      },
      { onConflict: 'submission_id' },
    )
    .select()
    .single();

  if (gradeError) throw new Error(gradeError.message);

  // Mark submission as graded
  await client.from('submissions').update({ status: 'graded' }).eq('id', submissionId);

  return grade;
}

/** Get grade history for a submission */
export async function getGradeHistory(client: Client, submissionId: string) {
  const { data, error } = await client
    .from('grade_history')
    .select(`*, changer:profiles!grade_history_changed_by_fkey(full_name, email)`)
    .eq('submission_id', submissionId)
    .order('changed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Calculate GPA for a student based on graded submissions */
export async function calculateStudentGPA(
  client: Client,
  studentId: string,
): Promise<{ gpa: number; gradeCount: number }> {
  const { data, error } = await client
    .from('submissions')
    .select(`grade:grades(points), assignment:assignments(max_points, course:courses(credits))`)
    .eq('student_id', studentId)
    .eq('status', 'graded')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);

  const { pointsToGrade, gradeToGPA } = await import('@/lib/utils');

  let totalWeightedGPA = 0;
  let totalCredits = 0;

  for (const submission of data ?? []) {
    const g = submission.grade as unknown as { points: number } | null;
    const a = submission.assignment as unknown as { max_points: number; course: { credits: number } } | null;

    if (g && a) {
      const letter = pointsToGrade(g.points, a.max_points);
      const gpaPoints = gradeToGPA(letter);
      const credits = a.course?.credits ?? 3;
      totalWeightedGPA += gpaPoints * credits;
      totalCredits += credits;
    }
  }

  const gpa = totalCredits > 0 ? totalWeightedGPA / totalCredits : 0;
  return { gpa: Math.round(gpa * 100) / 100, gradeCount: (data ?? []).length };
}
