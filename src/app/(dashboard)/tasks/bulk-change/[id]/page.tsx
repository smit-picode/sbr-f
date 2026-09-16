import { BulkChangeReviewPage } from '@/features/bulkChange/pages/BulkChangeReviewPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BulkChangeReviewPage id={id} />;
}
