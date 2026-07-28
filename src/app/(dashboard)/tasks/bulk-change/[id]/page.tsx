import { BulkChangeReviewPage } from '@/features/bulkChange/pages/BulkChangeReviewPage';

export const metadata = { title: 'Bulk Change Review — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BulkChangeReviewPage id={id} />;
}
