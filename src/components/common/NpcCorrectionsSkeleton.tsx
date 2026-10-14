import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the NPC corrections page below its header: KPI cards, the two breakdown charts, the trend, then the table.
export function NpcCorrectionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-lg bg-white p-4 shadow-card">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 rounded-lg bg-white p-5 shadow-card lg:col-span-3">
          <Skeleton className="h-4 w-44" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
        <div className="space-y-3 rounded-lg bg-white p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-card">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-[200px] w-full" />
      </div>
      <div className="space-y-3 rounded-lg bg-white p-5 shadow-card">
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    </div>
  );
}
