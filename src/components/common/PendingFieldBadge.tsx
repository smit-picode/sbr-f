'use client';

import { Clock } from 'lucide-react';

// Tiny inline indicator next to a field label showing how many PENDING change requests
// target that attribute (so users see exactly which fields are awaiting approval).
export function PendingFieldBadge({ count }: { count?: number }) {
  if (!count || count < 1) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700"
      title="Awaiting approval"
    >
      <Clock className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}
