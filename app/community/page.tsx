import { Suspense } from 'react';
import { BayTremorCommunity } from '@/components/bay-tremor-community';
import { NavBar } from '@/components/dashboard/components/nav-bar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bay Tremor Community - Bay Area Earthquake Discussions',
  description: 'Share your earthquake experiences, discuss seismic activity, and connect with Bay Area neighbors. Join the Bay Tremor community!',
  openGraph: {
    title: 'Bay Tremor Community | Bay Area Earthquake Discussions',
    description: 'Share earthquake experiences and connect with Bay Area neighbors.',
  },
};

function CommunityLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-32 bg-gradient-to-r from-orange-600/50 to-amber-500/50" />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-neutral-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <div className="pb-20 md:pb-0">
      <NavBar currentPath="/community" />
      <Suspense fallback={<CommunityLoading />}>
        <BayTremorCommunity />
      </Suspense>
    </div>
  );
}

export const revalidate = 60;
