import { Suspense } from 'react';
import { Home } from 'lucide-react';
import { NeighborhoodTab } from '@/components/dashboard/neighborhood-tab';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Neighborhood',
  description:
    'Personalized earthquake tracking for your Bay Area neighborhood. Set your location and get customized seismic activity alerts and analysis.',
  openGraph: {
    title: 'My Neighborhood | Bay Tremor',
    description:
      'Personalized earthquake tracking for your Bay Area neighborhood.',
  },
};

export default function MyAreaPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 md:pb-6">
      {/* STATIC SHELL — built at deploy, served from CDN, visible without JS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <header className="pt-6 sm:pt-8 pb-6 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              My Neighborhood
            </h1>
            <p className="text-neutral-400 mt-0.5 text-sm">
              Find earthquakes people felt near your address
            </p>
          </div>
        </header>
      </div>

      {/* DYNAMIC — client-side interactive content, streams in via Suspense */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <Suspense fallback={<NeighborhoodContentSkeleton />}>
          <NeighborhoodTab />
        </Suspense>
      </div>
    </div>
  );
}

function NeighborhoodContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-white/5 rounded-xl border border-white/10" />
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10" />
        <div className="h-5 bg-white/10 rounded w-64 mx-auto mb-3" />
        <div className="h-4 bg-white/5 rounded w-80 mx-auto" />
      </div>
      <div className="h-[400px] bg-white/5 rounded-xl border border-white/10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-24 bg-white/5 rounded-xl border border-white/5"
          />
        ))}
      </div>
    </div>
  );
}
