'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Earthquake, EarthquakeFeedSnapshot, FeedState } from '@/lib/types';
import { getRegionForCoordinates } from '@/lib/regions';
import { trackAction, trackError } from '@/components/datadog-rum';

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
  initialData?: EarthquakeFeedSnapshot;
}

interface UseRealtimeEarthquakesResult {
  earthquakes: Earthquake[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  feedState: FeedState;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

const LIVE_FEED_MAX_AGE_MS = 5 * 60 * 1000;

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
  initialData,
}: UseRealtimeEarthquakesOptions = {}): UseRealtimeEarthquakesResult {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>(initialData?.earthquakes ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData?.generatedAt ? new Date(initialData.generatedAt) : null);
  const [feedState, setFeedState] = useState<FeedState>(initialData?.state ?? 'loading');
  const earthquakesRef = useRef(initialData?.earthquakes ?? []);
  const hasInitialDataRef = useRef(Boolean(initialData));
  const hasValidFeedRef = useRef(Boolean(initialData && initialData.state !== 'unavailable'));
  const requestIdRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnected = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    if (isRefresh || hasInitialDataRef.current) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    const startedAt = performance.now();

    try {
      const res = await fetch(`/api/earthquakes?feed=${feed}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json() as { features: USGSFeature[]; metadata?: { generated?: number } };
      if (!Array.isArray(data.features)) throw new Error('Invalid earthquake feed');
      const converted = data.features.map(convertFeature);
      const generatedAt = typeof data.metadata?.generated === 'number' ? data.metadata.generated : null;
      const sourceAgeMs = generatedAt === null ? null : Math.max(0, Date.now() - generatedAt);
      converted.sort((a, b) => b.timestamp - a.timestamp);
      if (requestId !== requestIdRef.current) return;
      earthquakesRef.current = converted;
      hasValidFeedRef.current = true;
      setEarthquakes(converted);
      setError(null);
      setLastUpdated(generatedAt === null ? null : new Date(generatedAt));
      setFeedState(sourceAgeMs !== null && sourceAgeMs <= LIVE_FEED_MAX_AGE_MS ? 'live' : 'delayed');
      if (!isRefresh) {
        trackAction('feed_ready', {
          feed,
          earthquakeCount: converted.length,
          latencyMs: Math.round(performance.now() - startedAt),
          sourceAgeMs: sourceAgeMs ?? undefined,
        });
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setFeedState(hasValidFeedRef.current ? 'delayed' : 'unavailable');
      trackError(error, { feed, operation: isRefresh ? 'refresh' : 'initial_load' });
      trackAction('feed_failed', { feed, message: error.message });
    } finally {
      if (requestId === requestIdRef.current) {
        hasInitialDataRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
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

  useEffect(() => {
    if (feedState !== 'live' || !lastUpdated) return;
    const remainingFreshness = LIVE_FEED_MAX_AGE_MS - Math.max(0, Date.now() - lastUpdated.getTime());
    const id = setTimeout(() => setFeedState(current => current === 'live' ? 'delayed' : current), Math.max(0, remainingFreshness));
    return () => clearTimeout(id);
  }, [feedState, lastUpdated]);

  return { earthquakes, isLoading, error, lastUpdated, feedState, refresh, isRefreshing };
}
