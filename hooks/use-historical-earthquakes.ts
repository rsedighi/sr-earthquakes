'use client';

import { useState, useEffect, useCallback } from 'react';
import { Earthquake } from '@/lib/types';
import { getRegionForCoordinates } from '@/lib/regions';

interface UseHistoricalEarthquakesOptions {
  years?: number;
  minMagnitude?: number;
  feltOnly?: boolean;
  autoFetch?: boolean;
}

interface HistoricalEarthquakesResult {
  earthquakes: Earthquake[];
  isLoading: boolean;
  error: string | null;
  metadata: {
    count: number;
    startDate: string;
    endDate: string;
  } | null;
  fetch: () => Promise<void>;
}

export function useHistoricalEarthquakes({
  years = 10,
  minMagnitude = 1.0,
  feltOnly = false,
  autoFetch = true,
}: UseHistoricalEarthquakesOptions = {}): HistoricalEarthquakesResult {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    count: number;
    startDate: string;
    endDate: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        years: years.toString(),
        minmag: minMagnitude.toString(),
        felt: feltOnly.toString(),
      });

      const response = await fetch(`/api/earthquakes/historical?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();

      // Transform and assign regions
      const transformedQuakes: Earthquake[] = data.earthquakes.map((eq: {
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
      }) => ({
        ...eq,
        time: new Date(eq.time),
        region: getRegionForCoordinates(eq.latitude, eq.longitude),
      }));

      setEarthquakes(transformedQuakes);
      setMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [years, minMagnitude, feltOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    earthquakes,
    isLoading,
    error,
    metadata,
    fetch: fetchData,
  };
}

