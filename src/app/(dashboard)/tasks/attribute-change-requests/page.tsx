import { Suspense } from 'react';
import { AttributeChangeRequestsPage } from '@/features/tasks/pages/AttributeChangeRequestsPage';

export default function Page() {
  // The page reads useSearchParams() (?tableName= from the reviewer home), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AttributeChangeRequestsPage />
    </Suspense>
  );
}
