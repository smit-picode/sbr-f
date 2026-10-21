import { AnalysisRenderPage } from '@/features/analysis/pages/AnalysisRenderPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalysisRenderPage id={id} />;
}
