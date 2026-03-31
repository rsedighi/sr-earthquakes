import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Compare Regions',
  description: 'Compare earthquake activity across Bay Area regions. See side-by-side seismic data for San Ramon, Oakland, San Francisco, San Jose, and other areas.',
  openGraph: {
    title: 'Compare Regions | Bay Tremor',
    description: 'Compare earthquake activity across different Bay Area regions.',
  },
};

export default async function ComparePage() {
  const summary = await generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="compare" />
    </Suspense>
  );
}
