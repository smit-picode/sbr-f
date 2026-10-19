'use client';

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check } from 'lucide-react';
import type { SamplePublishAccount } from '@/types';

// The system accounts a sample is shared with; an account that cannot read samples yet is flagged.
export function SampleAccountPicker({ accounts, value, onChange }: {
  accounts: SamplePublishAccount[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const { t } = useTranslation();
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const flagged = accounts.filter((a) => value.includes(a.id) && (!a.canRead || !a.isActive));

  if (accounts.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {t('sampling.publish.noAccounts', { defaultValue: 'No system accounts yet. Create one under Administration, System Accounts.' })}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {accounts.map((a) => {
          const on = value.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              aria-pressed={on}
              title={a.clientId}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${on
                ? 'border-[#A29374] bg-[#F4F0E8] text-[#87795D]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              {on && <Check className="h-3 w-3" />}
              {a.name}
              {(!a.canRead || !a.isActive) && <AlertTriangle className="h-3 w-3 text-amber-600" />}
            </button>
          );
        })}
      </div>
      {flagged.map((a) => (
        <p key={a.id} className="text-xs text-amber-700">
          {!a.isActive
            ? t('sampling.publish.accountInactive', { defaultValue: '{{name}} is deactivated: it cannot fetch anything until it is active again.', name: a.name })
            : t('sampling.publish.accountCannotRead', { defaultValue: "{{name}}'s role lacks integration.read_samples: it cannot fetch this sample until the role grants it.", name: a.name })}
        </p>
      ))}
    </div>
  );
}
