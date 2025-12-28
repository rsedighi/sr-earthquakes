import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Discussions',
  description: 'Join the Bay Area earthquake community. Discuss recent seismic activity, share experiences, get preparedness tips, and connect with neighbors in our earthquake discussion forums.',
  openGraph: {
    title: 'Community Discussions | Bay Tremor',
    description: 'Join the Bay Area earthquake community. Discuss seismic activity and connect with neighbors.',
  },
};

export default async function CommunityPage() {
  const summary = generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard historicalSummary={summary} initialTab="community" />
    </Suspense>
  );
}

export const revalidate = 3600;


