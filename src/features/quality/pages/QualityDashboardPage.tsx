'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, X } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { ErrorState } from '@/components/common/ErrorState';
import { QualityDashboardSkeleton } from '@/components/common/QualityDashboardSkeleton';
import { EChart, gauge } from '@/lib/charts';
import { usePermission } from '@/hooks';
import { formatDateTime, formatNumber } from '@/utils/format';
import type { DqTableScore } from '@/types';
import { useGetDataQualitySummaryQuery } from '../api/dataQualityApi';
import { DQ_DIMENSIONS, DQ_NO_SCORE_COLOR, DQ_OVERALL_DIMENSION, DQ_TIER_STYLE } from '../constants';
import { columnScores, ruleColumns, tierFor } from '../utils/scores';
import { dqColumnLabel } from '../utils/labels';
import { ScoreBar, TierBadge, formatPct } from '../components/QualityScore';
import { DqRulesTable } from '../components/DqRulesTable';
import { QualityTabs } from '../components/QualityTabs';

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl bg-white shadow-card ${className}`}>{children}</div>;
}

function CardHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// One labelled score row: name, bar, percentage or emptyText, and a note unless noteColumn is off.
function ScoreRow({ label, pct, note, emptyText, noteColumn = true, onClick, active }: {
  label: string; pct: number | null; note?: string; emptyText?: string; noteColumn?: boolean; onClick?: () => void; active?: boolean;
}) {
  const tier = tierFor(pct);
  const cls = `grid w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start ${onClick ? 'transition-colors hover:bg-slate-50' : ''} ${active ? 'bg-adaam-tint hover:bg-adaam-tint' : ''}`;
  const body = (
    <>
      <span className="min-w-0 truncate text-[13px] font-medium text-slate-800" title={label}>{label}</span>
      <ScoreBar pct={pct} tier={tier} />
      {pct == null && emptyText
        ? <span className="truncate text-end text-[11.5px] text-slate-400" title={emptyText}>{emptyText}</span>
        : <span className="text-end text-[13px] font-semibold tabular-nums text-slate-900">{formatPct(pct)}</span>}
      {noteColumn && <span className="truncate text-end text-[11.5px] text-slate-400" title={note}>{note}</span>}
    </>
  );
  // Fixed columns, so every row of a list gets the same bar length whether or not it has a note.
  const style = { gridTemplateColumns: noteColumn ? 'minmax(96px, 180px) minmax(80px, 1fr) 56px 64px' : 'minmax(96px, 160px) minmax(80px, 1fr) 72px' };
  return onClick
    ? <button type="button" onClick={onClick} className={cls} style={style}>{body}</button>
    : <div className={cls} style={style}>{body}</div>;
}

export function QualityDashboardPage() {
  const { t } = useTranslation();
  const { canView } = usePermission('data_quality');
  const { data, isLoading, isError, refetch } = useGetDataQualitySummaryQuery(undefined, { skip: !canView });
  const summary = data?.data;
  const lastRun = summary?.lastRun ?? null;

  const [selTable, setSelTable] = useState<string | null>(null);
  const [selColumn, setSelColumn] = useState<string | null>(null);
  const [selDimension, setSelDimension] = useState<string | null>(null);

  const tables = summary?.tables ?? [];
  const dimension = DQ_DIMENSIONS.find((d) => d.name === selDimension);
  // A table with no rule in the chosen dimension has no score for it and is shown greyed out.
  const appliesTo = (tb: DqTableScore) => !dimension || tb[dimension.tableKey] != null;
  const table: DqTableScore | undefined = tables.find((x) => x.SBR_TABLE === selTable && appliesTo(x))
    ?? [...tables].filter(appliesTo).sort((a, b) => b.RULES_CNT - a.RULES_CNT)[0];
  const overall = summary?.dimensions.find((d) => d.QUALITY_DIMENSION === DQ_OVERALL_DIMENSION);
  const dimensionScores = DQ_DIMENSIONS.map((d) => ({ ...d, row: summary?.dimensions.find((x) => x.QUALITY_DIMENSION === d.name) }));
  const headline = dimension ? dimensionScores.find((d) => d.name === dimension.name)?.row : overall;

  const tableRules = useMemo(
    () => (summary?.rules ?? []).filter((r) => r.DQ_RUN_ID === lastRun?.DQ_RUN_ID && r.SBR_TABLE === table?.SBR_TABLE
      && (!selDimension || r.QUALITY_DIMENSION === selDimension)),
    [summary, lastRun, table, selDimension]
  );
  const pickDimension = (name: string | null) => { setSelDimension(name === selDimension ? null : name); setSelColumn(null); };
  const columns = useMemo(() => columnScores(tableRules), [tableRules]);
  const shownRules = selColumn ? tableRules.filter((r) => ruleColumns(r).includes(selColumn)) : tableRules;
  const errored = (summary?.rules ?? []).filter((r) => r.DQ_RUN_ID === lastRun?.DQ_RUN_ID && r.ERROR_MESSAGE).length;

  const tableName = (key: string) => t(`dq.table.${key}`, { defaultValue: key });
  const columnName = (key: string, fallback?: string | null) => dqColumnLabel(t, table?.SBR_TABLE, key, fallback);
  const dimensionName = (name: string) => t(`dq.dimension.${name}`, { defaultValue: name });
  const rulesLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? t('dq.rule', { defaultValue: 'rule' }) : t('dq.rules', { defaultValue: 'rules' })}`;

  const registerPct = headline?.WEIGHTED_PCT ?? null;
  const registerTier = tierFor(registerPct);

  let content: React.ReactNode;
  if (!canView) {
    content = <Card><NoData message={t('dq.noAccess', { defaultValue: 'You do not have access to data quality scores.' })} /></Card>;
  } else if (isLoading) {
    content = <QualityDashboardSkeleton />;
  } else if (isError) {
    content = <Card><ErrorState message={t('dq.loadError', { defaultValue: 'Failed to load data quality scores. Please try again.' })} onRetry={refetch} /></Card>;
  } else if (!lastRun) {
    content = (
      <Card>
        <NoData
          message={t('dq.neverScored', { defaultValue: 'The register has not been scored yet.' })}
          description={t('dq.neverScoredDesc', { defaultValue: 'Scores appear here after the first data quality run.' })}
        />
      </Card>
    );
  } else {
    content = (
      <>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          <Card className="flex items-center gap-5 p-5">
            <div className="shrink-0" style={{ width: 132, height: 132 }}>
              <EChart
                height={132}
                option={gauge({
                  value: registerPct ?? 0,
                  color: registerTier ? DQ_TIER_STYLE[registerTier].dot : DQ_NO_SCORE_COLOR,
                  width: 11,
                  valueSize: 24,
                  format: (v) => `${v.toFixed(1)}%`,
                })}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="text-xs font-semibold text-slate-400">
                {dimension
                  ? t('dq.dimensionScore', { defaultValue: '{{dimension}} score', dimension: dimensionName(dimension.name) })
                  : t('dq.registerScore', { defaultValue: 'Register score' })}
              </div>
              <TierBadge tier={registerTier} />
              <div className="text-xs text-slate-600">
                {t('dq.qdtiIndex', { defaultValue: 'QDTI index' })}: <span className="font-semibold tabular-nums">{formatPct(headline?.QDTI_SCORE_PCT)}</span>
              </div>
              <div className="text-xs text-slate-500">
                {t('dq.rulesOnTables', { defaultValue: '{{rules}} rules scored on {{tables}} tables', rules: formatNumber(headline?.RULES_SCORED ?? 0), tables: tables.filter(appliesTo).length })}
              </div>
              {dimension && (
                <button type="button" onClick={() => pickDimension(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-adaam hover:underline">
                  <X className="h-3.5 w-3.5" />
                  {t('dq.allDimensions', { defaultValue: 'All dimensions' })}
                </button>
              )}
              {errored > 0 && (
                <div className="text-xs text-red-600">{t('dq.rulesErrored', { defaultValue: '{{count}} could not be scored', count: errored })}</div>
              )}
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <CardHead title={t('dq.byDimension', { defaultValue: 'By quality dimension' })} sub={t('dq.byDimensionSub2', { defaultValue: 'Weighted pass rate across the whole register. Pick a dimension to see only its scores and rules.' })} />
            <div className="space-y-0.5">
              {dimensionScores.map((d) => (
                <ScoreRow
                  key={d.name}
                  label={dimensionName(d.name)}
                  pct={d.row?.WEIGHTED_PCT ?? null}
                  note={d.row ? rulesLabel(d.row.RULES_SCORED) : undefined}
                  active={selDimension === d.name}
                  onClick={() => pickDimension(d.name)}
                />
              ))}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">{t('dq.byTable', { defaultValue: 'By table' })}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((tb) => {
              const on = tb.SBR_TABLE === table?.SBR_TABLE;
              const applies = appliesTo(tb);
              const pct = dimension ? (tb[dimension.tableKey] as number | null) : tb.OVERALL_SCORE;
              const tier = tierFor(pct);
              return (
                <button
                  key={tb.SBR_TABLE}
                  type="button"
                  disabled={!applies}
                  onClick={() => { setSelTable(tb.SBR_TABLE); setSelColumn(null); }}
                  title={applies ? undefined : t('dq.tableNoDimension', { defaultValue: 'No {{dimension}} rules on this table', dimension: dimension ? dimensionName(dimension.name) : '' })}
                  className={`rounded-xl border bg-white p-4 text-start shadow-card transition-colors ${!applies ? 'cursor-not-allowed border-transparent opacity-40 grayscale' : on ? 'border-adaam ring-1 ring-adaam' : 'border-transparent hover:border-slate-200'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-800">{tableName(tb.SBR_TABLE)}</span>
                    {applies && <TierBadge tier={tier} />}
                  </div>
                  <div className="mt-1 text-[26px] font-extrabold leading-tight tabular-nums text-slate-900">{applies ? formatPct(pct) : '—'}</div>
                  <div className="mt-2"><ScoreBar pct={applies ? pct : null} tier={tier} /></div>
                  <div className="mt-2 text-[11.5px] text-slate-500">
                    {!applies
                      ? t('dq.tableNoDimensionShort', { defaultValue: 'No {{dimension}} rules', dimension: dimension ? dimensionName(dimension.name) : '' })
                      : dimension
                        ? t('dq.dimensionOnTable', { defaultValue: '{{dimension}} only', dimension: dimensionName(dimension.name) })
                        : t('dq.rulesScoredOf', { defaultValue: '{{scored}} of {{total}} rules scored', scored: tb.RULES_SCORED, total: tb.RULES_CNT })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {table && (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-2">
              <CardHead title={t('dq.tableDimensions', { defaultValue: '{{table}} by dimension', table: tableName(table.SBR_TABLE) })} />
              <div className="space-y-0.5">
                {DQ_DIMENSIONS.map((d) => {
                  const pct = table[d.tableKey] as number | null;
                  return (
                    <ScoreRow
                      key={d.name}
                      label={dimensionName(d.name)}
                      pct={pct}
                      emptyText={t('dq.noRules', { defaultValue: 'no rules' })}
                      noteColumn={false}
                      active={selDimension === d.name}
                      onClick={pct != null ? () => pickDimension(d.name) : undefined}
                    />
                  );
                })}
              </div>
            </Card>
            <Card className="p-5 lg:col-span-3">
              <CardHead
                title={t('dq.tableColumns', { defaultValue: '{{table}} by column', table: tableName(table.SBR_TABLE) })}
                sub={dimension
                  ? t('dq.tableColumnsDimSub', { defaultValue: '{{dimension}} rules only, worst first. Pick a column to see its rules.', dimension: dimensionName(dimension.name) })
                  : t('dq.tableColumnsSub', { defaultValue: 'Worst first. Pick a column to see its rules.' })}
              />
              <div className="space-y-0.5">
                {columns.map((c) => (
                  <ScoreRow
                    key={c.column}
                    label={columnName(c.column, c.fieldName)}
                    pct={c.pct}
                    note={rulesLabel(c.rules)}
                    active={selColumn === c.column}
                    onClick={() => setSelColumn(selColumn === c.column ? null : c.column)}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        {table && (
          <Card className="p-5">
            <CardHead
              title={selColumn
                ? t('dq.rulesForColumn', { defaultValue: 'Rules on {{column}}', column: columnName(selColumn) })
                : t('dq.rulesForTable', { defaultValue: 'Rules on {{table}}', table: tableName(table.SBR_TABLE) })}
              sub={dimension ? `${rulesLabel(shownRules.length)} · ${dimensionName(dimension.name)}` : rulesLabel(shownRules.length)}
              action={selColumn ? (
                <button type="button" onClick={() => setSelColumn(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-adaam hover:underline">
                  <X className="h-3.5 w-3.5" />
                  {t('dq.allColumns', { defaultValue: 'All columns' })}
                </button>
              ) : undefined}
            />
            <DqRulesTable rules={shownRules} />
          </Card>
        )}

        <p className="px-1 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">{t('dq.howTitle', { defaultValue: 'How scores work' })}: </span>
          {t('dq.howText', { defaultValue: 'Each rule checks one or more columns and scores the share of records that pass. Table, column and dimension scores weight each rule by its importance (high, medium, low). Good is 85% and above, fair is 60% to 85%, poor is below 60%. The QDTI index is the official score, based on each rule\'s 1 to 3 points.' })}
        </p>
      </>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.qualityDashboard.title')}
        description={t('pages.qualityDashboard.description')}
        actions={lastRun ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Gauge className="h-4 w-4" />
            {t('dq.lastScored', { defaultValue: 'Last scored' })}
            <span className="font-medium text-slate-700">{formatDateTime(lastRun.FINISHED_AT)}</span>
          </div>
        ) : undefined}
      />
      <QualityTabs active="/quality/dashboard" />
      {content}
    </PageContainer>
  );
}
