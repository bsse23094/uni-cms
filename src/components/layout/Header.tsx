'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Search, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ROLE_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { toggleMobile } = useSidebar();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Left side: hamburger + title */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden text-foreground/60 hover:text-foreground"
          onClick={toggleMobile}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {title && (
          <h1 className="text-[14px] font-semibold tracking-tight text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder="Search..."
            className="h-8 w-48 rounded-lg border border-border/70 bg-muted/40 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-ring/40 focus:w-56 hover:border-border"
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-foreground/50 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* Profile dropdown */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 items-center gap-2 rounded-lg px-1.5 hover:bg-muted/60"
              >
                <Avatar className="h-7 w-7 ring-1 ring-border/60">
                  <AvatarImage src={profile.avatar_url ?? ''} alt={profile.full_name} />
                  <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-[12.5px] font-medium leading-none text-foreground">{profile.full_name}</p>
                  <p className="mt-0.5 text-[10.5px] leading-none text-muted-foreground">
                    {ROLE_LABELS[profile.role]}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
