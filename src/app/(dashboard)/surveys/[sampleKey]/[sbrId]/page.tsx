import { SurveyResponsePage } from '@/features/surveys/pages/SurveyResponsePage';

export default async function Page({ params }: { params: Promise<{ sampleKey: string; sbrId: string }> }) {
  const { sampleKey, sbrId } = await params;
  return <SurveyResponsePage sampleKey={sampleKey} sbrId={sbrId} />;
}
