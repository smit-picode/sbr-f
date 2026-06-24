import { EstablishmentDetailPage } from '@/features/establishments/pages/EstablishmentDetailPage';

export const metadata = { title: 'Establishment — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ sbrId: string }> }) {
  const { sbrId } = await params;
  return <EstablishmentDetailPage sbrId={Number(sbrId)} />;
}
