'use client';

import { useState } from 'react';
import { useCourses, useCreateCourse, useDeleteCourse } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Users,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseFormSchema, type CourseFormData } from '@/lib/validations';
import type { CourseWithFaculty, CourseStatus } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<CourseStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-700',
};

// ---- Create Course Dialog ----
function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCourse = useCreateCourse();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({ resolver: zodResolver(courseFormSchema) });

  const onSubmit = async (data: CourseFormData) => {
    await createCourse.mutateAsync(data);
    toast.success('Course created');
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Course Code *</Label>
              <Input {...register('course_code')} placeholder="CS101" />
              {errors.course_code && <p className="text-xs text-destructive">{errors.course_code.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Credits *</Label>
              <Input {...register('credits', { valueAsNumber: true })} type="number" min={1} max={12} />
              {errors.credits && <p className="text-xs text-destructive">{errors.credits.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Course Title *</Label>
              <Input {...register('title')} placeholder="Introduction to Computer Science" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Input {...register('department')} placeholder="Computer Science" />
            </div>
            <div className="space-y-1">
              <Label>Capacity *</Label>
              <Input {...register('max_enrollment', { valueAsNumber: true })} type="number" placeholder="30" />
            </div>
            <div className="space-y-1">
              <Label>Semester *</Label>
              <Input {...register('semester')} placeholder="Fall 2024" />
            </div>
            <div className="space-y-1">
              <Label>Academic Year</Label>
              <Input {...register('academic_year')} placeholder="2024-2025" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                defaultValue="active"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Course</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CoursesPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseWithFaculty | null>(null);
  const deleteCourse = useDeleteCourse();

  const canCreate = profile?.role === 'super_admin' || profile?.role === 'admin';

  const filters = {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    faculty_id: profile?.role === 'faculty' ? profile.id : undefined,
    student_id: profile?.role === 'student' ? profile.id : undefined,
    page,
    pageSize: 12,
  };

  const { data, isLoading } = useCourses(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Browse and manage university courses."
        icon={<BookOpen className="h-6 w-6" />}
        actions={
          canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />New Course
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as CourseStatus | 'all'); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 opacity-30 mb-4" />
          <p>No courses found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((course) => (
            <Card key={course.id} className="group relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge className="text-xs font-mono">{course.course_code}</Badge>
                  <div className="flex items-center gap-1">
                    <Badge className={STATUS_COLORS[course.status]}>{course.status}</Badge>
                    {canCreate && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id}`}>
                              <Eye className="mr-2 h-4 w-4" />View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(course)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base mt-1">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.max_enrollment ? `${course.max_enrollment} capacity` : 'Unlimited'}
                  </span>
                  <span>{course.credits} credit{course.credits !== 1 ? 's' : ''}</span>
                </div>
                {course.course_faculty && course.course_faculty.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Faculty: {course.course_faculty.map((cf) => cf.faculty.full_name).join(', ')}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <Eye className="mr-2 h-4 w-4" />View Course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.count ?? 0) > 12 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <CreateCourseDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Course"
        description={`Delete "${deleteTarget?.title}"? This will also remove all assignments and enrollments.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          await deleteCourse.mutateAsync(deleteTarget!.id);
          toast.success('Course deleted');
          setDeleteTarget(null);
        }}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
      />
    </div>
  );
}
