'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { SurveySampleDetailSkeleton } from '@/components/common/SurveySampleDetailSkeleton';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/table/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nullableText } from '@/utils/format';
import { usePermission } from '@/hooks';
import { useGetSurveyResponsesQuery, useGetSurveySamplesQuery } from '../api/surveysApi';
import { summarize, surveyById, toSampleRows } from '../utils/aggregate';
import { SampleDistributionGrid } from '../components/SampleDistributionGrid';
import { ResponseStatusBadge } from '../components/ResponseStatusBadge';
import { RateGauge } from '../components/RateGauge';
import { ALL_STATUSES, RESPONSE_STATUSES, RESPONSE_STATUS_KEY, SAMPLE_DETAIL_PAGE_SIZE } from '../constants';
import { parseSampleSlug, sampleSlug } from '../utils/classify';
import type { ResponseStatus, SampleRow } from '../types';

const SORTABLE_COLUMNS = ['SBR_ID', 'NAME', 'RESP'];

const SUMMARY_TILES: { key: 'responded' | 'partial' | 'nonResponse' | 'pending'; color: string }[] = [
  { key: 'responded', color: '#059669' },
  { key: 'partial', color: '#A67C1B' },
  { key: 'nonResponse', color: '#B23B3B' },
  { key: 'pending', color: '#6B7280' },
];

function sortValue(r: SampleRow, field: string): string | number {
  if (field === 'SBR_ID') return r.frame.SBR_ID;
  if (field === 'NAME') return (r.frame.NAME_ENU ?? '').toLowerCase();
  return r.status;
}

