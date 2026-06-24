import { AddressDetailPage } from '@/features/addresses/pages/AddressDetailPage';

export const metadata = { title: 'Address — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddressDetailPage addressId={Number(id)} />;
}
