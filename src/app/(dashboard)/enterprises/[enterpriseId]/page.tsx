import { EnterpriseDetailPage } from '@/features/enterprises/pages/EnterpriseDetailPage';

export default async function Page({ params }: { params: Promise<{ enterpriseId: string }> }) {
  const { enterpriseId } = await params;
  return <EnterpriseDetailPage enterpriseId={Number(enterpriseId)} />;
}
