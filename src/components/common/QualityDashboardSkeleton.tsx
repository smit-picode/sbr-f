import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the Quality Dashboard: gauge, dimensions, table cards, then the selected table's panels.
export function QualityDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-5 rounded-xl bg-white p-5 shadow-card">
          <Skeleton className="h-[132px] w-[132px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="space-y-3 rounded-xl bg-white p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 rounded-xl bg-white p-5 shadow-card lg:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
        <div className="space-y-3 rounded-xl bg-white p-5 shadow-card lg:col-span-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    </div>
  );
}
