'use client';

import { SearchInput } from '@/components/common/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { EstablishmentFilters } from '@/types';
import { EST_STATUS_OPTIONS, SECTOR_OPTIONS, SOURCE_CODE_OPTIONS } from '@/constants';
import { useTranslation } from 'react-i18next';

interface EstablishmentFiltersProps {
  filters: EstablishmentFilters;
  onFilterChange: (filters: Partial<EstablishmentFilters>) => void;
  onReset: () => void;
  isDefault?: boolean;
}

export function EstablishmentsFiltersBar({ filters, onFilterChange, onReset, isDefault = false }: EstablishmentFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
      <SearchInput 
        className="shadow-none"
        value={filters.search ?? ''}
        onChange={(v) => onFilterChange({ search: v, page: 1 })}
        placeholder={t('filters.searchByName')}
      />

      <Select value={filters.estStatus ?? ''} onValueChange={(v) => onFilterChange({ estStatus: v, page: 1 })}>
        <SelectTrigger className="w-36 shadow-none">
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
        <SelectTrigger className="w-44 shadow-none">
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
        <SelectTrigger className="w-36 shadow-none">
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
