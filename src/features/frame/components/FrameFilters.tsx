'use client';

import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { FrameFilters } from '@/types';
import { EST_STATUS_OPTIONS, SECTOR_OPTIONS, SOURCE_CODE_OPTIONS } from '@/constants';
import { useTranslation } from 'react-i18next';

interface FrameFiltersProps {
  filters: FrameFilters;
  onFilterChange: (filters: Partial<FrameFilters>) => void;
  onReset: () => void;
  isDefault?: boolean;
}

export function FrameFiltersBar({ filters, onFilterChange, onReset, isDefault = false }: FrameFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
      <SearchInput
        value={filters.search ?? ''}
        onChange={(v) => onFilterChange({ search: v, page: 1 })}
        placeholder={t('filters.searchByName')}
      />

      <Select value={filters.estStatus ?? ''} onValueChange={(v) => onFilterChange({ estStatus: v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filters.status')} />
        </SelectTrigger>
        <SelectContent>
          {EST_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value || '__all__'}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sectorId ?? ''} onValueChange={(v) => onFilterChange({ sectorId: v, page: 1 })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('filters.sector')} />
        </SelectTrigger>
        <SelectContent>
          {SECTOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value || '__all__'}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sourceCode ?? ''} onValueChange={(v) => onFilterChange({ sourceCode: v, page: 1 })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filters.source')} />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_CODE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value || '__all__'}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className={isDefault ? 'cursor-not-allowed' : undefined}>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isDefault}
          className={`gap-1.5 ${isDefault ? 'pointer-events-none opacity-40' : ''}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  );
}
