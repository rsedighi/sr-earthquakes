import type { APIRoute } from 'astro';

const FEEDS: Record<string, string> = {
  all_hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  all_day:  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  all_week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
};

const BAY_AREA_BOUNDS = {
  minLat: 36.9,
  maxLat: 38.35,
  minLon: -123.0,
  maxLon: -121.4,
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const reqUrl = new URL(request.url);
    const feedParam = reqUrl.searchParams.get('feed') || 'all_day';
    const feedUrl = FEEDS[feedParam] ?? FEEDS.all_day;

    const response = await fetch(feedUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `USGS API returned ${response.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as { features: Array<{ geometry: { coordinates: [number, number, number] } }> };

    const filteredFeatures = data.features.filter((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      return (
        lat >= BAY_AREA_BOUNDS.minLat &&
        lat <= BAY_AREA_BOUNDS.maxLat &&
        lon >= BAY_AREA_BOUNDS.minLon &&
        lon <= BAY_AREA_BOUNDS.maxLon
      );
    });

    return new Response(
      JSON.stringify({ ...data, features: filteredFeatures }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[api/earthquakes] error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch earthquake data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
