'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Earthquake } from '@/lib/types';
import { DashboardFooter } from './footer';
import { FeedbackModal } from '@/components/feedback-modal';
import { UnitProvider } from '@/lib/unit-context';

const MyNeighborhood = dynamic(
  () => import('@/components/my-neighborhood').then(mod => mod.MyNeighborhood),
  {
    ssr: false,
    loading: () => <NeighborhoodSkeleton />,
  }
);

function NeighborhoodSkeleton() {
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
          <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
    </div>
  );
}

export function NeighborhoodTab() {
  return (
    <UnitProvider>
      <NeighborhoodTabInner />
    </UnitProvider>
  );
}

function NeighborhoodTabInner() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [historicalQuakes, setHistoricalQuakes] = useState<Earthquake[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalLoaded, setHistoricalLoaded] = useState(false);

  // /api/earthquakes/list?all=true already merges the R2 historical archive
  // with recent D1 rows, so it is the single data source for this page.
  const loadHistoricalQuakes = useCallback(async () => {
    if (historicalLoading || historicalLoaded) return;
    setHistoricalLoading(true);
    try {
      const res = await fetch('/api/earthquakes/list?all=true');
      if (res.ok) {
        const data = (await res.json()) as {
          earthquakes: Array<Omit<Earthquake, 'time'> & { time: string }>;
        };
        const quakes: Earthquake[] = data.earthquakes.map(eq => ({
          ...eq,
          time: new Date(eq.time),
        }));
        setHistoricalQuakes(quakes);
        setHistoricalLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load historical earthquakes:', error);
    } finally {
      setHistoricalLoading(false);
    }
  }, [historicalLoading, historicalLoaded]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <MyNeighborhood
        historicalEarthquakes={historicalQuakes}
        isLoadingHistorical={historicalLoading}
        onRequestHistoricalData={loadHistoricalQuakes}
      />
      <DashboardFooter onShowFeedback={() => setShowFeedbackModal(true)} />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}