export function SampleDetailPage({ sampleKey }: { sampleKey: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { canView: canViewSurveys } = usePermission('surveys');
  const { canViewDetail, canEdit } = usePermission('establishments');
  const canOpenEstablishment = canViewDetail || canEdit;
  const { surveyId, period } = parseSampleSlug(sampleKey);
  const survey = surveyById(surveyId);
  // Skip without surveys.view — a 403 here would trip the shared API layer's revoked-access handler.
  const samplesQuery = useGetSurveySamplesQuery(undefined, { skip: !canViewSurveys });
  const responsesQuery = useGetSurveyResponsesQuery(
    { surveyId: survey?.id, period },
    { skip: !canViewSurveys || !survey || !period },
  );
  // A sample exists only if the database reports that survey period.
  const validSample = !!survey && !!samplesQuery.data?.data?.some((s) => s.SURVEY_ID === survey.id && s.PERIOD === period);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null);
  const [paging, setPaging] = useState({ page: 1, limit: SAMPLE_DETAIL_PAGE_SIZE });

  const apiRows = responsesQuery.data?.data;
  const rows = useMemo(() => (validSample ? toSampleRows(apiRows ?? []) : []), [validSample, apiRows]);
  const summary = useMemo(() => summarize(rows), [rows]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (statusFilter !== ALL_STATUSES && r.status !== statusFilter) return false;
      if (!q) return true;
      const f = r.frame;
      return `${f.SBR_ID} ${f.NAME_ENU ?? ''} ${f.NAME_ARA ?? ''} ${f.MOCI_CR_NUM ?? ''}`.toLowerCase().includes(q);
    });
    if (!sort) return filtered;
    const dir = sort.order === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sort.field);
      const vb = sortValue(b, sort.field);
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }, [rows, search, statusFilter, sort]);

  const start = (paging.page - 1) * paging.limit;

  const columns: ColumnDef<SampleRow>[] = [
    {
      id: 'SBR_ID',
      accessorFn: (r) => r.frame.SBR_ID,
      header: 'SBR ID',
      cell: ({ row }) => <span className="font-mono text-xs font-medium text-adaam">{row.original.frame.SBR_ID}</span>,
    },
    {
      id: 'NAME',
      accessorFn: (r) => r.frame.NAME_ENU ?? '',
      header: t('surveySamples.establishment'),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="text-[13px] font-medium text-slate-800">{row.original.frame.NAME_ENU || '—'}</div>
          {row.original.frame.NAME_ARA && (
            <div className="text-[11px] text-slate-400" dir="rtl" lang="ar">{row.original.frame.NAME_ARA}</div>
          )}
        </div>
      ),
    },
    {
      id: 'CR',
      header: 'CR',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{row.original.frame.MOCI_CR_NUM || '—'}</span>,
    },
    {
      id: 'SOURCE',
      header: t('filters.source'),
      cell: ({ row }) => (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{row.original.frame.SOURCE_CODE || '—'}</span>
      ),
    },
    {
      id: 'SECTOR',
      header: t('filters.sector'),
      cell: ({ row }) => <span className="text-[12.5px] text-slate-600">{row.original.frame.SECTOR_ID || '—'}</span>,
    },
    {
      id: 'ISIC',
      header: 'ISIC',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{row.original.frame.ISIC_CODE || '—'}</span>,
    },
    {
      id: 'STATUS',
      header: t('surveySamples.sampleStatus'),
      cell: () => (
        <span className="inline-flex items-center rounded-full bg-adaam-tint px-2 py-0.5 text-[11px] font-semibold text-adaam">
          {t('surveySamples.sampled')}
        </span>
      ),
    },
    {
      id: 'RESP',
      accessorFn: (r) => r.status,
      header: t('surveySamples.responseStatus'),
      cell: ({ row }) => <ResponseStatusBadge status={row.original.status} />,
    },
    {
      id: 'MODE',
      header: t('surveySamples.mode'),
      cell: ({ row }) => <span className="text-[12px] text-slate-500">{nullableText(row.original.mode)}</span>,
    },
  ];

  const backLink = (
    <button
      onClick={() => router.push('/surveys')}
      className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-slate-500 hover:text-adaam"
    >
      <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('surveySamples.allSamples')}
    </button>
  );

  if (!canViewSurveys) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} />
        {backLink}
        <div className="rounded-xl bg-white shadow-card">
          <NoData message={t('surveySamples.noViewPermission', { defaultValue: 'You do not have permission to view survey samples.' })} />
        </div>
      </PageContainer>
    );
  }

  if (samplesQuery.isLoading || (validSample && responsesQuery.isLoading)) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} />
        {backLink}
        <SurveySampleDetailSkeleton />
      </PageContainer>
    );
  }

  if (samplesQuery.isError || responsesQuery.isError) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} />
        {backLink}
        <ErrorState onRetry={() => { samplesQuery.refetch(); responsesQuery.refetch(); }} />
      </PageContainer>
    );
  }

  if (!validSample || !survey) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} />
        {backLink}
        <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-card">{t('surveySamples.sampleNotFound')}</div>
      </PageContainer>
    );
  }

  const resetPage = () => setPaging((p) => ({ page: 1, limit: p.limit }));

  return (
    <PageContainer>
      <PageHeader title={t('surveySamples.overviewTitle')} />
      {backLink}

      <div className="rounded-xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-5">
          <RateGauge rate={summary.rate} size={84} width={8} valueSize={15} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: survey.color }} />
              <span className="text-[11px] font-bold text-slate-400">
                {survey.freq === 'annual' ? t('surveySamples.annual') : t('surveySamples.quarterly')}
              </span>
            </div>
            <h1 className="text-[22px] font-extrabold leading-tight text-slate-900">{survey.name}</h1>
            <div className="mt-0.5 text-[13px] text-slate-500">
              {`${t('surveySamples.period')} ${period} · ${summary.size} ${t('surveySamples.sampledUnits').toLowerCase()}`}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-slate-100 pt-4">
          {SUMMARY_TILES.map((tile) => (
            <div key={tile.key} className="text-center">
              <div className="text-[20px] font-extrabold" style={{ color: tile.color }}>{summary[tile.key]}</div>
              <div className="text-[10.5px] text-slate-400">{t(`surveySamples.${tile.key}`)}</div>
            </div>
          ))}
        </div>
      </div>

      <SampleDistributionGrid rows={rows} />

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-card">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); resetPage(); }}
          placeholder={t('surveySamples.searchSample')}
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="w-44 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>{t('surveySamples.allStatuses')}</SelectItem>
            {RESPONSE_STATUSES.map((s: ResponseStatus) => (
              <SelectItem key={s} value={s}>{t(`surveySamples.${RESPONSE_STATUS_KEY[s]}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={list.slice(start, start + paging.limit)}
        page={paging.page}
        limit={paging.limit}
        total={list.length}
        onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPaging({ page: 1, limit })}
        onSortChange={(field, order) => { setSort(field && order ? { field, order } : null); resetPage(); }}
        sortableColumns={SORTABLE_COLUMNS}
        onRowClick={(r) => {
          const slug = sampleSlug(survey.id, period);
          // Opens the establishment (its Back returns here); users who can't open establishments go straight to the response.
          router.push(canOpenEstablishment
            ? `/establishments/${r.frame.SBR_ID}?from=${encodeURIComponent(`/surveys/${slug}`)}`
            : `/surveys/${slug}/${r.frame.SBR_ID}`);
        }}
      />
    </PageContainer>
  );
}
