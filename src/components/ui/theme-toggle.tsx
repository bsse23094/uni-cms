'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn(
        'h-8 w-[58px] rounded-full border border-border bg-muted',
        className,
      )} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex h-8 w-[58px] items-center rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDark
          ? 'border-white/[0.12] bg-white/[0.07] hover:bg-white/[0.12]'
          : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200',
        className,
      )}
    >
      {/* Track icons */}
      <span className={cn(
        'absolute left-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-all duration-300',
        isDark
          ? 'translate-x-[26px] bg-white/[0.14]'
          : 'translate-x-0 bg-white shadow-zinc-200/80',
      )}>
        {isDark
          ? <Moon className="h-3 w-3 text-white/80" />
          : <Sun className="h-3 w-3 text-zinc-600" />
        }
      </span>
      {/* Opposite icon hint */}
      <span className={cn(
        'absolute transition-all duration-300 opacity-40',
        isDark ? 'left-2' : 'right-2',
      )}>
        {isDark
          ? <Sun className="h-2.5 w-2.5 text-white/50" />
          : <Moon className="h-2.5 w-2.5 text-zinc-500" />
        }
      </span>
    </button>
  );
}
