'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Earthquake } from '@/lib/types';
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
  refreshInterval = 60_000,
  enabled = true,
}: UseRealtimeEarthquakesOptions = {}): UseRealtimeEarthquakesResult {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnected = useRef(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/earthquakes?feed=${feed}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json() as { features: USGSFeature[] };
      const converted = data.features.map(convertFeature);
      converted.sort((a, b) => b.timestamp - a.timestamp);
      setEarthquakes(converted);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [feed]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) fetchData();
  }, [enabled, fetchData]);

  // WebSocket: connect to EarthquakeRoom DO for instant push on new quakes
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${window.location.host}/api/ws/earthquakes`);
      wsRef.current = ws;

      ws.onopen = () => {
        wsConnected.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.type === 'new_earthquake') {
            fetchData(true);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsConnected.current = false;
        wsRef.current = null;
        // Reconnect after 5s if still enabled
        setTimeout(connect, 5_000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, fetchData]);

  // Fallback polling — fires even when WS is connected as a safety net
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;
    const id = setInterval(() => fetchData(true), refreshInterval);
    return () => clearInterval(id);
  }, [enabled, refreshInterval, fetchData]);

  return { earthquakes, isLoading, error, lastUpdated, refresh, isRefreshing };
}
