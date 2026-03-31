'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useHistoricalEarthquakes } from '@/hooks/use-historical-earthquakes';
import type { Earthquake } from '@/lib/types';
import { DashboardFooter } from './footer';
import { FeedbackModal } from '@/components/feedback-modal';

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [historicalQuakes, setHistoricalQuakes] = useState<Earthquake[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalLoaded, setHistoricalLoaded] = useState(false);

  const { earthquakes: recentQuakes } = useHistoricalEarthquakes({
    minMagnitude: 0.1,
    autoFetch: true,
  });

  const loadHistoricalQuakes = useCallback(async () => {
    if (historicalLoading || historicalLoaded) return;
    setHistoricalLoading(true);
    try {
      const res = await fetch('/api/earthquakes/list?all=true');
      if (res.ok) {
        const data = await res.json();
        const quakes: Earthquake[] = data.earthquakes.map(
          (eq: {
            id: string;
            magnitude: number;
            place: string;
            time: string;
            timestamp: number;
            latitude: number;
            longitude: number;
            depth: number;
            felt: number | null;
            significance: number;
            url: string;
            region: string;
          }) => ({
            ...eq,
            time: new Date(eq.time),
          })
        );
        setHistoricalQuakes(quakes);
        setHistoricalLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load historical earthquakes:', error);
    } finally {
      setHistoricalLoading(false);
    }
  }, [historicalLoading, historicalLoaded]);

  const allHistoricalQuakes = useMemo(() => {
    const seenIds = new Set<string>();
    const merged: Earthquake[] = [];
    for (const eq of recentQuakes) {
      if (!seenIds.has(eq.id)) {
        seenIds.add(eq.id);
        merged.push(eq);
      }
    }
    for (const eq of historicalQuakes) {
      if (!seenIds.has(eq.id)) {
        seenIds.add(eq.id);
        merged.push(eq);
      }
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentQuakes, historicalQuakes]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <MyNeighborhood
        historicalEarthquakes={allHistoricalQuakes}
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
