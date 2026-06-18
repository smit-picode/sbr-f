'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n';

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function PaginationBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={disabled ? 'cursor-not-allowed' : undefined}>
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 ${disabled ? 'pointer-events-none opacity-40' : ''}`}
        onClick={onClick}
        disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
      >
        {children}
      </Button>
    </div>
  );
}

export function TablePagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const totalPages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center px-4 py-3 border-t border-slate-200 bg-white">
      {/* Left: record count + rows per page */}
      <div className="flex items-center gap-4 flex-1">
        <p className="text-sm text-slate-500">
          {t('table.showing')}{' '}
          <span className="font-medium text-slate-700">{from}–{to}</span>{' '}
          {t('table.of')}{' '}
          <span className="font-medium text-slate-700">{total.toLocaleString()}</span>{' '}
          {t('table.records')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{t('table.rowsPerPage')}</span>
          <Select value={String(limit)} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
            <SelectTrigger className="h-8 w-16 text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Right: page navigation */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <PaginationBtn onClick={() => onPageChange(1)} disabled={page <= 1}>
          <ChevronsLeft className="h-4 w-4" />
        </PaginationBtn>
        {isArabic ? (
          <>
            <PaginationBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </PaginationBtn>
            <span className="text-sm text-slate-600 px-2">
              {t('table.page')} {page} {t('table.of')} {totalPages || 1}
            </span>
            <PaginationBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </PaginationBtn>
          </>
        ) : (
          <>
            <PaginationBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </PaginationBtn>
            <span className="text-sm text-slate-600 px-2">
              {t('table.page')} {page} {t('table.of')} {totalPages || 1}
            </span>
            <PaginationBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </PaginationBtn>
          </>
        )}
        <PaginationBtn onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
          <ChevronsRight className="h-4 w-4" />
        </PaginationBtn>
      </div>
    </div>
  );
}
