'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FileDown, FileUp, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/utils/format';
import type { SamplingField, SamplingGroup, SamplingNode, SamplingSelectionGroup, SamplingUnit } from '@/types';
import { SAMPLING_GROUP_METHODS, SAMPLING_ID_TEMPLATE_ROWS, SAMPLING_MAX_UNITS, SAMPLING_UNIT_KEY } from '../constants';
import { addToGroup, removeNode, updateNode } from '../utils/filterTree';
import { idsFromFile, idsTemplateCsv, parseIds } from '../utils/design';
import { downloadBlob } from '../utils/exportSample';
import { FilterGroupEditor } from './FilterGroupEditor';
import { StrataEditor } from './StrataEditor';

const INPUT_CLASS = 'shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

interface SelectionGroupCardProps {
  group: SamplingSelectionGroup;
  index: number;
  unit: SamplingUnit;
  fields: SamplingField[];
  snapshotId: number | null;
  // From the last count: units the group holds, and hand-picked ids the frame lacks.
  counted?: number;
  missing?: number[];
  canRemove: boolean;
  onChange: (patch: Partial<SamplingSelectionGroup>) => void;
  onRemove: () => void;
}

export function SelectionGroupCard({ group, index, unit, fields, snapshotId, counted, missing = [], canRemove, onChange, onRemove }: SelectionGroupCardProps) {
  const { t } = useTranslation();
  const file = useRef<HTMLInputElement>(null);
  const parsed = group.method === 'manual' ? parseIds(group.manualIds) : null;
  const editFilter = (fn: (root: SamplingGroup) => SamplingGroup) => onChange({ filter: fn(group.filter) });
  const methodLabel = (m: SamplingSelectionGroup['method']) => t(`sampling.groupMethod.${m}`, {
    defaultValue: m === 'random' ? 'Random sample' : m === 'census' ? 'Full population' : 'Hand-picked',
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
        <Input className={`h-8 w-64 text-sm ${INPUT_CLASS}`} value={group.name}
          onChange={(e) => onChange({ name: e.target.value })} aria-label={t('sampling.groupName', { defaultValue: 'Group name' })} />
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          {SAMPLING_GROUP_METHODS.map((m) => (
            <button key={m} type="button" onClick={() => onChange({ method: m })}
              className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${group.method === m ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {methodLabel(m)}
            </button>
          ))}
        </div>
        {counted != null && (
          <span className="text-sm text-slate-600">
            {t('sampling.groupCounted', { defaultValue: '{{n}} units', n: formatNumber(counted) })}
          </span>
        )}
        {canRemove && (
          <button type="button" onClick={onRemove} aria-label={t('sampling.removeSelectionGroup', { defaultValue: 'Remove group' })}
            className="ms-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {group.method === 'random'
          ? t('sampling.groupRandomHint', { defaultValue: 'A stratified random sample of the units this group holds. Allocate it in step 4.' })
          : group.method === 'census'
            ? t('sampling.groupCensusHint', { defaultValue: 'Every unit this group holds is in the sample.' })
            : t('sampling.groupManualHint', { defaultValue: 'These ids are in the sample whatever the population filters say, as long as the frame holds them.' })}
      </p>

      {group.method !== 'manual' && (
        <div className="mt-3">
          <FilterGroupEditor
            root={group.filter}
            unit={unit}
            rootLabel={t('sampling.groupFilterLead', { defaultValue: 'Within the population, take units that match' })}
            emptyLabel={t('sampling.groupNoFilter', { defaultValue: 'No condition: every unit of the population that no earlier group took.' })}
            fields={fields}
            snapshotId={snapshotId}
            onUpdate={(id, fn) => editFilter((root) => updateNode(root, id, fn))}
            onRemove={(id) => editFilter((root) => removeNode(root, id))}
            onAdd={(groupId, child: SamplingNode) => editFilter((root) => addToGroup(root, groupId, child))}
          />
        </div>
      )}

      {group.method === 'random' && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="mb-2 text-xs font-medium text-slate-600">{t('sampling.strata', { defaultValue: 'Strata' })}</div>
          <StrataEditor fields={fields} strata={group.strata} onChange={(strata) => onChange({ strata })} />
        </div>
      )}

      {group.method === 'manual' && parsed && (
        <div className="mt-3 space-y-2">
          <textarea
            value={group.manualIds}
            onChange={(e) => onChange({ manualIds: e.target.value })}
            rows={4}
            placeholder={unit === 'enterprise'
              ? t('sampling.manualPlaceholderEnterprise', { defaultValue: 'Enterprise IDs, separated by commas, spaces or new lines' })
              : t('sampling.manualPlaceholderEstablishment', { defaultValue: 'SBR IDs, separated by commas, spaces or new lines' })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs focus:border-[#A29374]/40 focus:outline-none focus:ring-2 focus:ring-[#A29374]/20"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <input ref={file} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) onChange({ manualIds: [group.manualIds, idsFromFile(await f.text())].filter(Boolean).join('\n') });
                e.target.value = '';
              }} />
            <button type="button" onClick={() => file.current?.click()}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-[#87795D] hover:bg-[#F4F0E8]">
              <FileUp className="h-3.5 w-3.5" />{t('sampling.loadIds', { defaultValue: 'Add from a file' })}
            </button>
            <button type="button"
              onClick={() => downloadBlob(new Blob([idsTemplateCsv(SAMPLING_UNIT_KEY[unit], SAMPLING_ID_TEMPLATE_ROWS)], { type: 'text/csv' }), `hand_picked_${unit}_ids_template.csv`)}
              title={t('sampling.idsTemplateHint', { defaultValue: 'One id per line under the header; the ids in it are made up' })}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-[#87795D] hover:bg-[#F4F0E8]">
              <FileDown className="h-3.5 w-3.5" />{t('sampling.idsTemplate', { defaultValue: 'Download file template' })}
            </button>
            <span className="text-slate-600">{t('sampling.idsParsed', { defaultValue: '{{n}} ids', n: formatNumber(parsed.ids.length) })}</span>
            {parsed.ids.length > SAMPLING_MAX_UNITS && (
              <span className="text-red-600">{t('sampling.tooManyIds', { defaultValue: 'At most {{n}}', n: formatNumber(SAMPLING_MAX_UNITS) })}</span>
            )}
            {parsed.invalid.length > 0 && (
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('sampling.idsInvalid', { defaultValue: 'Not ids, ignored: {{list}}', list: parsed.invalid.slice(0, 5).join(', ') + (parsed.invalid.length > 5 ? '…' : '') })}
              </span>
            )}
          </div>
          {missing.length > 0 && (
            <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t('sampling.idsMissing', {
                defaultValue: '{{count}} not in this frame, left out: {{list}}',
                count: missing.length,
                list: missing.slice(0, 20).join(', ') + (missing.length > 20 ? '…' : ''),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
