'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, MapPin, Loader2, Flame } from 'lucide-react';
import type { Earthquake } from '@/lib/types';
import { getMagnitudeColor } from '@/lib/analysis';

const HistoricalSwarms = dynamic(
  () => import('@/components/historical-swarms').then(mod => mod.HistoricalSwarms),
  { ssr: false, loading: () => <SwarmAnalysisSkeleton /> }
);

export interface SerializedEarthquake {
  id: string;
  magnitude: number;
  place: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  felt: number | null;
  significance: number;
  url: string;
  region: string;
}

interface HistoryFeedProps {
  initialData: SerializedEarthquake[];
  totalCount: number;
}

export function HistoryFeed({ initialData, totalCount }: HistoryFeedProps) {
  const [allEarthquakes, setAllEarthquakes] = useState<Earthquake[] | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadFullData = useCallback(async () => {
    if (isLoadingFull || allEarthquakes) return;
    setIsLoadingFull(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/earthquakes/list?all=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const quakes: Earthquake[] = data.earthquakes.map(
        (eq: SerializedEarthquake & { time: string }) => ({
          ...eq,
          time: new Date(eq.time),
        })
      );
      setAllEarthquakes(quakes);
    } catch {
      console.error('Failed to load full earthquake data');
      setLoadError(true);
    } finally {
      setIsLoadingFull(false);
    }
  }, [isLoadingFull, allEarthquakes]);

  useEffect(() => {
    const timer = setTimeout(loadFullData, 150);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Server-rendered top 25 — visible without JS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-neutral-500" />
            Recent Earthquakes
          </h2>
          <span className="text-sm text-neutral-500">
            Showing 25 of {totalCount.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          {initialData.map(eq => (
            <a
              key={eq.id}
              href={eq.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 transition-colors group"
            >
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0"
                style={{
                  backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                  color: getMagnitudeColor(eq.magnitude),
                  border: `1.5px solid ${getMagnitudeColor(eq.magnitude)}30`,
                }}
              >
                {eq.magnitude.toFixed(1)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base text-neutral-200 truncate group-hover:text-white transition-colors">
                  {eq.place}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <time
                    dateTime={new Date(eq.timestamp).toISOString()}
                    className="flex items-center gap-1"
                    suppressHydrationWarning
                  >
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(eq.timestamp), { addSuffix: true })}
                  </time>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {eq.depth.toFixed(1)}km deep
                  </span>
                  {eq.felt != null && eq.felt > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                      {eq.felt} felt
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:block text-xs text-neutral-500 px-2 py-1 bg-white/5 rounded-lg flex-shrink-0 capitalize">
                {eq.region.replace(/-/g, ' ')}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Full Swarm Analysis — progressive enhancement */}
      <section>
        {allEarthquakes ? (
          <HistoricalSwarms earthquakes={allEarthquakes} />
        ) : (
          <div className="text-center py-8">
            {isLoadingFull ? (
              <div className="flex items-center justify-center gap-3 text-neutral-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading swarm analysis…</span>
              </div>
            ) : loadError ? (
              <button
                onClick={loadFullData}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-neutral-300 hover:text-white transition-colors"
              >
                <Flame className="w-4 h-4" />
                Retry Loading Swarm Analysis
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function SwarmAnalysisSkeleton() {
  return (
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
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
      <div className="h-96 bg-white/5 rounded-xl border border-white/10 mt-6" />
    </div>
  );
}
