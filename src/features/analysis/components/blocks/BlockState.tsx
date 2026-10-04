'use client';

import { SearchX, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export function BlockSkeleton({ height, variant = 'chart' }: { height: number; variant?: 'chart' | 'table' | 'kpi' }) {
  if (variant === 'kpi') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ minHeight: 96 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'table') {
    return (
      <div className="space-y-2" style={{ minHeight: Math.min(height, 260) }}>
        <Skeleton className="h-7 w-full rounded-md" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full rounded-md" />)}
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2.5 px-2 pb-2" style={{ height }}>
      {[62, 88, 45, 74, 38, 55, 28, 66].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function BlockEmpty({ height, message }: { height: number; message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-400" style={{ minHeight: Math.min(height, 200) }}>
      <SearchX className="h-6 w-6 mb-2" />
      <p className="text-[12.5px] font-medium text-slate-500">{message ?? t('analysis.empty.noUnits', { defaultValue: 'No units match these filters' })}</p>
    </div>
  );
}

export function BlockError({ height }: { height: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center text-neg-text" style={{ minHeight: Math.min(height, 200) }}>
      <TriangleAlert className="h-6 w-6 mb-2" />
      <p className="text-[12.5px] font-medium">{t('analysis.empty.error', { defaultValue: 'This block could not be computed.' })}</p>
    </div>
  );
}
