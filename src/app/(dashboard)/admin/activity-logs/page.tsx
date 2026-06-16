import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata = { title: 'Activity Logs — SBR Portal' };

export default function ActivityLogsPage() {
  return (
    <PageContainer>
      <PageHeader title="Activity Logs" description="Track user actions and system activity across the portal" />
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm font-medium">This feature will be implemented in the next phase</p>
      </div>
    </PageContainer>
  );
}
