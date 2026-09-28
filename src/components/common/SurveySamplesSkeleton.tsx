import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the Survey Samples overview below its filter bar: KPI cards, distribution panels, cross-tab, rate chart, table.
export function SurveySamplesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px] w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[206px] w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-[420px] w-full rounded-xl" />
      <Skeleton className="h-[260px] w-full rounded-xl" />
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}
