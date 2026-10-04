import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="shimmer-dark min-h-[172px] w-full rounded-3xl" />
      <div className="rounded-2xl bg-white shadow-card px-4 py-3 flex flex-wrap items-center gap-4">
        <Skeleton className="h-8 w-44 rounded-full" />
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="ms-auto h-8 w-32 rounded-full" />
      </div>
      <div className="rounded-2xl bg-white shadow-card p-5 grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white shadow-card p-4 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
