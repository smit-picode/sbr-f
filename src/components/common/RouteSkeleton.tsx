import { Skeleton } from '@/components/ui/skeleton';

// Generic page frame (banner, toolbar, table) shown instantly while a route loads.
export function RouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="shimmer-dark min-h-[172px] w-full rounded-3xl" />
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-card">
        <Skeleton className="h-10 w-80 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="ms-auto h-10 w-28 rounded-full" />
      </div>
      <div className="rounded-lg bg-white shadow-card overflow-hidden">
        <div className="flex gap-6 border-b border-slate-100 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-3 flex-1" />)}
        </div>
        {Array.from({ length: 8 }).map((_, r) => (
          <div key={r} className="flex gap-6 border-b border-slate-50 px-4 py-3.5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-3.5 flex-1" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
