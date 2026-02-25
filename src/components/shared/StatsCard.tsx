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
  iconColor = 'text-primary',
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-500')}>
                {trend.positive ? '+' : '-'}{Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={cn('rounded-full bg-primary/10 p-3', iconColor.replace('text-', 'bg-').concat('/10'))}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
