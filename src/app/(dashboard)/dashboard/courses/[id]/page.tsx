'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCourse,
  useUpdateCourse,
  useEnrollments,
  useAssignments,
  useCreateAssignment,
} from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  BookOpen,
  Users,
  FileText,
  Plus,
  Calendar,
} from 'lucide-react';
import { formatDate, formatDateTime, ENROLLMENT_STATUS_COLORS } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentFormSchema, type AssignmentFormData } from '@/lib/validations';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ---- Create Assignment Dialog ----
function CreateAssignmentDialog({
  courseId,
  open,
  onClose,
}: {
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const createAssignment = useCreateAssignment();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({ resolver: zodResolver(assignmentFormSchema) });

  const onSubmit = async (data: AssignmentFormData) => {
    await createAssignment.mutateAsync({ ...data, course_id: courseId });
    toast.success('Assignment created');
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Title *</Label>
              <Input {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Instructions</Label>
              <Textarea {...register('instructions')} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Max Points *</Label>
              <Input {...register('max_points', { valueAsNumber: true })} type="number" />
              {errors.max_points && <p className="text-xs text-destructive">{errors.max_points.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Due Date *</Label>
              <Input {...register('due_date')} type="datetime-local" />
              {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Allow Late</Label>
              <Controller
                control={control}
                name="allow_late"
                defaultValue={false}
                render={({ field }) => (
                  <Select value={field.value ? 'true' : 'false'} onValueChange={(v) => field.onChange(v === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { data: course, isLoading } = useCourse(id);
  const { data: enrollments } = useEnrollments({ course_id: id, pageSize: 50 });
  const { data: assignments } = useAssignments({ course_id: id, pageSize: 50 });
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  const canManage = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'faculty';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
      </div>
    );
  }

  const activeEnrollments = enrollments?.data.filter((e) => e.status === 'approved') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={`${course.course_code} · ${course.credits} credits · ${course.department ?? ''}`}
        icon={<BookOpen className="h-6 w-6" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/courses')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{activeEnrollments.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Enrolled Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{assignments?.count ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{course.max_enrollment ?? '∞'}</p>
            <p className="text-sm text-muted-foreground mt-1">Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Badge className={course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
              {course.status}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Faculty */}
      {course.course_faculty && course.course_faculty.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Faculty</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {course.course_faculty.map((cf) => (
                <div key={cf.faculty.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={cf.faculty.avatar_url ?? undefined} />
                    <AvatarFallback>{cf.faculty.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{cf.faculty.full_name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" />Students ({activeEnrollments.length})</TabsTrigger>
          <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments ({assignments?.count ?? 0})</TabsTrigger>
          {course.description && <TabsTrigger value="about">About</TabsTrigger>}
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardContent className="pt-4">
              {activeEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No enrolled students yet.</p>
              ) : (
                <ul className="divide-y">
                  {activeEnrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={e.student?.avatar_url ?? undefined} />
                          <AvatarFallback>{e.student?.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{e.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{e.student?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={ENROLLMENT_STATUS_COLORS[e.status]}>{e.status}</Badge>
                        {e.approved_at && (
                          <p className="text-xs text-muted-foreground mt-1">Enrolled {formatDate(e.approved_at)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assignments</CardTitle>
              {canManage && (
                <Button size="sm" onClick={() => setShowCreateAssignment(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Assignment
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(assignments?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No assignments yet.</p>
              ) : (
                <ul className="divide-y">
                  {assignments?.data.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.max_points} pts</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(a.due_date)}
                        </div>
                        <Button asChild variant="ghost" size="sm" className="mt-1">
                          <Link href={`/dashboard/courses/${id}/assignments/${a.id}`}>View</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        {course.description && (
          <TabsContent value="about">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <CreateAssignmentDialog
        courseId={id}
        open={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
      />
    </div>
  );
}
