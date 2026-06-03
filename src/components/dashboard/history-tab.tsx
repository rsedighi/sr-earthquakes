'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

import type { Earthquake } from '@/lib/types';
import { getRegionById } from '@/lib/regions';
import type { HistoricalSummary } from './types';

const HistoricalSwarms = dynamic(() => import('@/components/historical-swarms').then(mod => mod.HistoricalSwarms), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-12 bg-white/5 rounded-xl w-48" />
        <div className="h-12 bg-white/5 rounded-xl w-40" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
      </div>
      <div className="h-96 bg-white/5 rounded-xl border border-white/10 mt-6" />
    </div>
  )
});

interface HistoryTabProps {
  allHistoricalQuakes: Earthquake[];
  historicalLoading: boolean;
  historicalLoaded: boolean;
  historicalSummary: HistoricalSummary;
}

export function HistoryTab({
  allHistoricalQuakes,
  historicalLoading,
  historicalLoaded,
  historicalSummary,
}: HistoryTabProps) {
  return (
    <>
      {historicalLoading && !historicalLoaded ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-12 bg-white/5 rounded-xl w-48" />
            <div className="h-12 bg-white/5 rounded-xl w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
          </div>
          <div className="h-96 bg-white/5 rounded-xl border border-white/10 mt-6" />
          <div className="text-center mt-4">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">Loading historical data...</p>
          </div>
        </div>
      ) : (
        <HistoricalSwarms earthquakes={allHistoricalQuakes} />
      )}
      
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">15 Years of Data</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-neutral-400">Total Earthquakes</span>
              <span className="text-2xl font-light">{historicalSummary.totalCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-neutral-400">Swarm Events Detected</span>
              <span className="text-2xl font-light">{historicalSummary.swarmSummaries.length}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-neutral-400">Largest Recorded</span>
              <span className="text-2xl font-light">M{historicalSummary.biggestQuake?.magnitude.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-neutral-400">Data Range</span>
              <span className="text-sm text-neutral-300">2010 – Present</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Regional Comparison</h3>
          <p className="text-sm text-neutral-400 mb-4">
            How does earthquake activity compare across Northern California regions?
          </p>
          <div className="space-y-4">
            {historicalSummary.regionStats
              .filter(r => r.totalCount > 0)
              .sort((a, b) => b.totalCount - a.totalCount)
              .slice(0, 4)
              .map(stat => {
                const region = getRegionById(stat.regionId);
                const maxCount = Math.max(...historicalSummary.regionStats.map(r => r.totalCount));
                return (
                  <div key={stat.regionId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300">{region?.name || stat.regionId}</span>
                      <span className="text-neutral-500">{stat.totalCount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(stat.totalCount / maxCount) * 100}%`,
                          backgroundColor: region?.color || '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </>
  );
}
