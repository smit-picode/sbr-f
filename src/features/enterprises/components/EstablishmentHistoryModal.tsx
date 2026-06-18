'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetLegalUnitHistoryQuery } from '@/features/legalUnits/api/legalUnitsApi';
import type { SbrLegalUnit } from '@/types';
import { formatDate, nullableText } from '@/utils/format';

interface EstablishmentHistoryModalProps {
  sbrId: number | null;
  field: keyof SbrLegalUnit | null;
  fieldLabel: string;
  name: string | null;
  open: boolean;
  onClose: () => void;
}

export function EstablishmentHistoryModal({ sbrId, field, fieldLabel, name, open, onClose }: EstablishmentHistoryModalProps) {
  const { data, isLoading, isError } = useGetLegalUnitHistoryQuery(sbrId ?? 0, { skip: !open || sbrId == null });
  const versions = (data?.data ?? []) as SbrLegalUnit[];

  const renderValue = (v: SbrLegalUnit) => {
    if (!field) return '—';
    const raw = v[field] as unknown;
    if (raw == null || raw === '') return '—';
    return typeof raw === 'number' ? raw.toLocaleString() : String(raw);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fieldLabel} history{name ? ` — ${name}` : ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading history…</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-red-600">Failed to load history.</p>
        ) : versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No history recorded.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v, i) => {
              const isCurrent = v.VALID_TO == null;
              return (
                <li key={v.ID ?? i} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{renderValue(v)}</span>
                    {isCurrent && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">CURRENT</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(v.VALID_FROM)} → {v.VALID_TO ? formatDate(v.VALID_TO) : nullableText(null)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
