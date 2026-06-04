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

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-700 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
