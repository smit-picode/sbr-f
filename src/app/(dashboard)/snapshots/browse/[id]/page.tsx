import { SnapshotDetailPage } from '@/features/snapshots/pages/SnapshotDetailPage';

export const metadata = { title: 'Frozen Frame — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SnapshotDetailPage id={Number(id)} />;
}
