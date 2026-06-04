'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Earthquake } from '@/lib/types';
import { getRegionForCoordinates } from '@/lib/regions';
import { getPusherClient, EARTHQUAKE_CHANNEL, PUSHER_EVENTS } from '@/lib/pusher';

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

const USGS_FEEDS: Record<string, string> = {
  all_hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  all_day:  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  all_week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
};

const BAY_AREA_BOUNDS = {
  minLat: 36.9, maxLat: 38.35,
  minLon: -123.0, maxLon: -121.4,
};

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
  const pusherConnected = useRef(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const usgsUrl = USGS_FEEDS[feed] ?? USGS_FEEDS.all_day;
      const response = await fetch(usgsUrl);

      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }

      const data = await response.json();

      const filtered = (data.features as USGSFeature[]).filter((f) => {
        const [lon, lat] = f.geometry.coordinates;
        return (
          lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
          lon >= BAY_AREA_BOUNDS.minLon && lon <= BAY_AREA_BOUNDS.maxLon
        );
      });

      const converted = filtered.map(convertFeature);
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

  // Pusher: subscribe for instant push notifications of new quakes
  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(EARTHQUAKE_CHANNEL);
    pusherConnected.current = true;

    channel.bind(PUSHER_EVENTS.NEW_EARTHQUAKE, () => {
      fetchData(true);
    });

    return () => {
      channel.unbind(PUSHER_EVENTS.NEW_EARTHQUAKE);
      pusher.unsubscribe(EARTHQUAKE_CHANNEL);
      pusherConnected.current = false;
    };
  }, [enabled, fetchData]);

  // Fallback polling (60s default — only needed if Pusher is down or unconfigured)
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
