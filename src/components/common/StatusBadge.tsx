import { Badge } from '@/components/ui/badge';

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

  return <Badge variant={variant} className={className}>{status}</Badge>;
}
