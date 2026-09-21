'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecStatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  sub: string;
  // Route to open when the card is clicked. Omit (or pass undefined when the viewer lacks the
  // permission for that page) to render a plain, non-interactive card — the reference gates its
  // KPI cards the same way rather than linking somewhere the user would only be refused.
  href?: string;
}

// Headline KPI card — icon, big value, label, and a small context line underneath. Kept local
// to the Executive Home feature since nothing else in the app needs this exact shape yet; see
// common-function-rule before promoting it to src/components/common if a second page wants it.
export function ExecStatCard({ icon: Icon, value, label, sub, href }: ExecStatCardProps) {
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
      <div className="mt-2 text-[26px] font-extrabold leading-none text-slate-900">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-slate-500">{sub}</div>
    </>
  );

  // Rendered as a real <button> only when it navigates, so a non-clickable card stays out of the
  // tab order instead of being a focusable control that does nothing.
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
