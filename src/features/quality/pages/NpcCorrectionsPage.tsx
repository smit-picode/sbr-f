'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PenLine, X } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SearchInput } from '@/components/common/SearchInput';
import { NpcCorrectionsSkeleton } from '@/components/common/NpcCorrectionsSkeleton';
import { DataTable } from '@/components/table/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EChart, hbars, hbarsStacked, trend } from '@/lib/charts';
import { usePermission } from '@/hooks';
import { useRouter } from '@/hooks/useAppRouter';
import { ROUTES } from '@/constants/routes';
import { cleanParams } from '@/utils/query';
import { formatDate, formatDateTime, formatNumber } from '@/utils/format';
import { toast } from '@/utils/toast';
import { prettyTableName } from '@/features/auditLog/components/AuditLogColumns';
import type { NpcCorrectionListStatus } from '@/types';
import { useGetNpcCorrectionsQuery, useGetNpcCorrectionsSummaryQuery } from '../api/dataQualityApi';
import { QualityTabs } from '../components/QualityTabs';
import { getNpcCorrectionsColumns } from '../components/NpcCorrectionsColumns';
import {
  NPC_CORRECTION_CHANNELS,
  NPC_CORRECTION_CHANNEL_COLOR,
  NPC_CORRECTION_CHANNEL_LABEL,
  NPC_CORRECTION_STATUS_OPTIONS,
  NPC_CORRECTIONS_PAGE_SIZE,
  NPC_CORRECTIONS_SORTABLE,
  NPC_CORRECTIONS_STALE_DAYS,
} from '../constants';
import { dqColumnLabel } from '../utils/labels';

