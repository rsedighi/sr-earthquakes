'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Earthquake } from '@/lib/types';
import { getRegionForCoordinates } from '@/lib/regions';

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
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
  const [longitude = 0, latitude = 0, depth = 0] = feature.geometry?.coordinates ?? [0, 0, 0];
  const mag = typeof feature.properties?.mag === 'number' && !isNaN(feature.properties.mag)
    ? feature.properties.mag
    : 0;
  const timeMs = typeof feature.properties?.time === 'number' && !isNaN(feature.properties.time)
    ? feature.properties.time
    : Date.now();

  return {
    id: feature.id,
    magnitude: mag,
    place: feature.properties?.place || 'Bay Area',
    time: new Date(timeMs),
    timestamp: timeMs,
    latitude,
    longitude,
    depth: typeof depth === 'number' && !isNaN(depth) ? depth : 0,
    felt: feature.properties?.felt ?? null,
    significance: feature.properties?.sig ?? 0,
    url: feature.properties?.url || (feature.id ? `https://earthquake.usgs.gov/earthquakes/eventpage/${feature.id}` : 'https://earthquake.usgs.gov/'),
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/earthquakes?feed=${feed}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json() as { features: USGSFeature[] };
      const converted = (data.features || []).map(convertFeature);
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

    let active = true;

    function connect() {
      if (!active || wsConnected.current || wsRef.current) return;
      if (retryCountRef.current >= 5) {
        // Stop retrying WebSocket after consecutive failures, fallback cleanly to polling
        return;
      }

      try {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://${window.location.host}/api/ws/earthquakes`);
        wsRef.current = ws;

        ws.onopen = () => {
          wsConnected.current = true;
          retryCountRef.current = 0;
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
          if (active && retryCountRef.current < 5) {
            retryCountRef.current += 1;
            const delay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 60000);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        wsConnected.current = false;
        wsRef.current = null;
      }
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
      wsConnected.current = false;
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
