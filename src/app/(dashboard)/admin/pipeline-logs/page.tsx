import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata = { title: 'Pipeline Logs — SBR Portal' };

export default function PipelineLogsPage() {
  return (
    <PageContainer>
      <PageHeader title="Pipeline Logs" description="Monitor data pipeline execution and processing logs" />
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm font-medium">This feature will be implemented in the next phase</p>
      </div>
    </PageContainer>
  );
}
