'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { getPipelineStepLogColumns } from '../components/PipelineStepLogColumns';
import { useGetPipelineStepLogQuery } from '../api/pipelineLogsApi';
import { toast } from '@/utils/toast';

function is401(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 401; }
function is403(e: unknown): boolean { return typeof e === 'object' && e !== null && 'status' in e && (e as { status: unknown }).status === 403; }

export function PipelineRunDetailPage({ runId }: { runId: number }) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useGetPipelineStepLogQuery(runId);

  const isPermissionError = isError && is403(error);
  const isSessionError    = isError && is401(error);

  useEffect(() => {
    if (isError && !isPermissionError && !isSessionError) {
      toast.error(t('pipelineLogs.stepLoadError', { defaultValue: 'Failed to load step log. Please try again.' }));
    }
  }, [isError, isPermissionError, isSessionError, t]);

  const columns = getPipelineStepLogColumns(t);
  const records = (isPermissionError || isSessionError) ? [] : (data?.data ?? []);

  return (
    <PageContainer>
      <PageHeader
        title={t('pipelineLogs.runDetailTitle', { defaultValue: 'Pipeline Run #{{runId}}', runId }) as string}
        description={t('pipelineLogs.runDetailDescription', { defaultValue: 'Step-by-step execution log for this run — read-only.' })}
        back={{ label: t('pipelineLogs.backToRuns', { defaultValue: 'Back to runs' }), onClick: () => router.push('/admin/pipeline-logs') }}
      />

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        page={1}
        limit={records.length || 1}
        total={records.length}
        onPageChange={() => {}}
        onLimitChange={() => {}}
      />
    </PageContainer>
  );
}
