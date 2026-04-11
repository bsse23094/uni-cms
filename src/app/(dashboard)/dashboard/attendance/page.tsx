'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useCourses, useEnrollments } from '@/hooks/useData';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type AttendanceEntry = {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
};

type AttendanceRecord = {
  id: string;
  session_date: string;
  is_present: boolean;
};

export default function AttendancePage() {
  const { profile } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry['status']>>({});
  const [saving, setSaving] = useState(false);

  const isStudent = profile?.role === 'student';

  const { data: courses, isLoading: loadingCourses } = useCourses({
    faculty_id: profile?.role === 'faculty' ? profile.id : undefined,
    student_id: isStudent ? profile?.id : undefined,
    pageSize: 100,
  });

  // Faculty/admin: load enrolled students for the selected course
  const { data: enrollments, isLoading: loadingStudents } = useEnrollments({
    course_id: (!isStudent && selectedCourseId) ? selectedCourseId : undefined,
    status: 'approved',
    pageSize: 100,
  });

  // Student: load own attendance records for the selected course
  const { data: ownAttendance, isLoading: loadingOwnAttendance } = useQuery({
    queryKey: ['attendance', 'student', profile?.id, selectedCourseId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('attendance')
        .select('id, session_date, is_present')
        .eq('student_id', profile!.id)
        .eq('course_id', selectedCourseId)
        .order('session_date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as AttendanceRecord[];
    },
    enabled: isStudent && !!profile?.id && !!selectedCourseId,
  });

  const students = enrollments?.data.map((e) => e.student).filter(Boolean) ?? [];

  const toggleStatus = (studentId: string, status: AttendanceEntry['status']) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const records = students.map((s) => ({
        course_id: selectedCourseId,
        student_id: s!.id,
        session_date: selectedDate,
        is_present: (attendance[s!.id] ?? 'present') === 'present' || (attendance[s!.id] ?? 'present') === 'excused',
        recorded_by: profile?.id ?? 'system',
      }));
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'course_id,student_id,session_date' });
      if (error) throw error;
      toast.success('Attendance saved');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const statuses = ['present', 'absent', 'late', 'excused'] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={isStudent ? 'View your attendance records.' : 'Mark and manage class attendance.'}
        icon={<Calendar className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select a course…" />
          </SelectTrigger>
          <SelectContent>
            {loadingCourses ? (
              <SelectItem value="_loading" disabled>Loading…</SelectItem>
            ) : (
              courses?.data.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.title}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!isStudent && (
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-44"
          />
        )}
      </div>

      {!selectedCourseId ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 opacity-30 mb-4" />
          <p>Select a course to view attendance.</p>
        </div>
      ) : isStudent ? (
        // ── Student view: show own attendance records ──
        loadingOwnAttendance ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (ownAttendance ?? []).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 opacity-30 mb-4" />
            <p>No attendance records found for this course yet.</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {(ownAttendance ?? []).map((record) => (
                  <li key={record.id} className="flex items-center justify-between py-3">
                    <span className="text-sm">{formatDate(record.session_date)}</span>
                    <Badge variant={record.is_present ? 'success' : 'destructive'}>
                      {record.is_present ? 'Present' : 'Absent'}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                {(ownAttendance ?? []).filter((r) => r.is_present).length} present ·{' '}
                {(ownAttendance ?? []).filter((r) => !r.is_present).length} absent out of{' '}
                {(ownAttendance ?? []).length} sessions
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        // ── Faculty/admin view: mark attendance for students ──
        loadingStudents ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No enrolled students in this course.</p>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Attendance — {selectedDate}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{Object.values(attendance).filter((v) => v === 'present').length} present</span>
                  <span>{Object.values(attendance).filter((v) => v === 'absent').length} absent</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {students.map((student) => {
                    if (!student) return null;
                    const currentStatus = attendance[student.id] ?? 'present';
                    return (
                      <li key={student.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar_url ?? undefined} />
                            <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center">
                          {statuses.map((s) => (
                            <Button
                              key={s}
                              variant={currentStatus === s ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 px-1.5 text-[11px] sm:px-2 sm:text-xs capitalize"
                              onClick={() => toggleStatus(student.id, s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                <Save className="mr-2 h-4 w-4" />Save Attendance
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
}
