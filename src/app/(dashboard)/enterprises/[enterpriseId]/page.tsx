import { EnterpriseDetailPage } from '@/features/enterprises/pages/EnterpriseDetailPage';

export const metadata = { title: 'Enterprise — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ enterpriseId: string }> }) {
  const { enterpriseId } = await params;
  return <EnterpriseDetailPage enterpriseId={Number(enterpriseId)} />;
}
