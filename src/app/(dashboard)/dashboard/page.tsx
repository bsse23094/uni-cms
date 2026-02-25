'use client';

import { useAuth } from '@/context/AuthContext';
import {
  useAdminStats,
  useFacultyStats,
  useStudentStats,
} from '@/hooks/useData';
import { useAnnouncements } from '@/hooks/useData';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  BookOpen,
  ClipboardList,
  Star,
  AlertCircle,
  Bell,
  FileText,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { formatDate, timeAgo, ROLE_LABELS } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// ---- Admin Dashboard ----
function AdminDashboard() {
  const { data, isLoading } = useAdminStats();
  const { data: announcements } = useAnnouncements({ pageSize: 5 });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const stats = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-muted-foreground mb-1">Overview</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} iconColor="text-blue-500" />
        <StatsCard title="Total Courses" value={stats?.totalCourses ?? 0} icon={BookOpen} iconColor="text-purple-500" />
        <StatsCard title="Enrollments" value={stats?.totalEnrollments ?? 0} icon={ClipboardList} iconColor="text-green-500" />
        <StatsCard
          title="Pending Enrollments"
          value={stats?.pendingEnrollments ?? 0}
          icon={AlertCircle}
          iconColor="text-yellow-500"
          description="Awaiting approval"
        />
        <StatsCard title="Faculty" value={stats?.totalFaculty ?? 0} icon={Users} iconColor="text-indigo-500" />
        <StatsCard title="Students" value={stats?.totalStudents ?? 0} icon={Users} iconColor="text-pink-500" />
        <StatsCard title="Active Courses" value={stats?.activeCourses ?? 0} icon={TrendingUp} iconColor="text-emerald-500" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/users"><Users className="mr-2 h-4 w-4" />Manage Users</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/courses"><BookOpen className="mr-2 h-4 w-4" />Manage Courses</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/enrollments"><ClipboardList className="mr-2 h-4 w-4" />Review Enrollments</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/announcements"><Bell className="mr-2 h-4 w-4" />Post Announcement</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Announcements</CardTitle></CardHeader>
          <CardContent>
            {announcements?.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
            <ul className="space-y-3">
              {announcements?.data.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                  </div>
                  {a.is_pinned && <Badge variant="info" className="shrink-0">Pinned</Badge>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Faculty Dashboard ----
function FacultyDashboard({ userId }: { userId: string }) {
  const { data, isLoading } = useFacultyStats(userId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Courses Taught" value={data?.coursesTaught ?? 0} icon={BookOpen} iconColor="text-blue-500" />
        <StatsCard title="Total Students" value={data?.totalStudents ?? 0} icon={Users} iconColor="text-green-500" />
        <StatsCard title="Pending Submissions" value={data?.pendingSubmissions ?? 0} icon={FileText} iconColor="text-yellow-500" description="Awaiting grading" />
        <StatsCard title="Upcoming Deadlines" value={data?.upcomingAssignments ?? 0} icon={Calendar} iconColor="text-purple-500" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/courses"><BookOpen className="mr-2 h-4 w-4" />My Courses</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/assignments"><FileText className="mr-2 h-4 w-4" />Assignments</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/grades"><Star className="mr-2 h-4 w-4" />Grade Submissions</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/attendance"><Calendar className="mr-2 h-4 w-4" />Attendance</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Student Dashboard ----
function StudentDashboard({ userId }: { userId: string }) {
  const { data, isLoading } = useStudentStats(userId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Enrolled Courses" value={data?.enrolledCourses ?? 0} icon={BookOpen} iconColor="text-blue-500" />
        <StatsCard title="Upcoming Deadlines" value={data?.upcomingDeadlines ?? 0} icon={Calendar} iconColor="text-red-500" description="Due within 7 days" />
        <StatsCard title="Submitted Assignments" value={data?.completedAssignments ?? 0} icon={FileText} iconColor="text-green-500" />
        <StatsCard
          title="Average Grade"
          value={data?.averageGrade !== null ? `${data?.averageGrade}%` : 'N/A'}
          icon={Star}
          iconColor="text-yellow-500"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/courses"><BookOpen className="mr-2 h-4 w-4" />Browse Courses</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/enrollments"><ClipboardList className="mr-2 h-4 w-4" />My Enrollments</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/assignments"><FileText className="mr-2 h-4 w-4" />My Assignments</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard/grades"><Star className="mr-2 h-4 w-4" />My Grades</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Main Dashboard Page ----
export default function DashboardPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {greeting()}, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {ROLE_LABELS[profile.role]} &mdash; {formatDate(new Date())}
        </p>
      </div>

      {(profile.role === 'super_admin' || profile.role === 'admin') && <AdminDashboard />}
      {profile.role === 'faculty' && <FacultyDashboard userId={profile.id} />}
      {profile.role === 'student' && <StudentDashboard userId={profile.id} />}
    </div>
  );
}
