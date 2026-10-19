import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the Sample Builder: five numbered step cards, allocation the tallest.
export function SampleBuilderSkeleton() {
  const heights = ['h-10', 'h-24', 'h-24', 'h-56', 'h-16'];
  return (
    <div className="space-y-4">
      {heights.map((h, i) => (
        <div key={i} className="rounded-xl bg-white p-5 shadow-card">
          <div className="mb-4 flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>
          </div>
          <Skeleton className={`${h} w-full`} />
        </div>
      ))}
    </div>
  );
}
