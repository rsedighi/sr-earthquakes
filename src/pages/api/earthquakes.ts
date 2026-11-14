import type { APIRoute } from 'astro';
import { getEarthquakeFeed, getLastKnownEarthquakeFeed, setEarthquakeFeed } from '@/lib/kv';

type FeedKey = 'all_hour' | 'all_day' | 'all_week';

type FeedResponse = {
  metadata?: { generated?: number };
  features: Array<{ geometry: { coordinates: [number, number, number] } }>;
};

const CACHE_FRESH_MS = 2 * 60 * 1000;
const CLOCK_SKEW_TOLERANCE_MS = 30 * 1000;

const FEEDS: Record<FeedKey, string> = {
  all_hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  all_day:  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  all_week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
};

const BAY_AREA_BOUNDS = {
  minLat: 36.9, maxLat: 38.35,
  minLon: -123.0, maxLon: -121.4,
};

function filterBayArea(features: Array<{ geometry: { coordinates: [number, number, number] } }>) {
  return features.filter((feature) => {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
    const [lon, lat] = coordinates;
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
      lon >= BAY_AREA_BOUNDS.minLon && lon <= BAY_AREA_BOUNDS.maxLon;
  });
}

function getGeneratedAt(data: FeedResponse): number | null {
  const generatedAt = data.metadata?.generated;
  return typeof generatedAt === 'number' && Number.isFinite(generatedAt) ? generatedAt : null;
}

function isPlausible(generatedAt: number, now = Date.now()) {
  return generatedAt > 0 && generatedAt <= now + CLOCK_SKEW_TOLERANCE_MS;
}

function isFresh(generatedAt: number, now = Date.now()) {
  return isPlausible(generatedAt, now) && now - generatedAt <= CACHE_FRESH_MS;
}

function filteredResponse(data: FeedResponse, source: string, cacheControl: string) {
  return Response.json(
    { ...data, features: filterBayArea(data.features) },
    { headers: { 'Cache-Control': cacheControl, 'X-BayTremor-Feed': source } },
  );
}

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const feedParam = new URL(request.url).searchParams.get('feed') || 'all_day';
  const feed: FeedKey = Object.hasOwn(FEEDS, feedParam) ? feedParam as FeedKey : 'all_day';

  let cached: FeedResponse | null = null;

  // KV cache hit?
  const cachedResults = await Promise.allSettled([
    getEarthquakeFeed<FeedResponse>(env.EARTHQUAKE_KV, feed),
    getLastKnownEarthquakeFeed<FeedResponse>(env.EARTHQUAKE_KV, feed),
  ]);
  for (const result of cachedResults) {
    if (result.status === 'rejected') {
      console.error('[api/earthquakes] cache read failed:', result.reason);
      continue;
    }
    const candidate = result.value;
    if (!candidate || !Array.isArray(candidate.features)) continue;
    const generatedAt = getGeneratedAt(candidate);
    if (generatedAt === null || !isPlausible(generatedAt)) continue;
    if (!cached || generatedAt > (getGeneratedAt(cached) ?? 0)) cached = candidate;
  }

  const cachedGeneratedAt = cached ? getGeneratedAt(cached) : null;
  if (cached && cachedGeneratedAt !== null && isFresh(cachedGeneratedAt)) {
    const remainingSeconds = Math.max(0, Math.floor((CACHE_FRESH_MS - (Date.now() - cachedGeneratedAt)) / 1000));
    return filteredResponse(cached, 'fresh-cache', `public, max-age=${Math.min(60, remainingSeconds)}`);
  }

  try {
    // Cache miss — fetch from USGS
    const upstream = await fetch(FEEDS[feed], { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`USGS API returned ${upstream.status}`);

    const data = await upstream.json() as FeedResponse;
    const generatedAt = getGeneratedAt(data);
    if (!Array.isArray(data.features) || generatedAt === null || !isPlausible(generatedAt)) throw new Error('Invalid USGS feed response');

    if (!cached || generatedAt >= (cachedGeneratedAt ?? 0)) {
      // Write full dataset to KV (the cron worker in Sprint 4 will take over this role)
      try {
        await setEarthquakeFeed(env.EARTHQUAKE_KV, feed, data);
      } catch (err) {
        console.error('[api/earthquakes] cache write failed:', err);
      }
      const remainingSeconds = Math.max(0, Math.floor((CACHE_FRESH_MS - (Date.now() - generatedAt)) / 1000));
      const cacheControl = isFresh(generatedAt) ? `public, max-age=${Math.min(60, remainingSeconds)}` : 'no-cache';
      return filteredResponse(data, 'upstream', cacheControl);
    }
  } catch (err) {
    console.error('[api/earthquakes]', err);
  }

  if (cached) return filteredResponse(cached, 'stale-cache', 'no-cache');
  return Response.json({ error: 'Failed to fetch earthquake data' }, { status: 502 });
};
