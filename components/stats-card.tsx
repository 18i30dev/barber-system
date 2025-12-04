'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-gold',
  className
}: StatsCardProps) {
  return (
    <Card className={cn('bg-zinc-900 border-gold/20 hover:border-gold/40 transition-colors', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          {Icon && <Icon className={cn('w-10 h-10', iconColor)} />}
        </div>
      </CardContent>
    </Card>
  );
}
