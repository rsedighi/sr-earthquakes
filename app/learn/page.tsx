import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn About Earthquakes',
  description: 'Learn about Bay Area earthquakes, fault lines, and seismic activity. Understand the Hayward, San Andreas, and Calaveras faults. Earthquake preparedness education.',
  openGraph: {
    title: 'Learn About Earthquakes | Bay Tremor',
    description: 'Educational resources about Bay Area earthquakes and fault lines.',
  },
};

export default async function LearnPage() {
  const summary = await generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="learn" />
    </Suspense>
  );
}
