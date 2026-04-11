'use client';

import { useParams } from 'next/navigation';
import { useAssignment, useSubmissions, useGradeSubmission } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { FileUpload } from '@/components/shared/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import { formatDateTime, describeDueDate, SUBMISSION_STATUS_COLORS } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  getOrCreateSubmission,
  uploadSubmissionFiles,
  submitAssignment,
} from '@/lib/api/grades';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gradeFormSchema, type GradeFormData } from '@/lib/validations';

// ---- Submission File List (shared for student & faculty views) ----
function SubmissionFileList({ paths, bucket }: { paths: string[]; bucket: string }) {
  const supabase = createClient();
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const resolved: Record<string, string> = {};
      for (const path of paths) {
        // Try public URL first; if bucket is private, create a signed URL (1h)
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (pub?.publicUrl) {
          // Verify it's reachable (public bucket) — if not, fall back to signed
          resolved[path] = pub.publicUrl;
        }
        // Also generate a signed URL as fallback
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        if (signed?.signedUrl) {
          resolved[path] = signed.signedUrl;
        }
      }
      if (!cancelled) setUrls(resolved);
    }
    if (paths.length > 0) resolve();
    return () => { cancelled = true; };
  }, [paths, bucket, supabase]);

  return (
    <ul className="space-y-1.5">
      {paths.map((path) => {
        const fileName = path.split('/').pop() ?? path;
        // Strip the timestamp prefix if present (e.g., "1710000000000-report.pdf" → "report.pdf")
        const displayName = fileName.replace(/^\d{10,}-/, '');
        const url = urls[path];
        return (
          <li key={path}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-xs">{displayName}</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-xs">{displayName}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---- Grade Form (Faculty) ----
function GradeForm({ submissionId, maxPoints, onSuccess }: {
  submissionId: string;
  maxPoints: number;
  onSuccess: () => void;
}) {
  const gradeSubmission = useGradeSubmission();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GradeFormData>({
    resolver: zodResolver(gradeFormSchema),
  });

  const onSubmit = async (data: GradeFormData) => {
    await gradeSubmission.mutateAsync({ submissionId, ...data });
    toast.success('Submission graded');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-3 border-t">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Points (max {maxPoints})</Label>
          <Input {...register('points', { valueAsNumber: true })} type="number" min={0} max={maxPoints} />
          {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <Label>Feedback</Label>
        <Textarea {...register('feedback')} rows={3} placeholder="Optional feedback…" />
      </div>
      <Button type="submit" size="sm" loading={isSubmitting}>Submit Grade</Button>
    </form>
  );
}

// ---- Student Submit Form ----
function StudentSubmitForm({ assignmentId, courseId, dueDate, onSubmitted }: {
  assignmentId: string;
  courseId: string;
  dueDate: string;
  onSubmitted?: () => void;
}) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<{
    id: string; status: string; content: string | null;
    attachment_urls: string[] | null; submitted_at: string | null;
  } | null>(null);
  const [checked, setChecked] = useState(false);

  // Check if student already has a submission for this assignment
  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase
      .from('submissions')
      .select('id, status, content, attachment_urls, submitted_at')
      .eq('assignment_id', assignmentId)
      .eq('student_id', profile.id)
      .is('deleted_at', null)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingStatus(data.status);
          if (data.content) setNotes(data.content);
          setExistingSubmission(data);
        }
        setChecked(true);
      });
  }, [profile, assignmentId]);

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const submission = await getOrCreateSubmission(supabase, assignmentId, profile.id);

      // Prevent re-submission of graded work
      if (submission.status === 'graded') {
        toast.error('This assignment has already been graded and cannot be re-submitted.');
        setExistingStatus('graded');
        return;
      }

      const uploadedPaths: string[] = [];
      if (files.length > 0) {
        const paths = await uploadSubmissionFiles(supabase, submission.id, profile.id, files);
        uploadedPaths.push(...paths);
      }

      // Merge with any existing attachment URLs
      const existingUrls = submission.attachment_urls ?? [];
      const allUrls = [...existingUrls, ...uploadedPaths];

      await submitAssignment(
        supabase,
        submission.id,
        notes || null,
        allUrls,
        true,
        { due_date: dueDate },
      );
      toast.success('Assignment submitted!');
      setFiles([]);
      setNotes('');
      setExistingStatus('submitted');
      onSubmitted?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Already graded — show info instead of form
  if (checked && existingStatus === 'graded') {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Submit Assignment</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Badge className="bg-green-100 text-green-800">Graded</Badge>
            <span className="text-muted-foreground">Your submission has been graded. Re-submission is not available.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit Assignment</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {existingStatus === 'submitted' && existingSubmission && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
              <Clock className="h-4 w-4" />
              Submitted {existingSubmission.submitted_at ? formatDateTime(existingSubmission.submitted_at) : ''}
            </div>
            {existingSubmission.content && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Your notes</p>
                <p className="text-sm">{existingSubmission.content}</p>
              </div>
            )}
            {existingSubmission.attachment_urls && existingSubmission.attachment_urls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Your files</p>
                <SubmissionFileList paths={existingSubmission.attachment_urls} bucket="submissions" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Resubmitting will replace your previous work.</p>
          </div>
        )}
        <div className="space-y-1">
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add notes for your instructor…" />
        </div>
        <FileUpload
          onFilesSelected={setFiles}
          multiple
          maxSizeMB={20}
        />
        <Button onClick={handleSubmit} loading={submitting} className="w-full">
          {existingStatus === 'submitted' ? 'Resubmit Assignment' : 'Submit Assignment'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AssignmentDetailPage() {
  const { id: courseId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const { profile } = useAuth();
  const { data: assignment, isLoading } = useAssignment(assignmentId);
  const { data: submissions, refetch } = useSubmissions({
    assignment_id: assignmentId,
    pageSize: 100,
  });
  const [gradingId, setGradingId] = useState<string | null>(null);

  const isFacultyOrAdmin = profile?.role !== 'student';
  const isStudent = profile?.role === 'student';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Assignment not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.max_points} points`}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/courses/${courseId}`}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
        }
      />

      {/* Details card */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Due: <span className="font-medium text-foreground">{formatDateTime(assignment.due_date)}</span>
              <span className="text-yellow-600">{describeDueDate(assignment.due_date).label}</span>
            </div>
          </div>
          {assignment.instructions && (
            <div>
              <p className="text-sm font-medium mb-1">Instructions</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{assignment.instructions}</p>
            </div>
          )}
          {!assignment.allow_late && (
            <Badge variant="warning">Late submissions not accepted</Badge>
          )}
        </CardContent>
      </Card>

      {/* Student: Submit */}
      {isStudent && (
        <StudentSubmitForm
          assignmentId={assignmentId}
          courseId={courseId}
          dueDate={assignment.due_date}
          onSubmitted={() => refetch()}
        />
      )}

      {/* Faculty: Submissions table */}
      {isFacultyOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Submissions ({submissions?.count ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(submissions?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No submissions yet.</p>
            ) : (
              <ul className="divide-y">
                {submissions?.data.map((sub) => (
                  <li key={sub.id} className="py-4 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={sub.student?.avatar_url ?? undefined} />
                          <AvatarFallback>{sub.student?.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sub.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {sub.submitted_at ? `Submitted ${formatDateTime(sub.submitted_at)}` : 'Not submitted'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pl-11 sm:pl-0">
                        <Badge className={SUBMISSION_STATUS_COLORS[sub.status]}>{sub.status}</Badge>
                        {sub.grade?.points !== undefined && (
                          <Badge variant="secondary">{sub.grade.points}/{assignment.max_points}</Badge>
                        )}
                        {sub.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setGradingId(gradingId === sub.id ? null : sub.id)}
                          >
                            Grade
                          </Button>
                        )}
                      </div>
                    </div>
                    {sub.content && <p className="text-xs text-muted-foreground pl-11">{sub.content}</p>}
                    {sub.attachment_urls && sub.attachment_urls.length > 0 && (
                      <div className="pl-11 pt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Attached files</p>
                        <SubmissionFileList paths={sub.attachment_urls} bucket="submissions" />
                      </div>
                    )}
                    {gradingId === sub.id && (
                      <div className="pl-11">
                        <GradeForm
                          submissionId={sub.id}
                          maxPoints={assignment.max_points}
                          onSuccess={() => { setGradingId(null); refetch(); }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
