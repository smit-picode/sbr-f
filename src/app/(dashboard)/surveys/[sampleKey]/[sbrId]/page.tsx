import { SurveyResponsePage } from '@/features/surveys/pages/SurveyResponsePage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sampleKey: string; sbrId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { sampleKey, sbrId } = await params;
  const { from } = await searchParams;
  return <SurveyResponsePage sampleKey={sampleKey} sbrId={sbrId} from={from} />;
}
