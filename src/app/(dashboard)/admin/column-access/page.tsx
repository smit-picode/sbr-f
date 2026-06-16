import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata = { title: 'Column Access — SBR Portal' };

export default function ColumnAccessPage() {
  return (
    <PageContainer>
      <PageHeader title="Column Access" description="Configure column-level access control per role" />
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm font-medium">This feature will be implemented in the next phase</p>
      </div>
    </PageContainer>
  );
}
