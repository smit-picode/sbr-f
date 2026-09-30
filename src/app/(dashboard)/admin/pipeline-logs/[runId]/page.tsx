import { PipelineRunDetailPage } from '@/features/pipelineLogs/pages/PipelineRunDetailPage';

export const metadata = { title: 'Pipeline Run — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <PipelineRunDetailPage runId={Number(runId)} />;
}
