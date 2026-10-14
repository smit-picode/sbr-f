'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileArchive, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/utils/toast';
import { formatNumber } from '@/utils/format';
import type { SnapshotEntity, SnapshotSummary } from '@/types';
import { downloadSnapshotExport } from '../api/snapshotsApi';
import { SNAPSHOT_ENTITIES } from '../constants';

export interface SnapshotTableQueryState {
  columnFilters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface Props {
  open: boolean;
  onClose: () => void;
  snapshotId: number;
  snapshot?: SnapshotSummary;
  entity: SnapshotEntity;
  query: SnapshotTableQueryState;
}

type Mode = 'table' | 'tables';

const megabytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
const fileStem = (snapshotId: number, name?: string) =>
  (name ? name.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60) : `snapshot-${snapshotId}`) || `snapshot-${snapshotId}`;

// One table (optionally with its filters) as CSV, or several whole tables as a ZIP of CSVs.
export function SnapshotExportDialog({ open, onClose, snapshotId, snapshot, entity, query }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('table');
  const hasFilters = !!query.columnFilters;
  const [withFilters, setWithFilters] = useState(true);
  const [picked, setPicked] = useState<SnapshotEntity[]>(SNAPSHOT_ENTITIES.map((e) => e.entity));
  const [bytes, setBytes] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const busy = bytes !== null;

  useEffect(() => {
    if (open) { setMode('table'); setWithFilters(true); setBytes(null); }
  }, [open]);

  const label = (e: SnapshotEntity) => {
    const def = SNAPSHOT_ENTITIES.find((d) => d.entity === e);
    return def ? t(def.i18nKey, { defaultValue: def.label }) : e;
  };
  const count = (e: SnapshotEntity) => {
    const def = SNAPSHOT_ENTITIES.find((d) => d.entity === e);
    return def && snapshot ? snapshot[def.countKey] : null;
  };

  const start = async () => {
    abort.current = new AbortController();
    setBytes(0);
    const stem = fileStem(snapshotId, snapshot?.SNAPSHOT_NAME);
    try {
      if (mode === 'table') {
        const q = withFilters && hasFilters ? query : { sortBy: query.sortBy, sortOrder: query.sortOrder };
        await downloadSnapshotExport(
          { path: `/snapshots/${snapshotId}/${entity}/export`, params: { ...q }, fileName: `${stem}-${entity}.csv` },
          setBytes, abort.current.signal,
        );
      } else {
        await downloadSnapshotExport(
          { path: `/snapshots/${snapshotId}/export`, params: { entities: picked.join(',') }, fileName: `${stem}.zip` },
          setBytes, abort.current.signal,
        );
      }
      toast.success(t('snapshots.export.done', { defaultValue: 'Export downloaded.' }));
      onClose();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error((error as Error).message || t('snapshots.export.failed', { defaultValue: 'Export failed. Please try again.' }));
      }
    } finally {
      setBytes(null);
      abort.current = null;
    }
  };

  const close = () => {
    abort.current?.abort();
    onClose();
  };

  const modeButton = (m: Mode, icon: React.ReactNode, title: string, sub: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      disabled={busy}
      aria-pressed={mode === m}
      className={cn(
        'flex flex-1 items-start gap-2.5 rounded-xl border p-3 text-start transition-colors disabled:opacity-60',
        mode === m ? 'border-[#A29374] bg-[#F4F0E8]' : 'border-slate-200 hover:border-[#A29374]/50',
      )}
    >
      <span className={cn('mt-0.5', mode === m ? 'text-[#87795D]' : 'text-slate-400')}>{icon}</span>
      <span>
        <span className="block text-[13px] font-semibold text-slate-800">{title}</span>
        <span className="block text-[11.5px] text-slate-500">{sub}</span>
      </span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('snapshots.export.title', { defaultValue: 'Export frozen frame' })}</DialogTitle>
          <DialogDescription>{t('snapshots.export.description', { defaultValue: 'Downloads the frozen values exactly as they are shown on screen.' })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          {modeButton('table', <FileSpreadsheet className="h-4 w-4" />,
            t('snapshots.export.modeTable', { defaultValue: 'This table' }),
            t('snapshots.export.modeTableSub', { defaultValue: '{{table}}, as one CSV file', table: label(entity) }))}
          {modeButton('tables', <FileArchive className="h-4 w-4" />,
            t('snapshots.export.modeTables', { defaultValue: 'Several tables' }),
            t('snapshots.export.modeTablesSub', { defaultValue: 'Whole tables, one CSV each in a ZIP' }))}
        </div>

        {mode === 'table' ? (
          <label className={cn('flex items-start gap-2.5 rounded-lg border border-slate-200 p-3', !hasFilters && 'opacity-60')}>
            <Checkbox checked={hasFilters && withFilters} disabled={!hasFilters || busy} onCheckedChange={(v) => setWithFilters(v === true)} className="mt-0.5" />
            <span>
              <span className="block text-[13px] font-medium text-slate-800">{t('snapshots.export.applyFilters', { defaultValue: 'Apply the current filters' })}</span>
              <span className="block text-[11.5px] text-slate-500">
                {hasFilters
                  ? t('snapshots.export.applyFiltersSub', { defaultValue: 'Untick to export every row of the table.' })
                  : t('snapshots.export.noFilters', { defaultValue: 'No filters are applied, so every row is exported.' })}
              </span>
            </span>
          </label>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[11.5px] text-slate-500">{t('snapshots.export.tablesNote', { defaultValue: 'Filters do not apply when exporting several tables.' })}</p>
            {SNAPSHOT_ENTITIES.map(({ entity: e }) => (
              <label key={e} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <Checkbox
                  checked={picked.includes(e)}
                  disabled={busy}
                  onCheckedChange={(v) => setPicked((p) => (v === true ? [...p, e] : p.filter((x) => x !== e)))}
                />
                <span className="flex-1 text-[13px] text-slate-700">{label(e)}</span>
                {count(e) != null && <span className="text-[12px] tabular-nums text-slate-400">{formatNumber(count(e))}</span>}
              </label>
            ))}
          </div>
        )}

        {busy && (
          <p className="text-[12px] text-slate-500" aria-live="polite">
            {t('snapshots.export.progress', { defaultValue: 'Downloading… {{mb}} MB', mb: megabytes(bytes ?? 0) })}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>{busy ? t('snapshots.export.cancelDownload', { defaultValue: 'Cancel download' }) : t('actions.cancel')}</Button>
          <Button onClick={start} loading={busy} disabled={mode === 'tables' && picked.length === 0}>
            {t('snapshots.export.download', { defaultValue: 'Download' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
