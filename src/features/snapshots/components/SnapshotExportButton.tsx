'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import type { SnapshotEntity } from '@/types';
import { useLazyGetSnapshotTableQuery } from '../api/snapshotsApi';
import { SNAPSHOT_ENTITIES, SNAPSHOT_EXPORT_ROW_LIMIT } from '../constants';
import { buildSnapshotWorkbook, downloadBlob, fetchAllSnapshotRows, snapshotFilename } from '../utils/exportSnapshot';
import { getSnapshotExportColumns } from './SnapshotColumns';

// Downloads the table of the open tab as .xlsx, with the same columns the screen shows.
export function SnapshotExportButton({ id, entity, snapshotName }: { id: number; entity: SnapshotEntity; snapshotName: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchTable] = useLazyGetSnapshotTableQuery();

  const handleExport = async () => {
    const def = SNAPSHOT_ENTITIES.find((e) => e.entity === entity);
    const entityLabel = t(def?.i18nKey ?? '', { defaultValue: def?.label ?? entity });
    setLoading(true);
    try {
      const { rows, total } = await fetchAllSnapshotRows(async (page, limit) => {
        const res = await fetchTable({ id, entity, page, limit }, true).unwrap();
        return { rows: res.data ?? [], total: res.total ?? 0 };
      });
      if (rows.length === 0) {
        toast.info(t('snapshots.exportEmpty', { defaultValue: 'There are no records to export.' }));
        return;
      }
      const blob = await buildSnapshotWorkbook(getSnapshotExportColumns(entity, t), rows, entityLabel, t);
      downloadBlob(blob, snapshotFilename(snapshotName, entityLabel));
      if (total > rows.length) {
        toast.warning(t('snapshots.exportTruncated', {
          defaultValue: 'Exported the first {{n}} of {{total}} records.',
          n: SNAPSHOT_EXPORT_ROW_LIMIT.toLocaleString(), total: total.toLocaleString(),
        }));
      } else {
        toast.success(t('snapshots.exportDone', { defaultValue: 'Export ready.' }));
      }
    } catch {
      toast.error(t('snapshots.exportFailed', { defaultValue: 'Export failed. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={loading} className="gap-1.5 whitespace-nowrap">
      <FileSpreadsheet className="h-4 w-4" />
      {loading ? t('snapshots.exporting', { defaultValue: 'Exporting…' }) : t('snapshots.exportExcel', { defaultValue: 'Export to Excel' })}
    </Button>
  );
}
