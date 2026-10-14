'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Dices, Download, FileDown, FileUp, Layers, Library, Plus, RefreshCw, RotateCcw, Send, Shuffle } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { ErrorState } from '@/components/common/ErrorState';
import { SampleBuilderSkeleton } from '@/components/common/SampleBuilderSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersistedState } from '@/hooks';
import { useHasPermission } from '@/hooks/usePermission';
import { toast } from '@/utils/toast';
import { formatDate, formatNumber } from '@/utils/format';
import type {
  SamplingDesign, SamplingDrawRequest, SamplingNode, SamplingPublishRequest, SamplingRow, SamplingSelectionGroup,
  SamplingStrataRequest, SamplingStratum, SamplingTableResult,
} from '@/types';
import {
  useGetSamplingContactTagsQuery, useGetSamplingFieldsQuery, useGetSamplingFramesQuery, useGetSamplingStrataQuery,
  useLazyDrawSampleQuery, useLazyGetSampleContactsQuery, useLazyGetSampleEstablishmentsQuery,
} from '../api/samplingApi';
import {
  SAMPLING_DEFAULT_COLUMNS, SAMPLING_DEFAULT_EST_COLUMNS, SAMPLING_DESIGN_STORAGE_KEY, SAMPLING_MAX_CONDITIONS, SAMPLING_MAX_GROUPS,
  SAMPLING_HIDDEN_FIELDS, SAMPLING_MAX_SEED, SAMPLING_MAX_UNITS, SAMPLING_PUBLISH_PERMISSION, SAMPLING_UNIT_KEY,
} from '../constants';
import type { Allocation, Precision } from '../utils/allocation';
import { planGroups } from '../utils/plan';
import { addToGroup, countConditions, removeNode, toApiFilter, updateNode } from '../utils/filterTree';
import { defaultDesign, migrateDesign, newSelectionGroup, parseIds, presetCensusLargePlusRandom, pruneDesign, requestFields, toApiGroups } from '../utils/design';
import { downloadBlob, exportSampleWorkbook } from '../utils/exportSample';
import { fieldLabel, groupMethodLabel, unitLabel } from '../utils/labels';
import { FilterGroupEditor } from '../components/FilterGroupEditor';
import { SelectionGroupCard } from '../components/SelectionGroupCard';
import { AllocationPanel } from '../components/AllocationPanel';
import { ColumnPicker } from '../components/ColumnPicker';
import { ContactOptions } from '../components/ContactOptions';
import { SamplePreview } from '../components/SamplePreview';
import { PublishSampleDialog } from '../components/PublishSampleDialog';
import { PublishedSamplesDialog } from '../components/PublishedSamplesDialog';

const LIVE = 'live';
const NO_AUX = '__none__';

const randomSeed = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % SAMPLING_MAX_SEED) + 1;
};

