import { NextRequest, NextResponse } from 'next/server';
import { logger, logExternalCall } from '@/lib/logger';

const FEEDS = {
  all_hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  all_day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  all_week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
};

// Bay Area proper (9 counties) - tighter bounds that exclude areas like The Geysers
// which is a geothermal area ~70 miles north of SF
const BAY_AREA_BOUNDS = {
  minLat: 36.9,   // Southern Santa Clara County
  maxLat: 38.35,  // Northern Solano/Napa (excludes The Geysers at ~38.75)
  minLon: -123.0, // Pacific coast
  maxLon: -121.4, // Eastern Contra Costa/Alameda
};

// Server-side cache: USGS updates their feeds roughly once per minute, so re-fetching
// on every 10s client poll from every user is pure waste. Cache per feed for 30s —
// still near-real-time, but collapses N concurrent viewers into 1 upstream call.
const feedCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 30_000;

async function fetchFeedWithCache(feed: keyof typeof FEEDS) {
  const feedUrl = FEEDS[feed] || FEEDS.all_day;
  const now = Date.now();

  const cached = feedCache.get(feed);
  if (cached && now < cached.expiry) {
    return { data: cached.data, fromCache: true, fetchDuration: 0 };
  }

  const fetchStart = Date.now();
  const response = await fetch(feedUrl, { cache: 'no-store' });
  const fetchDuration = Date.now() - fetchStart;

  if (!response.ok) {
    logExternalCall('usgs', 'fetchFeed', false, fetchDuration, {
      feed,
      statusCode: response.status,
    });
    throw new Error(`USGS API returned ${response.status}`);
  }

  const data = await response.json();
  feedCache.set(feed, { data, expiry: now + CACHE_TTL_MS });

  logExternalCall('usgs', 'fetchFeed', true, fetchDuration, {
    feed,
    totalCount: data.features?.length || 0,
  });

  return { data, fromCache: false, fetchDuration };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const feed = (searchParams.get('feed') || 'all_day') as keyof typeof FEEDS;

  try {
    const { data, fromCache, fetchDuration } = await fetchFeedWithCache(feed);
    const typedData = data as { features: { geometry: { coordinates: [number, number, number] } }[]; metadata: Record<string, unknown> };

    const filteredFeatures = typedData.features.filter((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      return lat >= BAY_AREA_BOUNDS.minLat &&
             lat <= BAY_AREA_BOUNDS.maxLat &&
             lon >= BAY_AREA_BOUNDS.minLon &&
             lon <= BAY_AREA_BOUNDS.maxLon;
    });

    const totalDuration = Date.now() - startTime;

    if (!fromCache) {
      logger.debug('Earthquakes API — upstream fetch', {
        path: '/api/earthquakes',
        method: 'GET',
        statusCode: 200,
        duration: totalDuration,
        fetchDuration,
        feed,
        earthquakeCount: filteredFeatures.length,
      });
    }

    // Allow CDN + browser to hold the response briefly (stale-while-revalidate
    // lets the browser show its cached copy instantly while re-fetching behind
    // the scenes — this directly lowers the p75 that the RUM monitor tracks).
    return NextResponse.json(
      {
        ...typedData,
        features: filteredFeatures,
        metadata: {
          ...typedData.metadata,
          count: filteredFeatures.length,
          region: 'San Francisco Bay Area',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
          'CDN-Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
          'Netlify-CDN-Cache-Control': 'public, max-age=15, stale-while-revalidate=30, durable',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch earthquake data from USGS', {
      path: '/api/earthquakes',
      method: 'GET',
      statusCode: 500,
      duration,
      feed,
      error,
      service: 'usgs',
    });

    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
}

