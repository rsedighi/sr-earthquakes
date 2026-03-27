import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Historical Earthquake Analysis',
  description: 'Explore historical earthquake data for the Bay Area. Analyze past seismic events, swarm patterns, and trends along the Calaveras, Hayward, and San Andreas fault lines.',
  openGraph: {
    title: 'Historical Earthquake Analysis | Bay Tremor',
    description: 'Explore historical earthquake data and swarm patterns for the Bay Area.',
  },
};

export default async function HistoryPage() {
  const summary = await generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="history" />
    </Suspense>
  );
}
