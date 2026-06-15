'use client';

import { Columns3 } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface ColumnToggleProps<TData> {
  table: Table<TData>;
}

function columnLabel(id: string, header: unknown): string {
  if (typeof header === 'string' && header.trim()) return header;
  return id.replace(/_/g, ' ');
}

export function ColumnToggle<TData>({ table }: ColumnToggleProps<TData>) {
  const leafColumns = table.getAllLeafColumns().filter((c) => c.id !== 'actions');
  const total = leafColumns.length;
  const visible = leafColumns.filter((c) => c.getIsVisible()).length;
  const allVisible = visible === total;

  if (total <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
          <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#A71D3A]/10 text-[#A71D3A]">
            {visible}/{total}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Toggle columns</span>
          {!allVisible && (
            <button
              onClick={() => table.toggleAllColumnsVisible(true)}
              className="text-[11px] font-semibold text-[#A71D3A] hover:underline"
            >
              Show all
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto py-1">
          {leafColumns.map((column) => (
            <label
              key={column.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <Checkbox
                checked={column.getIsVisible()}
                onCheckedChange={(checked) => column.toggleVisibility(checked === true)}
                disabled={column.getIsVisible() && visible === 1}
              />
              <span className="truncate">{columnLabel(column.id, column.columnDef.header)}</span>
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
