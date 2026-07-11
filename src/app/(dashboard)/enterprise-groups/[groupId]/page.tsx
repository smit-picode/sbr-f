import { EnterpriseGroupDetailPage } from '@/features/enterpriseGroups/pages/EnterpriseGroupDetailPage';

export const metadata = { title: 'Enterprise Group — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <EnterpriseGroupDetailPage groupId={Number(groupId)} />;
}