// Radix Select rejects an empty value, so "no filter" is this sentinel.
const ANY = '__any__';
const DAY_MS = 86_400_000;

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-lg bg-white p-5 shadow-card ${className}`}>{children}</div>;
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[13.5px] font-bold text-slate-800">{title}</h2>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Kpi({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-card">
      <div className="text-[26px] font-extrabold leading-tight tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-slate-600">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

// Where the register holds a value NPC approved that the regulator still sends differently.
export function NpcCorrectionsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { canView, canViewDetail: canOpenEstablishment } = usePermission('establishments');

  const summaryQuery = useGetNpcCorrectionsSummaryQuery();
  const summary = summaryQuery.data?.data;

  const [status, setStatus] = useState<NpcCorrectionListStatus>('AHEAD');
  const [regulator, setRegulator] = useState(ANY);
  const [field, setField] = useState(ANY);
  const [channel, setChannel] = useState(ANY);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(NPC_CORRECTIONS_PAGE_SIZE);
  const [sort, setSort] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({});

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  const columnFilters = useMemo(() => {
    const rows: { column: string; operator: string; value: string }[] = [];
    if (regulator !== ANY) rows.push({ column: 'REGULATOR_CODE', operator: 'equals', value: regulator });
    if (field !== ANY) {
      const [table, column] = field.split('.');
      rows.push({ column: 'ENTITY_TABLE', operator: 'equals', value: table }, { column: 'COLUMN_NAME', operator: 'equals', value: column });
    }
    if (channel !== ANY) rows.push({ column: 'CHANNEL', operator: 'equals', value: channel });
    const q = search.trim();
    if (q) rows.push(/^\d+$/.test(q)
      ? { column: 'SBR_ID', operator: 'equals', value: q }
      : { column: 'ESTABLISHMENT_NAME_ENU', operator: 'contains', value: q });
    return rows.length ? JSON.stringify(rows) : undefined;
  }, [regulator, field, channel, search]);

  const listQuery = useGetNpcCorrectionsQuery(cleanParams({ status, page, limit, columnFilters, ...sort }));
  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const columns = useMemo(() => getNpcCorrectionsColumns(t), [t]);

  const regulators = useMemo(() => Array.from(new Set((summary?.byRegulator ?? []).map((r) => r.regulator))), [summary]);
  const fieldLabel = (table: string, column: string) => dqColumnLabel(t, table, column);
  const monthLabel = (iso: string) => new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-GB', { month: 'short', year: 'numeric' });

  const header = (
    <PageHeader
      title={t('dq.corrections.title', { defaultValue: 'NPC corrections' })}
      description={t('dq.corrections.description', { defaultValue: 'Values NPC changed and approved where the regulator still sends something else: fields where the register holds better data than its source.' })}
      chips={
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
          <PenLine className="h-3 w-3" />
          {t('dq.tabs.corrections', { defaultValue: 'NPC corrections' })}
        </span>
      }
      actions={summary?.asOf ? (
        <div className="text-end">
          <div className="text-[11px] text-white/70">{t('dq.corrections.asOf', { defaultValue: 'Rebuilt by the pipeline' })}</div>
          <div className="text-[13px] font-semibold text-white">{formatDateTime(summary.asOf)}</div>
        </div>
      ) : undefined}
    />
  );

  if (summaryQuery.isLoading) return <PageContainer>{header}<QualityTabs active="/quality/corrections" /><NpcCorrectionsSkeleton /></PageContainer>;
  if (summaryQuery.isError || !summary) {
    return (
      <PageContainer>
        {header}
        <QualityTabs active="/quality/corrections" />
        <Card><ErrorState message={t('dq.corrections.loadError', { defaultValue: 'The NPC corrections could not be loaded.' })} onRetry={summaryQuery.refetch} /></Card>
      </PageContainer>
    );
  }

  const { kpis } = summary;
  const stale = summary.asOf ? Date.now() - new Date(summary.asOf).getTime() > NPC_CORRECTIONS_STALE_DAYS * DAY_MS : false;
  const hasAny = kpis.valuesAhead > 0 || kpis.caughtUpSinceJan > 0 || summary.trend.some((p) => p.values > 0);
  const pct = (n: number) => (kpis.valuesAhead ? Math.round((n / kpis.valuesAhead) * 100) : 0);

  // Months rebuilt from audit history are dashed; the solid line starts at the first real build.
  const firstReal = summary.trend.findIndex((p) => !p.reconstructed);
  const trendSeries = summary.trend.some((p) => p.reconstructed)
    ? [
      { name: t('dq.corrections.trendReconstructed', { defaultValue: 'Reconstructed from history' }), color: '#C0AC86', dashed: true,
        data: summary.trend.map((p, i) => (p.reconstructed || i === firstReal ? p.values : null)) },
      { name: t('dq.corrections.valuesAhead', { defaultValue: 'Values ahead' }), color: '#A29374', area: true,
        data: summary.trend.map((p) => (p.reconstructed ? null : p.values)) },
    ]
    : [{ name: t('dq.corrections.valuesAhead', { defaultValue: 'Values ahead' }), color: '#A29374', area: true, data: summary.trend.map((p) => p.values) }];

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (regulator !== ANY) activeChips.push({ key: 'reg', label: regulator, clear: () => resetPage(setRegulator)(ANY) });
  if (field !== ANY) { const [tb, col] = field.split('.'); activeChips.push({ key: 'field', label: fieldLabel(tb, col), clear: () => resetPage(setField)(ANY) }); }
  if (channel !== ANY) activeChips.push({ key: 'ch', label: t(`dq.corrections.channel.${channel}`, { defaultValue: NPC_CORRECTION_CHANNEL_LABEL[channel] ?? channel }), clear: () => resetPage(setChannel)(ANY) });

  return (
    <PageContainer>
      {header}
      <QualityTabs active="/quality/corrections" />

      {(!summary.asOf || stale) && (
        <div className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn-tint px-4 py-3 text-[12.5px] text-warn-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {!summary.asOf
              ? t('dq.corrections.notBuilt', { defaultValue: 'No full pipeline run has built this indicator yet. The figures fill in after the next full run.' })
              : t('dq.corrections.stale', { defaultValue: 'Last rebuilt on {{date}}, more than {{days}} days ago: the figures may be out of date.', date: formatDate(summary.asOf), days: NPC_CORRECTIONS_STALE_DAYS })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          value={formatNumber(kpis.valuesAhead)}
          label={t('dq.corrections.kpiAhead', { defaultValue: 'Values ahead of the regulator' })}
          sub={t('dq.corrections.kpiAheadSub', { defaultValue: 'in {{count}} establishments', count: kpis.establishmentsAhead })}
        />
        <Kpi
          value={formatNumber(kpis.overridden)}
          label={t('dq.corrections.kpiOverridden', { defaultValue: 'Regulator sends a different value' })}
          sub={t('dq.corrections.kpiShare', { defaultValue: '{{pct}}% of the values ahead', pct: pct(kpis.overridden) })}
        />
        <Kpi
          value={formatNumber(kpis.filled)}
          label={t('dq.corrections.kpiFilled', { defaultValue: 'Regulator sends nothing' })}
          sub={t('dq.corrections.kpiFilledSub', { defaultValue: '{{pct}}%, gaps NPC filled in', pct: pct(kpis.filled) })}
        />
        <Kpi
          value={formatNumber(kpis.caughtUpSinceJan)}
          label={t('dq.corrections.kpiCaughtUp', { defaultValue: 'Regulator caught up since January' })}
          sub={t('dq.corrections.kpiCaughtUpSub', { defaultValue: 'now sends the value NPC approved' })}
        />
      </div>

      {!hasAny ? (
        <Card><NoData message={t('dq.corrections.empty', { defaultValue: 'No NPC corrections yet' })} description={t('dq.corrections.emptyDesc', { defaultValue: 'Approved changes that differ from what a regulator sends show up here after the next full pipeline run.' })} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHead
                title={t('dq.corrections.byRegulator', { defaultValue: 'Ahead of which regulator' })}
                sub={t('dq.corrections.byRegulatorSub', { defaultValue: 'By the regulator that supplied the original value, split by how NPC learned the right one. Click a bar to list its values.' })}
              />
              <EChart
                height={Math.max(regulators.length, 1) * 38 + 70}
                option={hbarsStacked({
                  categories: regulators,
                  barWidth: 16,
                  labelWidth: 80,
                  series: NPC_CORRECTION_CHANNELS.map((ch) => ({
                    name: t(`dq.corrections.channel.${ch}`, { defaultValue: NPC_CORRECTION_CHANNEL_LABEL[ch] }),
                    color: NPC_CORRECTION_CHANNEL_COLOR[ch],
                    data: regulators.map((reg) => summary.byRegulator.find((r) => r.regulator === reg && r.channel === ch)?.values ?? 0),
                  })),
                })}
                onEvents={{ click: (p) => { const name = (p as { name?: string }).name; if (name) resetPage(setRegulator)(name); } }}
              />
            </Card>
            <Card className="lg:col-span-2">
              <CardHead
                title={t('dq.corrections.byField', { defaultValue: 'Which fields' })}
                sub={t('dq.corrections.byFieldSub', { defaultValue: 'Values ahead of the regulator, by field. Click a bar to list them.' })}
              />
              <EChart
                height={Math.max(summary.byField.length, 1) * 30 + 24}
                option={hbars({
                  items: summary.byField.map((f) => ({ name: fieldLabel(f.table, f.column), value: f.values, sub: prettyTableName(f.table) })),
                  barWidth: 11,
                  labelWidth: 120,
                })}
                onEvents={{ click: (p) => { const i = (p as { dataIndex?: number }).dataIndex; const f = i != null ? summary.byField[i] : undefined; if (f) resetPage(setField)(`${f.table}.${f.column}`); } }}
              />
            </Card>
          </div>

          <Card>
            <CardHead
              title={t('dq.corrections.trend', { defaultValue: 'Values ahead over time' })}
              sub={t('dq.corrections.trendSub', { defaultValue: 'Values where the register is ahead of its source, at each month end; the last point is today.' })}
            />
            <EChart height={220} option={trend({ categories: summary.trend.map((p) => monthLabel(p.monthEnd)), series: trendSeries, yMin: 0 })} />
            {firstReal !== 0 && summary.trend.some((p) => p.reconstructed) && (
              <p className="mt-1 text-[11px] text-slate-400">
                {t('dq.corrections.trendNote', { defaultValue: 'The dashed months come before the first pipeline build of this indicator and are reconstructed from the approval history.' })}
              </p>
            )}
          </Card>
        </>
      )}

      <Card>
        <CardHead
          title={t('dq.corrections.listTitle', { defaultValue: 'Corrected values' })}
          sub={t('dq.corrections.listSub', { defaultValue: 'What the regulator sends and what the register now holds, one row per corrected value.' })}
        />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            {NPC_CORRECTION_STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => resetPage(setStatus)(o.value)}
                className={`h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors ${status === o.value ? 'bg-dune text-white shadow-soft' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t(`dq.corrections.status.${o.value}`, { defaultValue: o.label })}
              </button>
            ))}
          </div>
          <Select value={regulator} onValueChange={resetPage(setRegulator)}>
            <SelectTrigger className="h-8 w-40 text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY} className="text-xs">{t('dq.corrections.allRegulators', { defaultValue: 'All regulators' })}</SelectItem>
              {regulators.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={field} onValueChange={resetPage(setField)}>
            <SelectTrigger className="h-8 w-48 text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY} className="text-xs">{t('dq.corrections.allFields', { defaultValue: 'All fields' })}</SelectItem>
              {summary.byField.map((f) => (
                <SelectItem key={`${f.table}.${f.column}`} value={`${f.table}.${f.column}`} className="text-xs">
                  {fieldLabel(f.table, f.column)} · {prettyTableName(f.table)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={resetPage(setChannel)}>
            <SelectTrigger className="h-8 w-48 whitespace-nowrap text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY} className="text-xs">{t('dq.corrections.allChannels', { defaultValue: 'Learned from anywhere' })}</SelectItem>
              {NPC_CORRECTION_CHANNELS.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{t(`dq.corrections.channel.${c}`, { defaultValue: NPC_CORRECTION_CHANNEL_LABEL[c] })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchInput
            value={search}
            onChange={resetPage(setSearch)}
            placeholder={t('dq.corrections.search', { defaultValue: 'Establishment name or SBR ID' })}
            className="w-60"
          />
          {activeChips.map((c) => (
            <button key={c.key} type="button" onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-adaam-tint px-2.5 py-1 text-[11px] font-semibold text-adaam-deep hover:bg-adaam/20">
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={listQuery.isLoading}
          isRefreshing={listQuery.isFetching && !listQuery.isLoading}
          isError={listQuery.isError}
          onRetry={listQuery.refetch}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          sortableColumns={NPC_CORRECTIONS_SORTABLE}
          onSortChange={(f, o) => { setSort(f && o ? { sortBy: f, sortOrder: o } : {}); setPage(1); }}
          onRowClick={(row) => (canView && canOpenEstablishment
            ? router.push(ROUTES.LEGAL_UNIT_DETAIL(row.SBR_ID))
            : toast.warning(t('common.noDetailAccess', { defaultValue: "You do not have permission to open this record's details." })))}
        />
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          {t('dq.corrections.footnote', { defaultValue: 'Ahead means an approved NPC value that differs from what the regulator currently sends, on a field that regulator supplies. When the regulator starts sending the same value it moves to caught up. Not counted yet: contacts, one-off migration loads, and employment (it comes from registers, not regulators).' })}
        </p>
      </Card>
    </PageContainer>
  );
}
