import { Suspense } from 'react';
import { AttributeChangeRequestsPage } from '@/features/tasks/pages/AttributeChangeRequestsPage';

export default function Page() {
  // The page reads useSearchParams, so it needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AttributeChangeRequestsPage />
    </Suspense>
  );
}
