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
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Overview</h2>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} iconColor="text-muted-foreground" />
        <StatsCard title="Total Courses" value={stats?.totalCourses ?? 0} icon={BookOpen} iconColor="text-muted-foreground" />
        <StatsCard title="Enrollments" value={stats?.totalEnrollments ?? 0} icon={ClipboardList} iconColor="text-muted-foreground" />
        <StatsCard
          title="Pending Enrollments"
          value={stats?.pendingEnrollments ?? 0}
          icon={AlertCircle}
          iconColor="text-amber-500 dark:text-amber-400"
          description="Awaiting approval"
        />
        <StatsCard title="Faculty" value={stats?.totalFaculty ?? 0} icon={Users} iconColor="text-muted-foreground" />
        <StatsCard title="Students" value={stats?.totalStudents ?? 0} icon={Users} iconColor="text-muted-foreground" />
        <StatsCard title="Active Courses" value={stats?.activeCourses ?? 0} icon={TrendingUp} iconColor="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Quick actions + Recent announcements */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
                <Link href="/dashboard/users"><Users className="h-4 w-4 shrink-0" /><span className="truncate">Manage Users</span></Link>
              </Button>
              <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
                <Link href="/dashboard/courses"><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">Manage Courses</span></Link>
              </Button>
              <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
                <Link href="/dashboard/enrollments"><ClipboardList className="h-4 w-4 shrink-0" /><span className="truncate">Review Enrollments</span></Link>
              </Button>
              <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
                <Link href="/dashboard/announcements"><Bell className="h-4 w-4 shrink-0" /><span className="truncate">Post Announcement</span></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements?.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
            <ul className="space-y-3">
              {announcements?.data.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                  {a.is_pinned && <Badge variant="info" className="shrink-0 text-[10px]">Pinned</Badge>}
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Courses Taught" value={data?.coursesTaught ?? 0} icon={BookOpen} iconColor="text-muted-foreground" />
        <StatsCard title="Total Students" value={data?.totalStudents ?? 0} icon={Users} iconColor="text-muted-foreground" />
        <StatsCard title="Pending Submissions" value={data?.pendingSubmissions ?? 0} icon={FileText} iconColor="text-amber-500 dark:text-amber-400" description="Awaiting grading" />
        <StatsCard title="Upcoming Deadlines" value={data?.upcomingAssignments ?? 0} icon={Calendar} iconColor="text-muted-foreground" />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/courses"><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">My Courses</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/assignments"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">Assignments</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/grades"><Star className="h-4 w-4 shrink-0" /><span className="truncate">Grade Submissions</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/attendance"><Calendar className="h-4 w-4 shrink-0" /><span className="truncate">Attendance</span></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Enrolled Courses" value={data?.enrolledCourses ?? 0} icon={BookOpen} iconColor="text-muted-foreground" />
        <StatsCard title="Upcoming Deadlines" value={data?.upcomingDeadlines ?? 0} icon={Calendar} iconColor="text-red-500 dark:text-red-400" description="Due within 7 days" />
        <StatsCard title="Submitted Assignments" value={data?.completedAssignments ?? 0} icon={FileText} iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatsCard
          title="Average Grade"
          value={data?.averageGrade !== null ? `${data?.averageGrade}%` : 'N/A'}
          icon={Star}
          iconColor="text-amber-500 dark:text-amber-400"
        />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/courses"><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">Browse Courses</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/enrollments"><ClipboardList className="h-4 w-4 shrink-0" /><span className="truncate">My Enrollments</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/assignments"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">My Assignments</span></Link>
            </Button>
            <Button asChild variant="outline" className="h-9 justify-start gap-2 px-3 text-xs" size="sm">
              <Link href="/dashboard/grades"><Star className="h-4 w-4 shrink-0" /><span className="truncate">My Grades</span></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Dashboard Page ----
export default function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Unable to load profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your session was found, but profile data is not available yet. Please try again in a moment.
        </p>
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {greeting()}, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[profile.role]} &mdash; {formatDate(new Date())}
        </p>
      </div>

      {(profile.role === 'super_admin' || profile.role === 'admin') && <AdminDashboard />}
      {profile.role === 'faculty' && <FacultyDashboard userId={profile.id} />}
      {profile.role === 'student' && <StudentDashboard userId={profile.id} />}
    </div>
  );
}
