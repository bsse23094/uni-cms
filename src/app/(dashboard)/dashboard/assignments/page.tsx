'use client';

import { useState } from 'react';
import { useAssignments } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, ExternalLink } from 'lucide-react';
import { formatDateTime, describeDueDate } from '@/lib/utils';
import type { Assignment } from '@/types';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filters = {
    search: search || undefined,
    faculty_id: profile?.role === 'faculty' ? profile.id : undefined,
    student_id: profile?.role === 'student' ? profile.id : undefined,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useAssignments(filters);

  const columns = [
    {
      key: 'title',
      label: 'Assignment',
      render: (a: Assignment) => (
        <div>
          <p className="text-sm font-medium">{a.title}</p>
          {a.instructions && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.instructions}</p>
          )}
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (a: Assignment) => (
        <span className="text-sm font-medium">{a.max_points}</span>
      ),
    },
    {
      key: 'due',
      label: 'Due Date',
      render: (a: Assignment) => (
        <div>
          <p className="text-sm">{formatDateTime(a.due_date)}</p>
          <p className="text-xs text-yellow-600">{describeDueDate(a.due_date).label}</p>
        </div>
      ),
    },
    {
      key: 'late',
      label: 'Late',
      render: (a: Assignment) => (
        <Badge variant={a.allow_late ? 'success' : 'destructive'}>
          {a.allow_late ? 'Allowed' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (a: Assignment) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/courses/${a.course_id}/assignments/${a.id}`}>
            <ExternalLink className="mr-1 h-4 w-4" />View
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description={profile?.role === 'student' ? 'All assignments across your courses.' : 'All assignments across courses.'}
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        emptyMessage="No assignments found."
      />
    </div>
  );
}
