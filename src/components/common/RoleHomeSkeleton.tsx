import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the steward and reviewer homes below their header: KPI cards and lists.
export function RoleHomeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-lg bg-white p-4 shadow-card">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg bg-white p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
        <div className="space-y-3 rounded-lg bg-white p-5 shadow-card">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
      <div className="space-y-3 rounded-lg bg-white p-5 shadow-card">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    </div>
  );
}
