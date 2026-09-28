import { Skeleton } from '@/components/ui/skeleton';
import { TableLoader } from '@/components/common/Loader';

// Mirrors a survey sample's detail screen: header card with counts, distribution panels, filter bar, table.
export function SurveySampleDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[172px] w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[206px] w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-[72px] w-full rounded-lg" />
      <div className="rounded-lg bg-white shadow-card">
        <TableLoader rows={8} cols={9} />
      </div>
    </div>
  );
}
