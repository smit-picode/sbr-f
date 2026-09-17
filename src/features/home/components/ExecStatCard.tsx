'use client';

import type { LucideIcon } from 'lucide-react';

interface ExecStatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  sub: string;
}

// Headline KPI card — icon, big value, label, and a small context line underneath. Kept local
// to the Executive Home feature since nothing else in the app needs this exact shape yet; see
// common-function-rule before promoting it to src/components/common if a second page wants it.
export function ExecStatCard({ icon: Icon, value, label, sub }: ExecStatCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
        <Icon className="h-3.5 w-3.5 text-adaam" />
        {label}
      </div>
      <div className="mt-2 text-[26px] font-extrabold leading-none text-slate-900">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-slate-500">{sub}</div>
    </div>
  );
}