function Section({ step, title, sub, actions, children, muted }: {
  step: number; title: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-card ${muted ? 'opacity-60' : ''}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A29374] text-xs font-bold text-white">{step}</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-lg font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

// What was drawn, frozen at draw time, so an export always matches the rows on screen.
interface DrawnSample {
  request: string;
  design: SamplingDesign;
  strata: SamplingStratum[];
  allocations: Record<number, Allocation>;
  precisions: Record<number, Precision>;
  units: SamplingTableResult;
  establishments: SamplingTableResult | null;
  contacts: SamplingRow[] | null;
  publish: SamplingPublishRequest;
}

const errorMessage = (e: unknown): string | null => (e as { data?: { message?: string } } | undefined)?.data?.message ?? null;

export function SampleBuilderPage() {
  const { t } = useTranslation();
  const canView = useHasPermission('sampling.view');
  const canPublish = useHasPermission(SAMPLING_PUBLISH_PERMISSION);
  const [stored, setStored] = usePersistedState<unknown>(SAMPLING_DESIGN_STORAGE_KEY, null);
  const defaultName = t('sampling.defaultGroupName', { defaultValue: 'Random sample' });
  const design = useMemo(() => migrateDesign(stored) ?? defaultDesign('enterprise', undefined, defaultName), [stored, defaultName]);
  const setDesign = (fn: (d: SamplingDesign) => SamplingDesign) => setStored((prev: unknown) => fn(migrateDesign(prev) ?? design));
  const [applied, setApplied] = usePersistedState<SamplingStrataRequest | null>(`${SAMPLING_DESIGN_STORAGE_KEY}:applied:v2`, null);
  const [drawn, setDrawn] = useState<DrawnSample | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'units' | 'establishments' | 'contacts'>('units');
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedOpen, setPublishedOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const isEnterprise = design.unit === 'enterprise';
  const fieldsQuery = useGetSamplingFieldsQuery(design.unit, { skip: !canView });
  const estFieldsQuery = useGetSamplingFieldsQuery('establishment', { skip: !canView || !isEnterprise });
  const framesQuery = useGetSamplingFramesQuery(undefined, { skip: !canView });
  const tagsQuery = useGetSamplingContactTagsQuery(undefined, { skip: !canView });
  const fields = useMemo(() => (fieldsQuery.data?.data ?? []).filter((f) => !SAMPLING_HIDDEN_FIELDS.includes(f.FIELD_NAME)), [fieldsQuery.data]);
  const estFields = useMemo(
    () => (isEnterprise ? (estFieldsQuery.data?.data ?? []).filter((f) => !SAMPLING_HIDDEN_FIELDS.includes(f.FIELD_NAME)) : fields),
    [isEnterprise, estFieldsQuery.data, fields],
  );
  const frames = framesQuery.data?.data ?? [];
  const known = useMemo(() => (fieldsQuery.isSuccess && fields.length ? new Set(fields.map((f) => f.FIELD_NAME)) : null), [fieldsQuery.isSuccess, fields]);
  const estKnown = useMemo(
    () => (isEnterprise && estFieldsQuery.isSuccess && estFields.length ? new Set(estFields.map((f) => f.FIELD_NAME)) : null),
    [isEnterprise, estFieldsQuery.isSuccess, estFields],
  );
  // A saved count is replayed only once every field it names is still offered.
  const appliedOk = !!applied && !!known && requestFields(applied).every((f) => known.has(f));
  const strataQuery = useGetSamplingStrataQuery(applied as SamplingStrataRequest, { skip: !canView || !appliedOk });
  const [runDraw] = useLazyDrawSampleQuery();
  const [runEstablishments] = useLazyGetSampleEstablishmentsQuery();
  const [runContacts] = useLazyGetSampleContactsQuery();

  // A design saved or loaded earlier can name fields the frame no longer offers (an empty field, a renamed one).
  useEffect(() => {
    if (!known) return;
    const { design: pruned, removed } = pruneDesign(design, known, estKnown);
    if (removed.length) {
      setStored(pruned);
      toast.info(t('sampling.fieldsDropped', { defaultValue: 'Taken out of the design, no longer offered: {{list}}', list: removed.join(', ') }));
    }
    if (applied && !requestFields(applied).every((f) => known.has(f))) setApplied(null);
  }, [known, estKnown, design, applied, setStored, setApplied, t]);

  const patch = (p: Partial<SamplingDesign>) => setDesign((d) => ({ ...d, ...p }));
  const patchGroup = (i: number, p: Partial<SamplingSelectionGroup>) =>
    setDesign((d) => ({ ...d, groups: d.groups.map((g, j) => (j === i ? { ...g, ...p } : g)) }));
  const editFilter = (fn: (root: SamplingDesign['filter']) => SamplingDesign['filter']) => setDesign((d) => ({ ...d, filter: fn(d.filter) }));

  const currentRequest: SamplingStrataRequest = useMemo(() => ({
    snapshotId: design.snapshotId,
    unit: design.unit,
    filter: toApiFilter(design.filter),
    groups: toApiGroups(design.groups),
    auxColumn: design.auxColumn,
  }), [design.snapshotId, design.unit, design.filter, design.groups, design.auxColumn]);
  const dirty = JSON.stringify(currentRequest) !== JSON.stringify(applied);
  const conditionCount = countConditions(design.filter) + design.groups.reduce((a, g) => a + countConditions(g.filter), 0);

  const result = strataQuery.data?.data;
  const rows = useMemo(() => result?.strata ?? [], [result]);
  const strataError = strataQuery.isError ? (errorMessage(strataQuery.error) ?? t('sampling.strataError', { defaultValue: 'The groups could not be counted. Please try again.' })) : null;
  const haveStrata = !!result && !strataQuery.isFetching && !strataError && !dirty;

  const plan = useMemo(() => planGroups(design.groups, rows), [rows, design.groups]);

  const drawRequest: SamplingDrawRequest | null = applied && result && !dirty ? {
    snapshotId: applied.snapshotId, unit: applied.unit, filter: applied.filter, groups: applied.groups,
    allocation: plan.entries, seed: design.seed, columns: design.columns,
  } : null;
  const drawKey = drawRequest ? JSON.stringify({ drawRequest, est: isEnterprise ? design.estColumns : null, contacts: design.contacts }) : '';
  const drawStale = !!drawn && drawn.request !== drawKey;
  const unitsToDraw = plan.main + plan.reserve;
  const counted = (i: number) => (result && !dirty ? rows.filter((r) => r.GROUP_NO === i + 1).reduce((a, r) => a + r.N, 0) : undefined);
  const missingFor = (i: number) => (result && !dirty ? (result.missing ?? []).filter((m) => m.GROUP_NO === i + 1).map((m) => m.UNIT_ID) : []);

  const frameName = (id: number | null) => (id == null
    ? t('sampling.liveRegister', { defaultValue: 'Live register' })
    : frames.find((f) => f.SNAPSHOT_ID === id)?.SNAPSHOT_NAME ?? `#${id}`);

  const apply = () => {
    if (conditionCount > SAMPLING_MAX_CONDITIONS) {
      toast.error(t('sampling.tooManyConditions', { defaultValue: 'At most {{n}} conditions.', n: SAMPLING_MAX_CONDITIONS }));
      return;
    }
    if (design.groups.some((g) => g.method === 'manual' && parseIds(g.manualIds).ids.length === 0)) {
      toast.error(t('sampling.manualEmpty', { defaultValue: 'A hand-picked group has no ids yet.' }));
      return;
    }
    setApplied(currentRequest);
  };

  const draw = async () => {
    if (!drawRequest) return;
    setDrawing(true);
    try {
      const units = (await runDraw(drawRequest).unwrap()).data ?? { columns: [], rows: [] };
      let establishments: SamplingTableResult | null = null;
      let sbrIds: number[] = units.rows.map((r) => Number(r.UNIT_ID));
      if (isEnterprise && sbrIds.length) {
        establishments = (await runEstablishments({ snapshotId: drawRequest.snapshotId, enterpriseIds: sbrIds, columns: design.estColumns }).unwrap()).data
          ?? { columns: [], rows: [] };
        sbrIds = establishments.rows.map((r) => Number(r.SBR_ID));
      }
      let contacts: SamplingRow[] | null = null;
      if (design.contacts.include && sbrIds.length) {
        contacts = (await runContacts({ snapshotId: drawRequest.snapshotId, sbrIds, tags: design.contacts.tags, fallback: design.contacts.fallback }).unwrap()).data ?? [];
      }
      const publish: SamplingPublishRequest = { ...drawRequest, ...(isEnterprise ? { estColumns: design.estColumns } : {}), contacts: design.contacts };
      setDrawn({ request: drawKey, design, strata: rows, allocations: plan.allocations, precisions: plan.precisions, units, establishments, contacts, publish });
      setTab('units');
      toast.success(t('sampling.drawn', { defaultValue: 'Drew {{count}} units.', count: units.rows.length }));
    } catch (e) {
      toast.error(errorMessage(e) ?? t('sampling.drawError', { defaultValue: 'The sample could not be drawn. Please try again.' }));
    } finally {
      setDrawing(false);
    }
  };

  const exportExcel = async () => {
    if (!drawn) return;
    setExporting(true);
    try {
      const blob = await exportSampleWorkbook({
        t, design: drawn.design, fields, estFields, frameName: frameName(drawn.design.snapshotId), strata: drawn.strata,
        allocations: drawn.allocations, precisions: drawn.precisions, draw: drawn.units, establishments: drawn.establishments,
        contacts: drawn.contacts,
      });
      const frame = drawn.design.snapshotId == null ? 'live' : `frame${drawn.design.snapshotId}`;
      downloadBlob(blob, `sample_${drawn.design.unit}_${frame}_seed${drawn.design.seed}_${new Date().toLocaleDateString('en-CA')}.xlsx`);
    } catch {
      toast.error(t('sampling.exportError', { defaultValue: 'The workbook could not be built. Please try again.' }));
    } finally {
      setExporting(false);
    }
  };

  const saveDesign = () => {
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `sample_design_${new Date().toLocaleDateString('en-CA')}.json`);
  };

  const loadDesign = async (file: File) => {
    try {
      const loaded = migrateDesign(JSON.parse(await file.text()), true);
      if (!loaded) throw new Error('shape');
      setStored(loaded);
      setApplied(null);
      setDrawn(null);
      toast.success(t('sampling.designLoaded', { defaultValue: 'Design loaded. Count the groups to continue.' }));
    } catch {
      toast.error(t('sampling.designInvalid', { defaultValue: 'That file is not a Sample Builder design.' }));
    }
  };

  const reset = () => {
    setStored(defaultDesign(design.unit, randomSeed(), defaultName));
    setApplied(null);
    setDrawn(null);
  };

  const addGroup = (method: SamplingSelectionGroup['method']) => {
    if (design.groups.length >= SAMPLING_MAX_GROUPS) return;
    patch({ groups: [...design.groups, newSelectionGroup(method, `${groupMethodLabel(t, method)} ${design.groups.length + 1}`)] });
  };

  const header = (
    <PageHeader
      title={t('sampling.title', { defaultValue: 'Sample Builder' })}
      description={t('sampling.description', { defaultValue: 'Define a population, split it into random, full and hand-picked groups, draw a reproducible sample, then export it with establishments and contacts' })}
      actions={canView ? (
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadDesign(f); e.target.value = ''; }} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()}>
            <FileUp className="h-3.5 w-3.5" />{t('sampling.loadDesign', { defaultValue: 'Load design' })}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={saveDesign}>
            <FileDown className="h-3.5 w-3.5" />{t('sampling.saveDesign', { defaultValue: 'Save design' })}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />{t('sampling.reset', { defaultValue: 'Start over' })}
          </Button>
          {canPublish && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPublishedOpen(true)}>
              <Library className="h-3.5 w-3.5" />{t('sampling.published.title', { defaultValue: 'Published samples' })}
            </Button>
          )}
        </div>
      ) : undefined}
    />
  );

  if (!canView) {
    return (
      <PageContainer>
        {header}
        <div className="rounded-xl bg-white shadow-card">
          <NoData message={t('sampling.noAccess', { defaultValue: 'You do not have access to the Sample Builder.' })} />
        </div>
      </PageContainer>
    );
  }
  if (fieldsQuery.isLoading || framesQuery.isLoading) {
    return <PageContainer>{header}<SampleBuilderSkeleton /></PageContainer>;
  }
  if (fieldsQuery.isError || framesQuery.isError) {
    return (
      <PageContainer>
        {header}
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={t('sampling.loadError', { defaultValue: 'The Sample Builder could not load. Please try again.' })}
            onRetry={() => { void fieldsQuery.refetch(); void framesQuery.refetch(); }} />
        </div>
      </PageContainer>
    );
  }

  const numberFields = fields.filter((f) => f.KIND === 'number');

  return (
    <PageContainer>
      {header}

      <Section step={1} title={t('sampling.step1', { defaultValue: 'Frame' })}
        sub={t('sampling.step1Sub', { defaultValue: 'Draw from the live register, or from a frozen frame so the same draw can be repeated later. Enterprises are sampled; every establishment of a drawn enterprise comes with it.' })}>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={design.snapshotId == null ? LIVE : String(design.snapshotId)}
            onValueChange={(v) => patch({ snapshotId: v === LIVE ? null : Number(v) })}>
            <SelectTrigger className="h-9 w-80 text-sm shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={LIVE}>{t('sampling.liveRegister', { defaultValue: 'Live register' })}</SelectItem>
              {frames.map((f) => (
                <SelectItem key={f.SNAPSHOT_ID} value={String(f.SNAPSHOT_ID)}>
                  {f.SNAPSHOT_NAME} · {formatDate(f.CREATED_AT)} · {formatNumber(f.ESTABLISHMENT_COUNT)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {design.snapshotId == null && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('sampling.liveWarning', { defaultValue: 'The live register changes every day: the same seed will not give the same units tomorrow.' })}
            </span>
          )}
        </div>
      </Section>

      <Section step={2} title={t('sampling.step2', { defaultValue: 'Population' })}
        sub={t('sampling.step2Sub', { defaultValue: 'Which units can be sampled. Combine conditions with AND / OR, nest groups, exclude a group.' })}>
        <FilterGroupEditor
          root={design.filter}
          unit={design.unit}
          rootLabel={t(`sampling.keepWhereUnit.${design.unit}`, { defaultValue: design.unit === 'enterprise' ? 'Keep enterprises that match' : 'Keep establishments that match' })}
          emptyLabel={t(`sampling.noConditionsUnit.${design.unit}`, { defaultValue: design.unit === 'enterprise' ? 'No conditions: every enterprise in the frame.' : 'No conditions: every establishment in the frame.' })}
          fields={fields}
          snapshotId={design.snapshotId}
          onUpdate={(id, fn) => editFilter((root) => updateNode(root, id, fn))}
          onRemove={(id) => editFilter((root) => removeNode(root, id))}
          onAdd={(groupId, child: SamplingNode) => editFilter((root) => addToGroup(root, groupId, child))}
        />
      </Section>

      <Section step={3} title={t('sampling.step3', { defaultValue: 'Selection groups' })}
        sub={t('sampling.step3Sub', { defaultValue: 'Split the population into random, full and hand-picked groups. A unit is in one group only: hand-picked first, then full, then random, each in list order.' })}
        actions={
          <div className="flex items-center gap-3">
            {applied && dirty && <span className="text-xs font-medium text-amber-700">{t('sampling.unapplied', { defaultValue: 'Changes not counted yet' })}</span>}
            <Button size="sm" className="gap-1.5" onClick={apply} loading={strataQuery.isFetching} disabled={!dirty && !!applied && !strataError}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('sampling.apply', { defaultValue: 'Count groups and strata' })}
            </Button>
          </div>
        }>
        <div className="space-y-3">
          {design.groups.map((g, i) => (
            <SelectionGroupCard
              key={g.id}
              group={g}
              index={i}
              unit={design.unit}
              fields={fields}
              snapshotId={design.snapshotId}
              counted={counted(i)}
              missing={missingFor(i)}
              canRemove={design.groups.length > 1}
              onChange={(p) => patchGroup(i, p)}
              onRemove={() => patch({ groups: design.groups.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {(['random', 'census', 'manual'] as const).map((m) => (
            <button key={m} type="button" onClick={() => addGroup(m)} disabled={design.groups.length >= SAMPLING_MAX_GROUPS}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#87795D] transition-colors hover:bg-[#F4F0E8] disabled:opacity-40">
              <Plus className="h-3 w-3" />{groupMethodLabel(t, m)}
            </button>
          ))}
          <button type="button" onClick={() => patch({ groups: presetCensusLargePlusRandom({
              census: t('sampling.presetCensus', { defaultValue: 'Large units (all)' }),
              random: t('sampling.presetRandom', { defaultValue: 'Everyone else (random)' }),
            }) })}
            className="ms-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100">
            <Layers className="h-3 w-3" />{t('sampling.presetLabel', { defaultValue: 'Use: every large unit, random for the rest' })}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-600">{t('sampling.auxiliary', { defaultValue: 'Auxiliary field' })}</span>
          <Select value={design.auxColumn ?? NO_AUX} onValueChange={(v) => patch({ auxColumn: v === NO_AUX ? null : v })}>
            <SelectTrigger className="h-8 w-56 text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_AUX} className="text-xs">{t('sampling.noAux', { defaultValue: 'None' })}</SelectItem>
              {numberFields.map((f) => (
                <SelectItem key={f.FIELD_NAME} value={f.FIELD_NAME} className="text-xs">{fieldLabel(t, f.FIELD_NAME, f.ORIGIN)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-slate-400">{t('sampling.auxHint', { defaultValue: 'Its spread in each stratum drives the Neyman allocation and the expected precision.' })}</span>
        </div>
        {strataError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{strataError}</p>}
      </Section>

      <Section step={4} title={t('sampling.step4', { defaultValue: 'Allocation' })} muted={!haveStrata}
        sub={t('sampling.step4Sub', { defaultValue: 'How many units each random group takes from each of its strata. Full and hand-picked groups take every unit.' })}>
        {strataQuery.isFetching ? (
          <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-48 w-full" /></div>
        ) : !haveStrata ? (
          <p className="text-sm text-slate-400">{t('sampling.applyFirst', { defaultValue: 'Count the groups and strata (step 3) first.' })}</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Kpi label={t('sampling.inGroups', { defaultValue: 'Units in the groups' })} value={formatNumber(result?.total ?? 0)} />
              <Kpi label={t('sampling.sampleSize', { defaultValue: 'Sample' })} value={formatNumber(plan.main)} />
              <Kpi label={t('sampling.reserve', { defaultValue: 'Reserve' })} value={formatNumber(plan.reserve)} />
              <Kpi label={t('sampling.groupsLabel', { defaultValue: 'Groups' })} value={String(design.groups.length)} />
            </div>
            {design.groups.map((g, i) => {
              const own = rows.filter((r) => r.GROUP_NO === i + 1);
              const n = own.reduce((a, r) => a + r.N, 0);
              return (
                <div key={g.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-800">{i + 1}. {g.name}</span>
                    <span className="text-xs text-slate-400">{groupMethodLabel(t, g.method)}</span>
                  </div>
                  {g.method !== 'random' || !own.length ? (
                    <p className="text-sm text-slate-600">
                      {own.length
                        ? t('sampling.takeAllGroup', { defaultValue: 'All {{n}} units are in the sample, at weight 1.', n: formatNumber(n) })
                        : t('sampling.emptyGroupCount', { defaultValue: 'No unit falls in this group.' })}
                    </p>
                  ) : (
                    <AllocationPanel
                      settings={g.allocation}
                      strataFields={g.strata}
                      auxColumn={design.auxColumn}
                      fields={fields}
                      strata={own}
                      allocation={plan.allocations[i]}
                      precision={plan.precisions[i]}
                      solvedSize={plan.solved[i] ?? null}
                      onChange={(p) => patchGroup(i, { allocation: { ...g.allocation, ...p } })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section step={5} title={t('sampling.step5', { defaultValue: 'Draw and export' })} muted={!haveStrata}
        sub={t('sampling.step5Sub', { defaultValue: 'Simple random sampling within each stratum. The same seed on the same frame and design always gives the same units.' })}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {t('sampling.seed', { defaultValue: 'Seed' })}
            <Input type="number" min={0} max={SAMPLING_MAX_SEED} className="h-8 w-36 text-xs tabular-nums shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20" value={design.seed}
              onChange={(e) => patch({ seed: Math.min(SAMPLING_MAX_SEED, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} />
          </label>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => patch({ seed: randomSeed() })}>
            <Shuffle className="h-3.5 w-3.5" />{t('sampling.newSeed', { defaultValue: 'New seed' })}
          </Button>
          <ColumnPicker fields={fields} value={design.columns} onChange={(columns) => patch({ columns })}
            keyField={SAMPLING_UNIT_KEY[design.unit]} defaults={SAMPLING_DEFAULT_COLUMNS[design.unit]}
            label={t('sampling.unitFieldsPicked', { defaultValue: '{{units}}: {{count}} fields', units: unitLabel(t, design.unit), count: design.columns.length })} />
          {isEnterprise && (
            <ColumnPicker fields={estFields} value={design.estColumns} onChange={(estColumns) => patch({ estColumns })}
              keyField="SBR_ID" defaults={SAMPLING_DEFAULT_EST_COLUMNS}
              label={t('sampling.unitFieldsPicked', { defaultValue: '{{units}}: {{count}} fields', units: unitLabel(t, 'establishment'), count: design.estColumns.length })} />
          )}
        </div>
        <div className="mt-3 max-w-3xl">
          <ContactOptions value={design.contacts} tags={tagsQuery.data?.data ?? []} onChange={(p) => patch({ contacts: { ...design.contacts, ...p } })} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" className="gap-1.5" onClick={draw} loading={drawing}
            disabled={!haveStrata || unitsToDraw === 0 || unitsToDraw > SAMPLING_MAX_UNITS}>
            <Dices className="h-3.5 w-3.5" />
            {t('sampling.draw', { defaultValue: 'Draw {{count}} units', count: unitsToDraw })}
          </Button>
          {drawn && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportExcel} loading={exporting} disabled={drawStale}>
              <Download className="h-3.5 w-3.5" />{t('sampling.export.button', { defaultValue: 'Export to Excel' })}
            </Button>
          )}
          {drawn && canPublish && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPublishOpen(true)}
              disabled={drawStale || drawn.design.snapshotId == null}>
              <Send className="h-3.5 w-3.5" />{t('sampling.publish.button', { defaultValue: 'Publish' })}
            </Button>
          )}
          {drawn && canPublish && drawn.design.snapshotId == null && (
            <span className="text-xs text-slate-500">
              {t('sampling.publish.needsFrame', { defaultValue: 'Only a sample drawn from a frozen frame can be published: choose one in step 1 and draw again.' })}
            </span>
          )}
          {unitsToDraw > SAMPLING_MAX_UNITS && (
            <span className="text-xs text-red-600">{t('sampling.tooManyUnits', { defaultValue: 'At most {{n}} units in one draw.', n: formatNumber(SAMPLING_MAX_UNITS) })}</span>
          )}
          {applied && dirty && (
            <span className="text-xs text-amber-700">{t('sampling.applyBeforeDraw', { defaultValue: 'The population or groups changed: count them again (step 3) before drawing.' })}</span>
          )}
        </div>

        {drawn && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
              <span>{t('sampling.drawnSummary', {
                defaultValue: '{{main}} main and {{reserve}} reserve units ({{units}}) from {{frame}}, seed {{seed}}.',
                main: formatNumber(drawn.units.rows.filter((r) => r.SAMPLE_ROLE === 'MAIN').length),
                reserve: formatNumber(drawn.units.rows.filter((r) => r.SAMPLE_ROLE !== 'MAIN').length),
                units: unitLabel(t, drawn.design.unit),
                frame: frameName(drawn.design.snapshotId), seed: drawn.design.seed,
              })}</span>
              {drawStale && <span className="text-xs font-medium text-amber-700">{t('sampling.drawStale', { defaultValue: 'The design changed since this draw: draw again to export.' })}</span>}
            </div>
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              {([
                ['units', unitLabel(t, drawn.design.unit), drawn.units.rows.length],
                ...(drawn.establishments ? [['establishments', unitLabel(t, 'establishment'), drawn.establishments.rows.length] as const] : []),
                ...(drawn.contacts ? [['contacts', t('sampling.contactsTab', { defaultValue: 'Contacts' }), drawn.contacts.length] as const] : []),
              ] as const).map(([key, label, count]) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${tab === key ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  {label} <span className="tabular-nums opacity-70">{formatNumber(count)}</span>
                </button>
              ))}
            </div>
            {tab === 'units' && <SamplePreview kind="units" result={drawn.units} unit={drawn.design.unit} fields={fields} groups={drawn.design.groups} />}
            {tab === 'establishments' && drawn.establishments && (
              <SamplePreview kind="establishments" result={drawn.establishments} unit="establishment" fields={estFields} />
            )}
            {tab === 'contacts' && drawn.contacts && (
              <SamplePreview kind="contacts" result={{ columns: drawn.contacts.length ? Object.keys(drawn.contacts[0]) : [], rows: drawn.contacts }} unit="establishment" fields={estFields} />
            )}
          </div>
        )}
      </Section>
      {drawn && (
        <PublishSampleDialog open={publishOpen} onClose={() => setPublishOpen(false)} request={drawn.publish} design={drawn.design}
          unitCount={drawn.units.rows.length} />
      )}
      <PublishedSamplesDialog open={publishedOpen} onClose={() => setPublishedOpen(false)} />
    </PageContainer>
  );
}
