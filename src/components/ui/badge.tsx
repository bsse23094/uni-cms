import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-border/60 bg-muted text-muted-foreground',
        secondary:   'border-border/40 bg-muted/60 text-muted-foreground/70',
        destructive: 'border-red-500/20 bg-red-500/[0.10] text-red-500 dark:text-red-400',
        outline:     'border-border bg-transparent text-foreground/65',
        success:     'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning:     'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        info:        'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
