import type { APIRoute } from 'astro';
import { getEarthquakeFeed, setEarthquakeFeed } from '@/lib/kv';

type FeedKey = 'all_hour' | 'all_day' | 'all_week';

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
  return features.filter(({ geometry: { coordinates: [lon, lat] } }) =>
    lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
    lon >= BAY_AREA_BOUNDS.minLon && lon <= BAY_AREA_BOUNDS.maxLon,
  );
}

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const feedParam = (new URL(request.url).searchParams.get('feed') || 'all_day') as FeedKey;
  const feed = FEEDS[feedParam] ? feedParam : 'all_day';

  try {
    // KV cache hit?
    const cached = await getEarthquakeFeed<{ features: Array<{ geometry: { coordinates: [number, number, number] } }> }>(
      env.EARTHQUAKE_KV, feed,
    );
    if (cached) {
      return Response.json(
        { ...cached, features: filterBayArea(cached.features) },
        { headers: { 'Cache-Control': 'public, max-age=60' } },
      );
    }

    // Cache miss — fetch from USGS
    const upstream = await fetch(FEEDS[feed], { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) {
      return Response.json({ error: `USGS API returned ${upstream.status}` }, { status: 502 });
    }

    const data = await upstream.json() as { features: Array<{ geometry: { coordinates: [number, number, number] } }> };

    // Write full dataset to KV (the cron worker in Sprint 4 will take over this role)
    await setEarthquakeFeed(env.EARTHQUAKE_KV, feed, data);

    return Response.json(
      { ...data, features: filterBayArea(data.features) },
      { headers: { 'Cache-Control': 'public, max-age=60' } },
    );
  } catch (err) {
    console.error('[api/earthquakes]', err);
    return Response.json({ error: 'Failed to fetch earthquake data' }, { status: 500 });
  }
};
