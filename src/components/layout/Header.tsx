'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Settings, User, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
import { Input } from '@/components/ui/input';
import { ROLE_LABELS, ROLE_COLORS, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Page title */}
      <div>
        {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications (placeholder – extend with realtime) */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Profile dropdown */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url ?? ''} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className={cn('mt-0.5 w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold', ROLE_COLORS[profile.role])}>
                    {ROLE_LABELS[profile.role]}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
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
