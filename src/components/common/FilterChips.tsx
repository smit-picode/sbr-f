'use client';

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

/**
 * Row of removable chips for the currently-active filters.
 * Renders nothing when no filters are active.
 */
export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  const { t } = useTranslation();
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg">
      <span className="text-xs font-semibold text-slate-500 me-1">
        {chips.length}{' '}
        {chips.length === 1
          ? t('filters.filterOne', { defaultValue: 'filter' })
          : t('filters.filterMany', { defaultValue: 'filters' })}
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={t('filters.removeFilter', { defaultValue: 'Remove filter' })}
            className="text-slate-400 hover:text-[#A71D3A] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-[#A71D3A] hover:underline ms-1"
      >
        {t('filters.clearAll', { defaultValue: 'Clear all' })}
      </button>
    </div>
  );
}
