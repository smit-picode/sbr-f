'use client';

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { Check, ClipboardList, Clock, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useGetSurveyParticipationQuery, useGetSurveySamplesQuery } from '../api/surveysApi';
import { RESPONSE_FROM_ESTABLISHMENT, RESPONSE_STATUS_COLORS, RESPONSE_STATUS_KEY, SURVEYS } from '../constants';
import { sampleSlug } from '../utils/classify';
import type { ResponseStatus } from '../types';

function StatusIcon({ status }: { status: ResponseStatus }) {
  if (status === 'Responded') return <Check className="h-[11px] w-[11px]" />;
  if (status === 'Non-response') return <X className="h-[11px] w-[11px]" />;
  return <Clock className="h-[11px] w-[11px]" />;
}

// Every survey period on record, with the ones this establishment was sampled in coloured by its response.
export function SurveyParticipation({ sbrId }: { sbrId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const samplesQuery = useGetSurveySamplesQuery();
  const participationQuery = useGetSurveyParticipationQuery(sbrId);

  const surveys = useMemo(() => {
    const status = new Map((participationQuery.data?.data ?? []).map((p) => [`${p.SURVEY_ID}|${p.PERIOD}`, p.RESPONSE_STATUS]));
    const periods = samplesQuery.data?.data ?? [];
    return SURVEYS.map((survey) => {
      const rows = periods
        .filter((p) => p.SURVEY_ID === survey.id)
        .map((p) => ({ period: p.PERIOD, status: status.get(`${survey.id}|${p.PERIOD}`) ?? null }));
      return {
        survey,
        periods: rows,
        sampledCount: rows.filter((r) => r.status).length,
        respondedCount: rows.filter((r) => r.status === 'Responded').length,
      };
    });
  }, [participationQuery.data, samplesQuery.data]);

  const isLoading = samplesQuery.isLoading || participationQuery.isLoading;
  const isError = samplesQuery.isError || participationQuery.isError;
  const everSampled = surveys.some((s) => s.sampledCount > 0);

  const openResponse = (surveyId: string, period: string) =>
    router.push(`/surveys/${sampleSlug(surveyId, period)}/${sbrId}?from=${RESPONSE_FROM_ESTABLISHMENT}`);

  return (
    <div className="rounded-lg bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-100 px-4 py-3">
        <ClipboardList className="h-4 w-4 text-[#A29374]" />
        <h2 className="text-sm font-semibold text-slate-800">{t('surveySamples.participation')}</h2>
        <span className="text-[11px] text-slate-400">{t('surveySamples.participationCtx')}</span>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {SURVEYS.map((s) => <Skeleton key={s.id} className="h-9 w-full rounded-md" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => { samplesQuery.refetch(); participationQuery.refetch(); }} />
        ) : !everSampled ? (
          <p className="text-[12.5px] text-slate-400">{t('surveySamples.neverSampled')}</p>
        ) : (
          <div className="space-y-3">
            {surveys.map(({ survey, periods, sampledCount, respondedCount }) => (
              <div key={survey.id} className="flex items-start gap-3">
                <div className="w-[120px] shrink-0 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: survey.color }} />
                    <span className="text-[12.5px] font-semibold text-slate-800">{survey.short}</span>
                  </div>
                  <div className="text-[10.5px] text-slate-400">
                    {`${respondedCount}/${sampledCount} ${t('surveySamples.respondedShort')}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {periods.map(({ period, status }) => {
                    if (!status) {
                      return (
                        <span key={period} className="inline-flex items-center rounded-full border border-dashed border-slate-200 px-2 py-0.5 text-[11px] text-slate-300">
                          {period}
                        </span>
                      );
                    }
                    const c = RESPONSE_STATUS_COLORS[status];
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => openResponse(survey.id, period)}
                        title={t(`surveySamples.${RESPONSE_STATUS_KEY[status]}`)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold hover:opacity-80"
                        style={{ background: c.bg, color: c.fg }}
                      >
                        <StatusIcon status={status} />
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
