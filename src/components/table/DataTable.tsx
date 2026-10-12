'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableLoader } from '@/components/common/Loader';
import { NoData } from '@/components/common/NoData';
import { ErrorState } from '@/components/common/ErrorState';
import { TablePagination } from './TablePagination';
import { ColumnToggle } from './ColumnToggle';
import { useState, useRef, type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange?: (field: string | null, order: 'asc' | 'desc' | null) => void;
  sortableColumns?: string[];
  stickyFirstColumn?: boolean;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string | undefined;
  toolbarLeft?: ReactNode;
}

const STICKY_CELL_HOVER_CLASS: Record<string, string> = {
  'hover:bg-[#FDF7E3] shadow-[inset_3px_0_0_0_#BF9F5F]': 'bg-[#FDF7E3] group-hover:bg-[#FDF7E3]',
};

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isRefreshing,
  isError,
  onRetry,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onSortChange,
  sortableColumns,
  stickyFirstColumn,
  onRowClick,
  getRowClassName,
  toolbarLeft,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  const isServerSorted = !!onSortChange;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      if (isServerSorted) {
        if (next[0]) onSortChange(next[0].id, next[0].desc ? 'desc' : 'asc');
        else onSortChange(null, null);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServerSorted ? undefined : getSortedRowModel(),
    manualSorting: isServerSorted,
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
    sortDescFirst: false,
  });

  const { t } = useTranslation();
  const colCount = columns.length;
  const showRefreshing = !!isRefreshing && !isLoading;

  return (
    <div className="space-y-3">
      <div className={cn('flex items-center', toolbarLeft ? 'justify-between gap-3' : 'justify-end')}>
        {toolbarLeft}
        <ColumnToggle table={table} />
      </div>
      <div className="relative rounded-lg bg-white shadow-card overflow-hidden" aria-busy={showRefreshing || isLoading}>
      {showRefreshing && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-white/60 pt-24" role="status">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-card">
            <Loader2 className="h-4 w-4 animate-spin text-[#A29374]" />
            {t('table.loading')}
          </span>
        </div>
      )}
      <Table wrapperRef={scrollRef}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-panel">
                {headerGroup.headers.map((header, colIndex) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = sortableColumns
                    ? sortableColumns.includes(header.column.id) && header.column.getCanSort()
                    : header.column.getCanSort();
                  const isSticky = stickyFirstColumn && colIndex === 0;
                  return (
                    <TableHead
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn(
                        canSort && 'cursor-pointer select-none group',
                        isSticky && 'sticky start-0 z-20 bg-panel'
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-slate-400 group-hover:text-slate-600">
                              {sorted === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoader rows={limit} cols={colCount} />
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowClassName = getRowClassName?.(row.original);
                const stickyClassName = rowClassName ? STICKY_CELL_HOVER_CLASS[rowClassName] : undefined;
                return (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn('group', onRowClick && 'cursor-pointer', rowClassName)}
                >
                  {row.getVisibleCells().map((cell, colIndex) => {
                    const isSticky = stickyFirstColumn && colIndex === 0;
                    return (
                    <TableCell
                      key={cell.id}
                      className={cn(isSticky && cn('sticky start-0 z-10 bg-white group-hover:bg-panel', stickyClassName))}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    );
                  })}
                </TableRow>
                );
              })
            )}
          </TableBody>
      </Table>

      {!isLoading && isError && (
        <div className="border-t border-slate-100">
          <ErrorState onRetry={onRetry} />
        </div>
      )}
      {!isLoading && !isError && table.getRowModel().rows.length === 0 && (
        <div className="border-t border-slate-100">
          <NoData />
        </div>
      )}

      <TablePagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
      </div>
    </div>
  );
}
