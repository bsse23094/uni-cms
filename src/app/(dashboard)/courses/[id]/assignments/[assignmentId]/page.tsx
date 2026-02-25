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
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gradeFormSchema, type GradeFormData } from '@/lib/validations';

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
      <div className="grid grid-cols-2 gap-3">
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
function StudentSubmitForm({ assignmentId, courseId }: { assignmentId: string; courseId: string }) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const submission = await getOrCreateSubmission(supabase, assignmentId, profile.id);
      const uploadedPaths: string[] = [];
      if (files.length > 0) {
        const paths = await uploadSubmissionFiles(supabase, submission.id, profile.id, files);
        uploadedPaths.push(...paths);
      }
      // Fetch due_date from assignment context (passed as prop)
      await submitAssignment(supabase, submission.id, notes || null, uploadedPaths, true, { due_date: new Date().toISOString() });
      toast.success('Assignment submitted!');
    } catch {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit Assignment</CardTitle></CardHeader>
      <CardContent className="space-y-4">
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
          Submit Assignment
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
      {isStudent && <StudentSubmitForm assignmentId={assignmentId} courseId={courseId} />}

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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sub.student?.avatar_url ?? undefined} />
                          <AvatarFallback>{sub.student?.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{sub.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.submitted_at ? `Submitted ${formatDateTime(sub.submitted_at)}` : 'Not submitted'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
