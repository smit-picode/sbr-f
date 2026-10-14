'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { HomeScreen } from '../constants';

// Pills in the home banner, shown only to a user whose roles give them more than one home screen.
export function HomeScreenSwitcher({ value, options, onChange }: {
  value: HomeScreen;
  options: { key: HomeScreen; label: string }[];
  onChange: (next: HomeScreen) => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="tablist" aria-label={t('home.switcher.label', { defaultValue: 'Home screen' })} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            'h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
            value === o.key ? 'bg-white text-adaam-deep shadow-soft' : 'text-white/80 hover:text-white',
          )}
        >
          {t(`home.switcher.${o.key}`, { defaultValue: o.label })}
        </button>
      ))}
    </div>
  );
}
