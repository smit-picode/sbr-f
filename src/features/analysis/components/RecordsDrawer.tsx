'use client';

import { useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisBlock, AnalysisFilter, AnalysisResolvedQuery } from '@/types';
import { Button } from '@/components/ui/button';
import { ANALYSIS_ENTITIES, ANALYSIS_FRAME_DIMENSION } from '../constants';
import { entityLabel, frameName } from '../utils/labels';
import { RecordsBlock } from './blocks/RecordsBlock';
import { SidePanel } from './SidePanel';

export interface RecordsTarget {
  block: AnalysisBlock;
  query: AnalysisResolvedQuery;
  extra: AnalysisFilter[];
  label: string;
}

export function recordsBlockFor(target: RecordsTarget): { block: AnalysisBlock; query: AnalysisResolvedQuery } {
  const entity = ANALYSIS_ENTITIES[target.query.entity];
  const dimCols = target.query.dimensions.filter((d) => d !== ANALYSIS_FRAME_DIMENSION && !entity.defaultColumns.includes(d));
  const measureCols = target.query.measures.map((m) => m.field).filter((f): f is string => !!f && !entity.defaultColumns.includes(f));
  const columns = [...entity.defaultColumns, ...dimCols, ...measureCols].slice(0, 9);
  const query: AnalysisResolvedQuery = { ...target.query, columns, dimensions: [], filters: [...target.query.filters, ...target.extra] };
  return { block: { ...target.block, id: `${target.block.id}-records`, type: 'records', query }, query };
}

export function RecordsDrawer({ target, onClose, onExport }: { target: RecordsTarget | null; onClose: () => void; onExport: (block: AnalysisBlock, query: AnalysisResolvedQuery) => Promise<void> }) {
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();
  const built = useMemo(() => (target ? recordsBlockFor(target) : null), [target]);
  return (
    <SidePanel
      open={!!target}
      onClose={onClose}
      modal
      width="w-[min(920px,calc(100vw-24px))]"
      title={target?.label || t('analysis.records.title', { defaultValue: 'Underlying units' })}
      subtitle={target ? `${entityLabel(t, target.query.entity)} · ${frameName(t, target.query.frame)}` : undefined}
      footer={built && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" loading={exporting} onClick={async () => { setExporting(true); try { await onExport(built.block, built.query); } finally { setExporting(false); } }}>
            {!exporting && <FileSpreadsheet className="h-3.5 w-3.5" />}
            {t('analysis.export.xlsx', { defaultValue: 'Export to Excel' })}
          </Button>
        </div>
      )}
    >
      {built && (
        <div className="p-4">
          <RecordsBlock block={built.block} query={built.query} masked={false} height={400} mode="screen" fill />
        </div>
      )}
    </SidePanel>
  );
}
