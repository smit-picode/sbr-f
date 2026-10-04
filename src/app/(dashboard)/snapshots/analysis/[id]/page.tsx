import { AnalysisReportPage } from '@/features/analysis/pages/AnalysisReportPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalysisReportPage key={id} id={id} />;
}
