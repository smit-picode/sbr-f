'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/constants';

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  // horizontal scroll controls — only passed from DataTable
  hasHScroll?: boolean;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
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
  hasHScroll = false,
  canScrollLeft = false,
  canScrollRight = false,
  onScrollLeft,
  onScrollRight,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center px-4 py-3 border-t border-slate-200 bg-white">
      {/* Left: record count + rows per page */}
      <div className="flex items-center gap-4 flex-1">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
          <span className="font-medium text-slate-700">{total.toLocaleString()}</span> records
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows per page:</span>
          <Select value={String(limit)} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
            <SelectTrigger className="h-8 w-16 text-xs">
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

      {/* Center: horizontal scroll buttons — only rendered when table overflows */}
      {hasHScroll && (
        <div className="flex items-center gap-1 mx-4">
          <div className={!canScrollLeft ? 'cursor-not-allowed' : undefined} title="Scroll left">
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 border-[#2B7A9E]/30 text-[#2B7A9E] hover:bg-[#2B7A9E]/5 ${!canScrollLeft ? 'pointer-events-none opacity-40' : ''}`}
              onClick={onScrollLeft}
              disabled={!canScrollLeft}
              tabIndex={!canScrollLeft ? -1 : undefined}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className={!canScrollRight ? 'cursor-not-allowed' : undefined} title="Scroll right">
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 border-[#2B7A9E]/30 text-[#2B7A9E] hover:bg-[#2B7A9E]/5 ${!canScrollRight ? 'pointer-events-none opacity-40' : ''}`}
              onClick={onScrollRight}
              disabled={!canScrollRight}
              tabIndex={!canScrollRight ? -1 : undefined}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Right: page navigation */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <PaginationBtn onClick={() => onPageChange(1)} disabled={page <= 1}>
          <ChevronsLeft className="h-4 w-4" />
        </PaginationBtn>
        <PaginationBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </PaginationBtn>
        <span className="text-sm text-slate-600 px-2">
          Page {page} of {totalPages || 1}
        </span>
        <PaginationBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </PaginationBtn>
        <PaginationBtn onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
          <ChevronsRight className="h-4 w-4" />
        </PaginationBtn>
      </div>
    </div>
  );
}
