'use client';

import { useState } from 'react';
import { useSubmissions, useStudentGPA, useCourses } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, ExternalLink, TrendingUp } from 'lucide-react';
import { formatDateTime, SUBMISSION_STATUS_COLORS, pointsToGrade } from '@/lib/utils';
import type { SubmissionWithDetails } from '@/types';
import Link from 'next/link';

export default function GradesPage() {
  const { profile } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const isStudent = profile?.role === 'student';
  const { data: courses } = useCourses({
    faculty_id: profile?.role === 'faculty' ? profile.id : undefined,
    student_id: isStudent ? profile?.id : undefined,
    pageSize: 100,
  });
  const { data: gpa } = useStudentGPA(isStudent ? profile?.id : undefined);

  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    student_id: isStudent ? profile?.id : undefined,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useSubmissions(filters);

  const columns = [
    {
      key: 'assignment',
      label: 'Assignment',
      render: (s: SubmissionWithDetails) => (
        <div>
          <p className="text-sm font-medium">{s.assignment?.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {s.assignment?.max_points} pts
          </p>
        </div>
      ),
    },
    ...(!isStudent ? [{
      key: 'student',
      label: 'Student',
      render: (s: SubmissionWithDetails) => (
        <p className="text-sm">{s.student?.full_name}</p>
      ),
    }] : []),
    {
      key: 'status',
      label: 'Status',
      render: (s: SubmissionWithDetails) => (
        <Badge className={SUBMISSION_STATUS_COLORS[s.status]}>{s.status}</Badge>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (s: SubmissionWithDetails) => {
        if (s.grade?.points === undefined || s.grade?.points === null) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const max = s.assignment?.max_points ?? 100;
        const pct = Math.round((s.grade.points / max) * 100);
        return (
          <div>
            <span className="text-sm font-semibold">{s.grade.points}/{max}</span>
            <span className="text-xs text-muted-foreground ml-2">({pct}% · {pointsToGrade(s.grade.points, max)})</span>
          </div>
        );
      },
    },
    {
      key: 'feedback',
      label: 'Feedback',
      render: (s: SubmissionWithDetails) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-48">
          {s.grade?.feedback ?? '—'}
        </p>
      ),
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (s: SubmissionWithDetails) => (
        <span className="text-xs text-muted-foreground">
          {s.submitted_at ? formatDateTime(s.submitted_at) : 'Not submitted'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (s: SubmissionWithDetails) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/courses/${s.assignment?.course_id}/assignments/${s.assignment_id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        description={isStudent ? 'Your grades and GPA overview.' : 'Manage submissions and grades.'}
        icon={<Star className="h-6 w-6" />}
      />

      {/* GPA display for students */}
      {isStudent && gpa !== null && gpa !== undefined && (
        <Card className="max-w-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <TrendingUp className="h-10 w-10 text-primary opacity-80" />
            <div>
              <p className="text-3xl font-bold">{gpa.gpa.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Cumulative GPA</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setPage(1); }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses?.data.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
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
        emptyMessage="No submissions found."
      />
    </div>
  );
}
