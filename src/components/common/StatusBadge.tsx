import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;

  const variant =
    status === 'Active'
      ? 'success'
      : status === 'Inactive'
        ? 'destructive'
        : 'secondary';

  const dotColor = status === 'Active' ? 'bg-pos' : status === 'Inactive' ? 'bg-neg' : 'bg-slate-400';

  return (
    <Badge variant={variant} className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />
      {status}
    </Badge>
  );
}
