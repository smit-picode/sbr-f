import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata = { title: 'Rule Registry — SBR Portal' };

export default function RuleRegistryPage() {
  return (
    <PageContainer>
      <PageHeader title="Rule Registry" description="Manage data quality and validation rules" />
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm font-medium">This feature will be implemented in the next phase</p>
      </div>
    </PageContainer>
  );
}
