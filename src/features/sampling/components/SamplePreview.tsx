'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate, nullableText } from '@/utils/format';
import type { SamplingField, SamplingRow, SamplingSelectionGroup, SamplingTableResult, SamplingUnit } from '@/types';
import { SAMPLING_UNIT_KEY } from '../constants';
import { contactColumnLabel, fieldLabel, groupMethodLabel, valueLabel } from '../utils/labels';

// DRAW_SAMPLE's own columns that the units table shows differently or not at all.
const UNIT_HIDDEN = new Set(['GROUP_NO', 'SELECTION_METHOD', 'STRATUM_KEY', 'S1', 'S2', 'S3', 'S4', 'STRATUM_POPULATION', 'STRATUM_SAMPLE']);
const ID_COLUMNS = new Set(['UNIT_ID', 'SBR_ID', 'ENTERPRISE_ID', 'CONTACT_ID']);

interface SamplePreviewProps {
  kind: 'units' | 'establishments' | 'contacts';
  result: SamplingTableResult;
  unit: SamplingUnit;
  // The fields of the rows' unit (establishments for the establishments and contacts tables).
  fields: SamplingField[];
  groups?: SamplingSelectionGroup[];
}

// Client-side pages over a drawn result; the export has every row.
export function SamplePreview({ kind, result, unit, fields, groups = [] }: SamplePreviewProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const origin = (f: string) => fields.find((x) => x.FIELD_NAME === f)?.ORIGIN;
  const isDate = (f: string) => fields.find((x) => x.FIELD_NAME === f)?.KIND === 'date';

  const columns = useMemo<ColumnDef<SamplingRow>[]>(() => {
    const header = (c: string) => {
      if (kind === 'contacts') return contactColumnLabel(t, c);
      if (c === 'UNIT_ID') return fieldLabel(t, SAMPLING_UNIT_KEY[unit]);
      if (c === 'SAMPLE_ROLE') return t('sampling.export.role', { defaultValue: 'Role' });
      if (c === 'SELECTION_ORDER') return t('sampling.order', { defaultValue: 'Order' });
      if (c === 'DESIGN_WEIGHT') return t('sampling.weight', { defaultValue: 'Weight' });
      return fieldLabel(t, c, origin(c));
    };
    const render = (c: string, raw: unknown) => {
      const v = raw as string | number | null;
      if (c === 'SAMPLE_ROLE') {
        return v === 'MAIN'
          ? <Badge variant="default">{t('sampling.roleMain', { defaultValue: 'Main' })}</Badge>
          : <Badge variant="secondary">{t('sampling.roleReserve', { defaultValue: 'Reserve' })}</Badge>;
      }
      if (c === 'MATCH') {
        return <Badge variant={v === 'FALLBACK' ? 'secondary' : 'default'}>{t(`sampling.match.${v}`, { defaultValue: String(v) })}</Badge>;
      }
      if (c === 'IS_PRIMARY') return <span className="text-sm text-slate-700">{v === 'Y' ? t('sampling.yes', { defaultValue: 'Yes' }) : '—'}</span>;
      if (ID_COLUMNS.has(c)) return <span className="font-mono text-xs font-medium text-[#87795D]">{v}</span>;
      if (c === 'DESIGN_WEIGHT') return <span className="text-sm tabular-nums text-slate-700">{typeof v === 'number' ? v.toFixed(2) : '—'}</span>;
      if (isDate(c)) return <span className="whitespace-nowrap text-sm text-slate-600">{formatDate(v == null ? null : String(v))}</span>;
      if (typeof v === 'number') return <span className="text-sm tabular-nums text-slate-700">{v.toLocaleString()}</span>;
      const text = v == null ? null : kind === 'contacts' ? String(v) : valueLabel(t, c, String(v));
      return <span className={`whitespace-nowrap text-sm ${text == null ? 'text-slate-400' : 'text-slate-700'}`}>{nullableText(text)}</span>;
    };

    const shown = kind === 'units' ? result.columns.filter((c) => !UNIT_HIDDEN.has(c)) : result.columns;
    const rest: ColumnDef<SamplingRow>[] = shown.map((c) => ({ id: c, accessorFn: (r: SamplingRow) => r[c], header: header(c), cell: ({ getValue }) => render(c, getValue()) }));
    if (kind !== 'units') return rest;

    const groupCol: ColumnDef<SamplingRow> = {
      id: 'group',
      header: t('sampling.group', { defaultValue: 'Group' }),
      cell: ({ row }) => {
        const g = groups[Number(row.original.GROUP_NO) - 1];
        return (
          <span className="whitespace-nowrap text-sm text-slate-700">
            {g?.name ?? row.original.GROUP_NO}
            <span className="ms-1.5 text-[11px] text-slate-400">{groupMethodLabel(t, String(row.original.SELECTION_METHOD).toLowerCase())}</span>
          </span>
        );
      },
    };
    const stratumCol: ColumnDef<SamplingRow> = {
      id: 'stratum',
      header: t('sampling.stratum', { defaultValue: 'Stratum' }),
      cell: ({ row }) => {
        const g = groups[Number(row.original.GROUP_NO) - 1];
        const labels = (g?.method === 'random' ? g.strata : []).map((s, i) => valueLabel(t, s.column, row.original[`S${i + 1}`] as string | null));
        return <span className="whitespace-nowrap text-sm text-slate-700">{labels.length ? labels.join(' · ') : '—'}</span>;
      },
    };
    return [groupCol, stratumCol, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, result, groups, unit, t]);

  const rows = result.rows.slice((page - 1) * limit, page * limit);
  return (
    <DataTable
      columns={columns}
      data={rows}
      page={page}
      limit={limit}
      total={result.rows.length}
      onPageChange={setPage}
      onLimitChange={(l) => { setLimit(l); setPage(1); }}
    />
  );
}
