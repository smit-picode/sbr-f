'use client';

import { useTranslation } from 'react-i18next';
import { Gauge, PenLine } from 'lucide-react';
import { useRouter } from '@/hooks/useAppRouter';
import { useHasPermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/quality/dashboard', icon: Gauge, key: 'dq.tabs.score', label: 'Quality score' },
  { href: '/quality/corrections', icon: PenLine, key: 'dq.tabs.corrections', label: 'NPC corrections' },
];

// Switch between the two Data Quality views; both read data_quality.view, so a viewer of one can open the other.
export function QualityTabs({ active }: { active: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const canView = useHasPermission('data_quality.view');
  if (!canView) return null;
  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-card">
      {TABS.map(({ href, icon: Icon, key, label }) => (
        <button
          key={href}
          type="button"
          role="tab"
          aria-selected={active === href}
          onClick={() => active !== href && router.push(href)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40',
            active === href ? 'bg-adaam text-white shadow-soft' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {t(key, { defaultValue: label })}
        </button>
      ))}
    </div>
  );
}
