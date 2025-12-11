'use client';

import { useState, useEffect, useCallback } from 'react';
import { Earthquake } from '@/lib/types';
import { getRegionForCoordinates } from '@/lib/regions';

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    felt: number | null;
    sig: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface UseRealtimeEarthquakesOptions {
  feed?: 'all_hour' | 'all_day' | 'all_week';
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseRealtimeEarthquakesResult {
  earthquakes: Earthquake[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

function convertFeature(feature: USGSFeature): Earthquake {
  const [longitude, latitude, depth] = feature.geometry.coordinates;
  return {
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    time: new Date(feature.properties.time),
    timestamp: feature.properties.time,
    latitude,
    longitude,
    depth,
    felt: feature.properties.felt,
    significance: feature.properties.sig,
    url: feature.properties.url,
    region: getRegionForCoordinates(latitude, longitude),
  };
}

export function useRealtimeEarthquakes({
  feed = 'all_day',
  refreshInterval = 60000,
  enabled = true,
}: UseRealtimeEarthquakesOptions = {}): UseRealtimeEarthquakesResult {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/earthquakes?feed=${feed}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const converted = data.features.map(convertFeature);
      converted.sort((a: Earthquake, b: Earthquake) => b.timestamp - a.timestamp);
      
      setEarthquakes(converted);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [feed]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchData]);

  return {
    earthquakes,
    isLoading,
    error,
    lastUpdated,
    refresh,
    isRefreshing,
  };
}


