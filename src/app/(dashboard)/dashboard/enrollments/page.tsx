'use client';

import { useState } from 'react';
import {
  useEnrollments,
  useUpdateEnrollmentStatus,
  useEnrollStudent,
  useCourses,
} from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { EnrollmentWithDetails, EnrollmentStatus } from '@/types';
import { ENROLLMENT_STATUS_COLORS, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// ---- Enroll Dialog (Student) ----
function EnrollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const { data: courses } = useCourses({ status: 'active', pageSize: 100 });
  const enrollStudent = useEnrollStudent();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!selectedCourseId || !profile) return;
    setLoading(true);
    try {
      await enrollStudent.mutateAsync({ courseId: selectedCourseId, studentId: profile.id });
      toast.success('Enrollment request submitted');
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Enroll in a Course</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course…" />
            </SelectTrigger>
            <SelectContent>
              {courses?.data.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.course_code} — {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={!selectedCourseId} loading={loading}>
              Request Enrollment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EnrollmentsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showEnroll, setShowEnroll] = useState(false);
  const [approveTarget, setApproveTarget] = useState<EnrollmentWithDetails | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EnrollmentWithDetails | null>(null);

  const updateStatus = useUpdateEnrollmentStatus();
  const isStudent = profile?.role === 'student';
  const canManage = !isStudent;

  const filters = {
    student_id: isStudent ? profile?.id : undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useEnrollments(filters);

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (e: EnrollmentWithDetails) => (
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
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (e: EnrollmentWithDetails) => (
        <div>
          <p className="text-sm font-medium">{e.course?.title}</p>
          <p className="text-xs text-muted-foreground font-mono">{e.course?.course_code}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (e: EnrollmentWithDetails) => (
        <Badge className={ENROLLMENT_STATUS_COLORS[e.status]}>{e.status}</Badge>
      ),
    },
    {
      key: 'date',
      label: 'Requested',
      render: (e: EnrollmentWithDetails) => (
        <span className="text-sm text-muted-foreground">{formatDate(e.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (e: EnrollmentWithDetails) => {
        if (!canManage || e.status !== 'pending') return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setApproveTarget(e)}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setRejectTarget(e)}
              >
                <XCircle className="mr-2 h-4 w-4" />Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description={isStudent ? 'Your course enrollments.' : 'Manage all enrollment requests.'}
        icon={<ClipboardList className="h-6 w-6" />}
        actions={
          isStudent && (
            <Button onClick={() => setShowEnroll(true)}>
              <Plus className="mr-2 h-4 w-4" />Enroll in Course
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-3">
        {!isStudent && (
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        )}
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as EnrollmentStatus | 'all'); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        emptyMessage="No enrollments found."
      />

      <EnrollDialog open={showEnroll} onClose={() => setShowEnroll(false)} />

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve Enrollment"
        description={`Approve ${approveTarget?.student?.full_name} for ${approveTarget?.course?.title}?`}
        confirmLabel="Approve"
        onConfirm={async () => {
          await updateStatus.mutateAsync({ id: approveTarget!.id, status: 'approved' });
          toast.success('Enrollment approved');
          setApproveTarget(null);
        }}
        onOpenChange={(v) => { if (!v) setApproveTarget(null); }}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject Enrollment"
        description={`Reject ${rejectTarget?.student?.full_name}'s enrollment request?`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={async () => {
          await updateStatus.mutateAsync({ id: rejectTarget!.id, status: 'rejected' });
          toast.success('Enrollment rejected');
          setRejectTarget(null);
        }}
        onOpenChange={(v) => { if (!v) setRejectTarget(null); }}
      />
    </div>
  );
}
