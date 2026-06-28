import { ChangeRequestDetailPage } from '@/features/tasks/pages/ChangeRequestDetailPage';

export const metadata = { title: 'Change Request — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChangeRequestDetailPage id={Number(id)} />;
}
