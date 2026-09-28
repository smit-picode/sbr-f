import { SampleDetailPage } from '@/features/surveys/pages/SampleDetailPage';

export default async function Page({ params }: { params: Promise<{ sampleKey: string }> }) {
  const { sampleKey } = await params;
  return <SampleDetailPage sampleKey={sampleKey} />;
}
