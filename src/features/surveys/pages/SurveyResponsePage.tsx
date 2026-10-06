'use client';

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { SurveysAccessGuard } from '../components/SurveysAccessGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate, nullableText } from '@/utils/format';
import { useGetSurveyResponseDetailQuery } from '../api/surveysApi';
import { ANSWERED_STATUSES, RESPONSE_FROM_ESTABLISHMENT, RESPONSE_STATUS_COLORS, RESPONSE_STATUS_KEY, SURVEY_QUESTIONS } from '../constants';
import { parseSampleSlug } from '../utils/classify';
import { surveyById } from '../utils/aggregate';
import type { AnswerUnit } from '../types';

function formatAnswer(value: string | number | null | undefined, unit: AnswerUnit): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') {
    if (unit === 'QAR') return `${value.toLocaleString()} QAR`;
    if (unit === '%') return `${value}%`;
    if (unit === 'persons') return value.toLocaleString();
  }
  return String(value);
}

// One establishment's response to one survey period, reached from a sample's establishment list.
function SurveyResponseContent({ sampleKey, sbrId, from }: { sampleKey: string; sbrId: string; from?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { surveyId, period } = parseSampleSlug(sampleKey);
  const survey = surveyById(surveyId);
  const sbrIdNum = Number(sbrId);
  const { data, isLoading, isError, error, refetch } = useGetSurveyResponseDetailQuery(
    { sbrId: sbrIdNum, surveyId: survey?.id ?? 'AES', period },
    { skip: !survey || !period || !Number.isInteger(sbrIdNum) }
  );
  const detail = data?.data;
  // Opened from an establishment's survey participation, Back returns there instead of to the sample.
  const back = from === RESPONSE_FROM_ESTABLISHMENT
    ? { label: t('surveySamples.backToEst'), onClick: () => router.push(`/establishments/${sbrId}`) }
    : { label: t('surveySamples.backToSample'), onClick: () => router.push(`/surveys/${sampleKey}`) };

  const answers = useMemo(() => {
    if (!survey || !detail?.ANSWERS || !ANSWERED_STATUSES.includes(detail.RESPONSE_STATUS)) return [];
    return SURVEY_QUESTIONS[survey.id].map((q) => ({ ...q, value: formatAnswer(detail.ANSWERS?.[q.column], q.unit) }));
  }, [survey, detail]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  // A 404 means the establishment wasn't sampled for that period; anything else is a real failure.
  const notFound = !survey || (isError && (error as { status?: number })?.status === 404);
  if (isError && !notFound) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} back={back} />
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  if (notFound || !detail) {
    return (
      <PageContainer>
        <PageHeader title={t('surveySamples.overviewTitle')} back={back} />
        <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-card">{t('surveySamples.notSampled')}</div>
      </PageContainer>
    );
  }

  const response = {
    frame: detail,
    survey,
    period: detail.PERIOD,
    status: detail.RESPONSE_STATUS,
    mode: detail.COLLECTION_MODE,
    respondedAt: detail.RESPONDED_ON,
  };
  const f = response.frame;
  const statusColor = RESPONSE_STATUS_COLORS[response.status];
  const facts: [string, string][] = [
    ['SBR ID', `#${f.SBR_ID}`],
    ['CR', f.MOCI_CR_NUM || '—'],
    [t('filters.source'), f.SOURCE_CODE || '—'],
    [t('filters.sector'), f.SECTOR_ID || '—'],
    [t('surveySamples.mode'), nullableText(response.mode)],
    [t('surveySamples.respondedAt'), response.respondedAt ? formatDate(response.respondedAt) : '—'],
  ];

  return (
    <PageContainer>
      <PageHeader
        title={f.NAME_ENU || `#${f.SBR_ID}`}
        description={f.NAME_ARA ? <span dir="rtl" lang="ar">{f.NAME_ARA}</span> : undefined}
        back={back}
        chips={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
              {`${response.survey.short} · ${response.period}`}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold" style={{ color: statusColor.fg }}>
              {t(`surveySamples.${RESPONSE_STATUS_KEY[response.status]}`)}
            </span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 rounded-xl bg-white px-6 py-4 shadow-card sm:grid-cols-3 lg:grid-cols-6">
        {facts.map(([label, value]) => (
          <div key={label}>
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className="truncate text-[13px] font-semibold text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-adaam" />
          <h2 className="text-[14px] font-bold text-slate-800">{t('surveySamples.responseData')}</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{answers.length}</span>
        </div>
        {answers.length ? (
          <div className="divide-y divide-slate-100">
            {answers.map((a) => (
              <div key={a.code} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-2.5">
                <span className="font-mono text-[11px] font-bold text-slate-400">{a.code}</span>
                <span className="text-[13px] text-slate-700">{a.label}</span>
                <span className="text-[13.5px] font-bold tabular-nums text-slate-900">{a.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-[13px] text-slate-400">{t('surveySamples.noResponseData')}</div>
        )}
      </div>
    </PageContainer>
  );
}

export function SurveyResponsePage({ sampleKey, sbrId, from }: { sampleKey: string; sbrId: string; from?: string }) {
  return (
    <SurveysAccessGuard>
      <SurveyResponseContent sampleKey={sampleKey} sbrId={sbrId} from={from} />
    </SurveysAccessGuard>
  );
}
