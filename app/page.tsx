import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';

export default async function Home() {
  const summary = await generateHistoricalSummary();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="live" />
    </Suspense>
  );
}
