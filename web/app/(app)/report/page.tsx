import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { ReportView } from './ReportView';

export const metadata: Metadata = { title: 'Report a car' };

export default function ReportPage() {
  // ReportView reads ?plate= from the URL, so it renders in the browser.
  return (
    <Suspense fallback={<Spinner className="size-6 text-brand" />}>
      <ReportView />
    </Suspense>
  );
}
