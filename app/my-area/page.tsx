import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Neighborhood',
  description: 'Personalized earthquake tracking for your Bay Area neighborhood. Set your location and get customized seismic activity alerts and analysis.',
  openGraph: {
    title: 'My Neighborhood | Bay Tremor',
    description: 'Personalized earthquake tracking for your Bay Area neighborhood.',
  },
};

export default async function MyAreaPage() {
  const summary = await generateHistoricalSummary();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="neighborhood" />
    </Suspense>
  );
}


