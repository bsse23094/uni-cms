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
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_LABELS } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',              icon: LayoutDashboard, roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Overview' },
  { label: 'Users',         href: '/dashboard/users',        icon: Users,           roles: ['super_admin', 'admin'],                       section: 'Manage'   },
  { label: 'Courses',       href: '/dashboard/courses',      icon: BookOpen,        roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Manage'   },
  { label: 'Enrollments',   href: '/dashboard/enrollments',  icon: ClipboardList,   roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Manage'   },
  { label: 'Assignments',   href: '/dashboard/assignments',  icon: FileText,        roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Academic' },
  { label: 'Grades',        href: '/dashboard/grades',       icon: Star,            roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Academic' },
  { label: 'Announcements', href: '/dashboard/announcements',icon: Megaphone,       roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Academic' },
  { label: 'Attendance',    href: '/dashboard/attendance',   icon: Calendar,        roles: ['super_admin', 'admin', 'faculty'],            section: 'Academic' },
  { label: 'Profile',       href: '/dashboard/profile',      icon: User,            roles: ['super_admin', 'admin', 'faculty', 'student'], section: 'Account'  },
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

  // Group items by section, preserving order
  const sections: { label: string; items: NavItem[] }[] = [];
  const seen = new Set<string>();
  for (const item of visibleItems) {
    const sec = item.section ?? '';
    if (!seen.has(sec)) {
      seen.add(sec);
      sections.push({ label: sec, items: [] });
    }
    sections.find((s) => s.label === sec)!.items.push(item);
  }

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col transition-all duration-300 ease-in-out',
        'border-r border-white/[0.06]',
        collapsed ? 'w-[64px]' : 'w-56',
      )}
      style={{ background: 'hsl(var(--sidebar))' }}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.10] ring-1 ring-white/[0.12]">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold tracking-tight text-white">UniCMS</p>
            <p className="truncate text-[9.5px] font-medium uppercase tracking-[0.12em] text-white/40 mt-px">University Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {sections.map((section, si) => (
          <div key={section.label} className={cn(si > 0 && 'mt-5')}>
            {!collapsed && section.label && (
              <p className="mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.35]">
                {section.label}
              </p>
            )}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[8.5px]',
                        'text-[13px] transition-all duration-200 ease-out outline-none',
                        'focus-visible:ring-1 focus-visible:ring-white/30',
                        active
                          ? 'bg-white/[0.11] text-white'
                          : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90',
                      )}
                    >
                      {/* Left active bar */}
                      <span className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200',
                        active ? 'h-5 bg-white/55' : 'h-0 bg-transparent',
                      )} />

                      <Icon className={cn(
                        'h-[16px] w-[16px] shrink-0 transition-all duration-200',
                        active ? 'text-white' : 'text-white/50 group-hover:text-white/80',
                      )} />

                      {!collapsed && (
                        <>
                          <span className={cn(
                            'flex-1 truncate font-[440] tracking-[-0.01em] transition-all duration-200',
                            active ? 'text-white' : 'text-white/60 group-hover:text-white/90',
                          )}>
                            {item.label}
                          </span>
                          {active && (
                            <span className="h-[5px] w-[5px] rounded-full bg-white/50 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {profile && (
        <div className={cn(
          'border-t border-white/[0.06] px-2.5 py-3',
          collapsed ? 'flex justify-center' : '',
        )}>
          <div className={cn('flex items-center gap-2.5', collapsed ? '' : 'w-full')}>
            <Avatar className="h-7 w-7 shrink-0 ring-1 ring-white/[0.14]">
              <AvatarImage src={profile.avatar_url ?? ''} alt={profile.full_name} />
              <AvatarFallback className="bg-white/[0.09] text-[10px] font-semibold text-white/70">
                {profile.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white/80">{profile.full_name}</p>
                <p className="truncate text-[10.5px] text-white/45">{ROLE_LABELS[profile.role]}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'absolute -right-3 top-[4.25rem] z-10',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'border border-white/[0.14] shadow-md shadow-black/40',
          'text-white/35 transition-all duration-200',
          'hover:border-white/[0.28] hover:text-white/75',
        )}
        style={{ background: 'hsl(var(--sidebar))' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>
    </aside>
  );
}
