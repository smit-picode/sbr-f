'use client';

import type { ReactNode } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecStatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  sub: string;
  href?: string;
  valueNote?: ReactNode;
}

// Headline KPI card — icon, big value, label, and a small context line underneath.
export function ExecStatCard({ icon: Icon, value, label, sub, href, valueNote }: ExecStatCardProps) {
  const router = useRouter();

  const body = (
    <>
      <div className="flex w-full items-center gap-2 text-[11px] font-bold text-slate-400">
        <Icon className="h-3.5 w-3.5 shrink-0 text-adaam" />
        {label}
        {href && (
          <ArrowUpRight className="ms-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-adaam rtl:-scale-x-100" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[26px] font-extrabold leading-none text-slate-900">{value}</span>
        {valueNote}
      </div>
      <div className="mt-1.5 text-[11.5px] text-slate-500">{sub}</div>
    </>
  );

  if (!href) {
    return <div className="rounded-lg bg-white p-4 shadow-card">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={cn(
        'group flex w-full cursor-pointer flex-col items-start rounded-lg bg-white p-4 text-start shadow-card',
        'transition-shadow hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40'
      )}
    >
      {body}
    </button>
  );
}
