/**
 * CF Workers compatible server-side data helpers.
 * Replaces lib/server-data.ts (Next.js / server-only / cacheLife incompatible).
 * All functions use native fetch — caching handled at edge by wrangler.toml TTLs + KV.
 */
import type { Earthquake, EarthquakeFeedSnapshot, USGSFeature, USGSResponse } from './types';
import { getRegionForCoordinates } from './regions';
import { getEarthquakeFeed, getLastKnownEarthquakeFeed, setEarthquakeFeed } from './kv';

const BAY_AREA_BOUNDS = {
  minLat: 36.9, maxLat: 38.35,
  minLon: -123.0, maxLon: -121.4,
};

const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

function parseFeature(f: USGSFeature): Earthquake | null {
  if (!f.properties?.time || f.properties?.mag == null) return null;
  const [lon, lat, depth] = f.geometry.coordinates;
  if (
    lat < BAY_AREA_BOUNDS.minLat || lat > BAY_AREA_BOUNDS.maxLat ||
    lon < BAY_AREA_BOUNDS.minLon || lon > BAY_AREA_BOUNDS.maxLon
  ) return null;
  return {
    id:         f.id,
    magnitude:  f.properties.mag,
    place:      f.properties.place,
    time:       new Date(f.properties.time),
    timestamp:  f.properties.time,
    latitude:   lat,
    longitude:  lon,
    depth,
    felt:       f.properties.felt,
    significance: f.properties.sig,
    url:        f.properties.url,
    region:     getRegionForCoordinates(lat, lon),
  };
}

const LIVE_FEED_MAX_AGE_MS = 5 * 60 * 1000;

function parseResponse(data: USGSResponse): Earthquake[] {
  const quakes: Earthquake[] = [];
  for (const feature of data.features) {
    try {
      const earthquake = parseFeature(feature);
      if (earthquake) quakes.push(earthquake);
    } catch {}
  }
  return quakes.sort((a, b) => b.timestamp - a.timestamp);
}

async function fetchUSGSFeed(feed: 'all_day' | 'all_week'): Promise<USGSResponse | null> {
  try {
    const res = await fetch(`${USGS_BASE}/${feed}.geojson`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as Partial<USGSResponse>;
    if (!Array.isArray(data.features) || !data.metadata || typeof data.metadata.generated !== 'number') return null;
    return data as USGSResponse;
  } catch {
    return null;
  }
}

function snapshotFromResponse(data: USGSResponse): EarthquakeFeedSnapshot {
  const generatedAt = Number.isFinite(data.metadata?.generated) ? data.metadata.generated : null;
  const isLive = generatedAt !== null && Date.now() - generatedAt <= LIVE_FEED_MAX_AGE_MS;
  return {
    earthquakes: parseResponse(data),
    generatedAt,
    state: isLive ? 'live' : 'delayed',
  };
}

export async function loadHomepageSnapshot(kv?: KVNamespace): Promise<EarthquakeFeedSnapshot> {
  let fallback: EarthquakeFeedSnapshot | null = null;
  if (kv) {
    const cachedResults = await Promise.allSettled([
      getEarthquakeFeed<USGSResponse>(kv, 'all_week'),
      getLastKnownEarthquakeFeed<USGSResponse>(kv, 'all_week'),
    ]);
    for (const result of cachedResults) {
      if (result.status === 'rejected' || !result.value) continue;
      try {
        const snapshot = snapshotFromResponse(result.value);
        if (!fallback || (snapshot.generatedAt ?? 0) > (fallback.generatedAt ?? 0)) fallback = snapshot;
      } catch {}
    }
    if (fallback?.state === 'live') return fallback;
  }

  const upstream = await fetchUSGSFeed('all_week');
  if (upstream) {
    const snapshot = snapshotFromResponse(upstream);
    if (!fallback || (snapshot.generatedAt ?? 0) >= (fallback.generatedAt ?? 0)) {
      if (kv) {
        try {
          await setEarthquakeFeed(kv, 'all_week', upstream);
        } catch {}
      }
      return snapshot;
    }
  }
  return fallback ? { ...fallback, state: 'delayed' } : { earthquakes: [], generatedAt: null, state: 'unavailable' };
}

export async function loadAllEarthquakes(feed: 'all_day' | 'all_week' = 'all_week'): Promise<Earthquake[]> {
  const data = await fetchUSGSFeed(feed);
  return data ? parseResponse(data) : [];
}

export async function getRecentUSGSQuakes(limit = 15): Promise<Earthquake[]> {
  const quakes = await loadAllEarthquakes('all_day');
  return quakes.slice(0, limit);
}

// Historical summary lives in `./historical.ts` (needs HISTORICAL_R2 + KV bindings).
// Import from there directly in Astro pages: `getHistoricalSummary(env.HISTORICAL_R2, env.EARTHQUAKE_KV)`.
