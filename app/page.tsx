import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';

// Load lightweight summary at build time - NOT the full earthquake array
// Full earthquake data stays on the server and is fetched on-demand via API
export default async function Home() {
  const summary = generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="live" />
    </Suspense>
  );
}

// Revalidate every hour
export const revalidate = 3600;
