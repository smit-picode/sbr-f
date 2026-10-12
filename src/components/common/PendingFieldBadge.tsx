'use client';

import { Clock } from 'lucide-react';

// Inline badge showing how many pending change requests target a field.
export function PendingFieldBadge({ count }: { count?: number }) {
  if (!count || count < 1) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700"
      title="Awaiting approval"
    >
      <Clock className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}
