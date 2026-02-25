'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Star,
  Megaphone,
  Calendar,
  User,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['super_admin', 'admin'] },
  { label: 'Courses', href: '/dashboard/courses', icon: BookOpen, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Enrollments', href: '/dashboard/enrollments', icon: ClipboardList, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Assignments', href: '/dashboard/assignments', icon: FileText, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Grades', href: '/dashboard/grades', icon: Star, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone, roles: ['super_admin', 'admin', 'faculty', 'student'] },
  { label: 'Attendance', href: '/dashboard/attendance', icon: Calendar, roles: ['super_admin', 'admin', 'faculty'] },
  { label: 'Profile', href: '/dashboard/profile', icon: User, roles: ['super_admin', 'admin', 'faculty', 'student'] },
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => profile && item.roles.includes(profile.role),
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sidebar-foreground">UniCMS</p>
            <p className="truncate text-xs text-muted-foreground">University Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {profile && (
        <div className={cn('border-t p-3', collapsed ? 'flex justify-center' : '')}>
          <div className={cn('flex items-center gap-3', collapsed ? '' : 'w-full')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profile.avatar_url ?? ''} alt={profile.full_name} />
              <AvatarFallback>{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{profile.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
