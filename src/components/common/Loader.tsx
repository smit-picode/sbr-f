import { Skeleton } from '@/components/ui/skeleton';

interface LoaderProps {
  rows?: number;
  cols?: number;
}

export function TableLoader({ rows = 10, cols = 6 }: LoaderProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-2">
              <Skeleton className="h-3 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Shimmer skeleton mirroring a detail page (back link → header band → highlight strip →
// two-column attribute cards). Rendered inside the page's PageContainer.
export function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full rounded-lg" />

      {/* Highlight strip */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column attribute cards */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, c) => (
          <div key={c} className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
