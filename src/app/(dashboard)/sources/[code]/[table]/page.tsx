import { SourceTablePage } from '@/features/sourceData/pages/SourceTablePage';

export const metadata = { title: 'Source Table — SBR Portal' };

export default async function Page({ params }: { params: Promise<{ code: string; table: string }> }) {
  const { code, table } = await params;
  return <SourceTablePage code={decodeURIComponent(code)} table={decodeURIComponent(table)} />;
}
