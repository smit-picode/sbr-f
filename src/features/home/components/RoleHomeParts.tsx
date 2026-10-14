'use client';

import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prettyTableName } from '@/features/auditLog/components/AuditLogColumns';
import { daysSince } from '../utils/greeting';

export function HomeCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg bg-white p-5 shadow-card', className)}>{children}</div>;
}

export function HomeCardHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[13.5px] font-bold text-slate-800">{title}</h2>
        {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// "View all" style link in a card's header; rendered only when the viewer may open the target.
export function HomeCardLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-adaam hover:text-adaam-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40 rounded"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
    </button>
  );
}

const REQUEST_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-warn-tint text-warn-text',
  APPROVED: 'bg-pos-tint text-pos-text',
  REJECTED: 'bg-neg-tint text-neg-text',
};

export function RequestStatusChip({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold', REQUEST_STATUS_CLASS[status] ?? 'bg-slate-100 text-slate-600')}>
      {t(`home.role.status.${status}`, { defaultValue: status.charAt(0) + status.slice(1).toLowerCase() })}
    </span>
  );
}

export function TableChip({ tableName }: { tableName: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-adaam-tint px-2 py-0.5 text-[10.5px] font-semibold text-adaam-deep">
      {prettyTableName(tableName)}
    </span>
  );
}

export function WaitingFor({ since }: { since: string | null | undefined }) {
  const { t } = useTranslation();
  const days = daysSince(since);
  if (days == null) return <span className="text-slate-400">—</span>;
  const label = days === 0
    ? t('home.role.today', { defaultValue: 'today' })
    : t('home.role.daysCount', { defaultValue: '{{count}} days', count: days });
  return <span className={cn('whitespace-nowrap tabular-nums', days >= 7 ? 'font-semibold text-neg-text' : 'text-slate-500')}>{label}</span>;
}

// One clickable (or plain, without access) list row inside a home card.
export function HomeListRow({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const cls = 'flex w-full items-center gap-3 rounded-md px-2 py-2 text-start text-sm';
  if (!onClick) return <div className={cls}>{children}</div>;
  return (
    <button type="button" onClick={onClick} className={cn(cls, 'transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40')}>
      {children}
    </button>
  );
}
