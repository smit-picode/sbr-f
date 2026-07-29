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
import { useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
  // Restricts which columns can be sorted when the server only accepts a subset of them
  // (e.g. a table with 50+ display columns but a backend allowlist of ~8 sortable ones).
  // Omit to fall back to each column's own `enableSorting` (the previous behavior).
  sortableColumns?: string[];
  stickyFirstColumn?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // When the caller supplies onSortChange, the server does the sorting across the
  // whole dataset — `data` is just the current page, so client-side getSortedRowModel
  // must be disabled here (manualSorting) or TanStack would re-sort only that page.
  const isServerSorted = !!onSortChange;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      // Compute the next value up front and pass setSorting a plain value rather than an
      // updater function — React treats updater functions as pure and may invoke them
      // outside a normal event context (e.g. Strict Mode's double-invoke check), so calling
      // the parent's onSortChange (a different component's setState) from inside one throws
      // "Cannot update a component while rendering a different component".
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      if (isServerSorted && next[0]) onSortChange(next[0].id, next[0].desc ? 'desc' : 'asc');
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServerSorted ? undefined : getSortedRowModel(),
    manualSorting: isServerSorted,
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
    sortDescFirst: false,
  });

  const colCount = columns.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <ColumnToggle table={table} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table wrapperRef={scrollRef}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-slate-50">
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
                        isSticky && 'sticky start-0 z-20 bg-slate-50'
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn('group', onRowClick && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell, colIndex) => {
                    const isSticky = stickyFirstColumn && colIndex === 0;
                    return (
                    <TableCell
                      key={cell.id}
                      className={cn(isSticky && 'sticky start-0 z-10 bg-white group-hover:bg-slate-50')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
      </Table>

      {/* Render outside the scroll container so they fill the visible width */}
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
