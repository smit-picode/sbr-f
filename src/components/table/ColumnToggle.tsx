'use client';

import { useState } from 'react';
import { Columns3, Search } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
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
  const [query, setQuery] = useState('');

  const leafColumns = table.getAllLeafColumns().filter((c) => c.id !== 'actions');
  const total = leafColumns.length;
  const visible = leafColumns.filter((c) => c.getIsVisible()).length;

  if (total <= 1) return null;

  // Show every column
  const showAll = () => table.toggleAllColumnsVisible(true);
  // Hide every column but keep the first one visible so the table is never empty
  const hideAll = () => {
    leafColumns.forEach((col, i) => col.toggleVisibility(i === 0));
  };

  const ql = query.trim().toLowerCase();
  const filtered = ql
    ? leafColumns.filter((c) => columnLabel(c.id, c.columnDef.header).toLowerCase().includes(ql))
    : leafColumns;

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setQuery(''); }}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
          <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#A71D3A]/10 text-[#A71D3A]">
            {visible}/{total}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        {/* Search */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Find a column..."
              className="h-8 w-full rounded-md border border-slate-200 ps-8 pe-2.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A71D3A]/30"
            />
          </div>
        </div>

        {/* Show all / Hide all */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-[11px]">
          <button onClick={showAll} className="font-semibold text-[#A71D3A] hover:underline">
            Show all
          </button>
          <button onClick={hideAll} className="font-semibold text-slate-500 hover:underline">
            Hide all
          </button>
        </div>

        {/* Column list */}
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">No columns found</p>
          ) : (
            filtered.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
              >
                <Checkbox
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(checked === true)}
                  disabled={column.getIsVisible() && visible === 1}
                />
                <span className="truncate">{columnLabel(column.id, column.columnDef.header)}</span>
              </label>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
