import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the source table viewer: toolbar strip, header row and body rows.
export function SourceTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="space-y-3 rounded-lg bg-white p-4 shadow-card">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
