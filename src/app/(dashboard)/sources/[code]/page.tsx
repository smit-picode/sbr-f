import { SourceRegulatorTablesPage } from '@/features/sourceData/pages/SourceRegulatorTablesPage';

export const metadata = { title: 'Source Tables — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SourceRegulatorTablesPage code={decodeURIComponent(code)} />;
}
