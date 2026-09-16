import { ContactDetailPage } from '@/features/contacts/pages/ContactDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactDetailPage contactId={Number(id)} />;
}
