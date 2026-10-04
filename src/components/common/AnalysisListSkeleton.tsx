import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="shimmer-dark min-h-[172px] w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-full" />
        <Skeleton className="h-10 w-80 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white shadow-card overflow-hidden">
            <Skeleton className="h-[150px] w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
