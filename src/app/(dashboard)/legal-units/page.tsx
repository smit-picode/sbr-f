import { Suspense } from 'react';
import { LegalUnitsPage } from '@/features/legalUnits/pages/LegalUnitsPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LegalUnitsPage />
    </Suspense>
  );
}
