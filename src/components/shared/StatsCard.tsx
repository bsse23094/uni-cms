import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  iconColor = 'text-foreground',
}: StatsCardProps) {
  return (
    <Card className={cn('group', className)}>
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/70 truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-500')}>
                {trend.positive ? '+' : '-'}{Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/50 p-1.5 sm:p-2.5 transition-all duration-200 group-hover:bg-muted group-hover:border-border shrink-0">
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
