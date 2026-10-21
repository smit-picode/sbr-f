'use client';

import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SourceTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  column: string | undefined;
  columns: string[];
  onColumnChange: (column: string) => void;
  loading?: boolean;
}

export function SourceTableSearch({ value, onChange, column, columns, onColumnChange, loading = false }: SourceTableSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-card">
      <SearchInput
        className="shadow-none"
        value={value}
        onChange={onChange}
        placeholder={t('sourceCatalog.searchPlaceholder', { defaultValue: 'Search {{column}}...', column: column ?? '' })}
        loading={loading}
      />
      <span className="text-xs text-slate-500">{t('sourceCatalog.searchIn', { defaultValue: 'in' })}</span>
      <Select value={column ?? ''} onValueChange={onColumnChange}>
        <SelectTrigger className="h-10 w-64 shadow-none" aria-label={t('sourceCatalog.searchColumn', { defaultValue: 'Column to search' })}>
          <SelectValue placeholder={t('sourceCatalog.searchColumn', { defaultValue: 'Column to search' })} />
        </SelectTrigger>
        <SelectContent>
          {columns.map((c) => (
            <SelectItem key={c} value={c} className="font-mono text-xs">{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
