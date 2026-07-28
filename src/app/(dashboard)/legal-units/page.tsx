import { Suspense } from 'react';
import { LegalUnitsPage } from '@/features/legalUnits/pages/LegalUnitsPage';

export const metadata = { title: 'Legal Units — SBR Portal' };

export default function Page() {
  // Suspense boundary required by Next.js App Router: LegalUnitsListPage reads
  // useSearchParams() (?search=... deep link from the Establishment detail page).
  return (
    <Suspense fallback={null}>
      <LegalUnitsPage />
    </Suspense>
  );
}
