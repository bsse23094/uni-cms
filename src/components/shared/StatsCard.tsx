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
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-500')}>
                {trend.positive ? '+' : '-'}{Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/50 p-2.5 transition-all duration-200 group-hover:bg-muted group-hover:border-border">
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
