import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { loadAllEarthquakes, generateHistoricalSummary } from '@/lib/server-data';
import { getRegionById } from '@/lib/regions';
import { HistoryFeed } from '@/components/history-feed';
import type { SerializedEarthquake } from '@/components/history-feed';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historical Earthquake Analysis',
  description:
    'Explore historical earthquake data for the Bay Area. Analyze past seismic events, swarm patterns, and trends along the Calaveras, Hayward, and San Andreas fault lines.',
  openGraph: {
    title: 'Historical Earthquake Analysis | Bay Tremor',
    description:
      'Explore historical earthquake data and swarm patterns for the Bay Area.',
  },
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 md:pb-6">
      {/* STATIC SHELL — built at deploy, served from CDN, visible without JS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <header className="pt-6 sm:pt-8 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Earthquake History
          </h1>
          <p className="text-neutral-400 mt-2 text-sm sm:text-base max-w-2xl">
            15 years of seismic data for the San Francisco Bay Area — swarm
            patterns, magnitude trends, and regional comparisons along the
            Calaveras, Hayward, and San Andreas fault lines.
          </p>
        </header>
      </div>

      {/* CACHED — server-rendered HTML, revalidated hourly via ISR */}
      <Suspense fallback={<HistoryContentSkeleton />}>
        <CachedHistoryContent />
      </Suspense>
    </div>
  );
}

async function CachedHistoryContent() {
  'use cache';
  cacheLife('hours');
  cacheTag('earthquakes', 'history');

  const [allQuakes, summary] = await Promise.all([
    loadAllEarthquakes(),
    generateHistoricalSummary(),
  ]);

  const top25: SerializedEarthquake[] = allQuakes.slice(0, 25).map(eq => ({
    id: eq.id,
    magnitude: eq.magnitude,
    place: eq.place,
    timestamp: eq.timestamp,
    latitude: eq.latitude,
    longitude: eq.longitude,
    depth: eq.depth,
    felt: eq.felt,
    significance: eq.significance,
    url: eq.url,
    region: eq.region,
  }));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 space-y-6">
      {/* Summary cards — pure server HTML, no JS needed */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">15 Years of Data</h3>
          <div className="space-y-4">
            <SummaryRow label="Total Earthquakes">
              {summary.totalCount.toLocaleString()}
            </SummaryRow>
            <SummaryRow label="Swarm Events Detected">
              {summary.swarmSummaries.length}
            </SummaryRow>
            <SummaryRow label="Largest Recorded">
              M{summary.biggestQuake?.magnitude.toFixed(1)}
            </SummaryRow>
            <SummaryRow label="Data Range" noBorder>
              <span className="text-sm text-neutral-300">2010 – Present</span>
            </SummaryRow>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Regional Comparison</h3>
          <p className="text-sm text-neutral-400 mb-4">
            How does earthquake activity compare across Northern California
            regions?
          </p>
          <div className="space-y-4">
            {summary.regionStats
              .filter(r => r.totalCount > 0)
              .sort((a, b) => b.totalCount - a.totalCount)
              .slice(0, 4)
              .map(stat => {
                const region = getRegionById(stat.regionId);
                const maxCount = Math.max(
                  ...summary.regionStats.map(r => r.totalCount)
                );
                return (
                  <div key={stat.regionId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300">
                        {region?.name || stat.regionId}
                      </span>
                      <span className="text-neutral-500">
                        {stat.totalCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(stat.totalCount / maxCount) * 100}%`,
                          backgroundColor: region?.color || '#6b7280',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Top 25 + deferred swarm analysis */}
      <HistoryFeed initialData={top25} totalCount={allQuakes.length} />
    </div>
  );
}

function SummaryRow({
  label,
  children,
  noBorder,
}: {
  label: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        noBorder ? '' : 'border-b border-white/5'
      }`}
    >
      <span className="text-neutral-400">{label}</span>
      <span className="text-2xl font-light">{children}</span>
    </div>
  );
}

function HistoryContentSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 space-y-6">
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-1/3" />
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-white/5"
            >
              <div className="h-4 bg-white/5 rounded w-1/3" />
              <div className="h-7 bg-white/5 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-4 bg-white/5 rounded w-12" />
              </div>
              <div className="h-2 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 animate-pulse"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
            <div className="h-8 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
