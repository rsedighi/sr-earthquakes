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

/**
 * Hook for fetching RECENT earthquake data (since Dec 8, 2025).
 * 
 * NOTE: Historical data (before Dec 8, 2025) is loaded from static JSON files 
 * at build time and passed via props. This hook only fetches NEW data from 
 * the USGS API to supplement that historical data.
 * 
 * For historical analysis, use the data passed from page.tsx via props.
 */
export function useHistoricalEarthquakes({
  minMagnitude = 0.1,
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
      // Only fetch RECENT data (since Dec 8, 2025) - historical data comes from static files
      const params = new URLSearchParams({
        recent: 'true',
        minmag: minMagnitude.toString(),
        felt: feltOnly.toString(),
      });

      const response = await fetch(`/api/earthquakes/historical?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent earthquake data');
      }

      const data = await response.json();

      // Deduplicate by ID
      const seenIds = new Set<string>();
      
      // Transform and assign regions
      const transformedQuakes: Earthquake[] = data.earthquakes
        .filter((eq: { id: string }) => {
          if (seenIds.has(eq.id)) return false;
          seenIds.add(eq.id);
          return true;
        })
        .map((eq: {
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
      // Don't set error for this - we have historical data from files
      console.warn('Could not fetch recent earthquake data:', err);
      setError(null); // Clear error - we have fallback data
      setEarthquakes([]); // Empty array - historical data is in props
    } finally {
      setIsLoading(false);
    }
  }, [minMagnitude, feltOnly]);

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

