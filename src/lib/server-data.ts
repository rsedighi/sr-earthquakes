/**
 * CF Workers compatible server-side data helpers.
 * Replaces lib/server-data.ts (Next.js / server-only / cacheLife incompatible).
 * All functions use native fetch — caching handled at edge by wrangler.toml TTLs + KV.
 */
import type { Earthquake, USGSFeature } from './types';
import { getRegionForCoordinates } from './regions';

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

export async function loadAllEarthquakes(feed: 'all_day' | 'all_week' = 'all_week'): Promise<Earthquake[]> {
  try {
    const res = await fetch(`${USGS_BASE}/${feed}.geojson`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { features: USGSFeature[] };
    const quakes: Earthquake[] = [];
    for (const f of data.features) {
      const q = parseFeature(f);
      if (q) quakes.push(q);
    }
    return quakes.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export async function getRecentUSGSQuakes(limit = 15): Promise<Earthquake[]> {
  const quakes = await loadAllEarthquakes('all_day');
  return quakes.slice(0, limit);
}

// Historical summary lives in `./historical.ts` (needs HISTORICAL_R2 + KV bindings).
// Import from there directly in Astro pages: `getHistoricalSummary(env.HISTORICAL_R2, env.EARTHQUAKE_KV)`.
