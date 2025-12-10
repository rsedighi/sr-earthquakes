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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const feed = (searchParams.get('feed') || 'all_day') as keyof typeof FEEDS;
  
  const feedUrl = FEEDS[feed] || FEEDS.all_day;
  
  try {
    const fetchStart = Date.now();
    const response = await fetch(feedUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    const fetchDuration = Date.now() - fetchStart;
    
    if (!response.ok) {
      logExternalCall('usgs', 'fetchFeed', false, fetchDuration, {
        feed,
        statusCode: response.status,
      });
      throw new Error(`USGS API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to Bay Area earthquakes only
    const filteredFeatures = data.features.filter((feature: {
      geometry: { coordinates: [number, number, number] }
    }) => {
      const [lon, lat] = feature.geometry.coordinates;
      return lat >= BAY_AREA_BOUNDS.minLat && 
             lat <= BAY_AREA_BOUNDS.maxLat && 
             lon >= BAY_AREA_BOUNDS.minLon && 
             lon <= BAY_AREA_BOUNDS.maxLon;
    });
    
    const totalDuration = Date.now() - startTime;
    
    logExternalCall('usgs', 'fetchFeed', true, fetchDuration, {
      feed,
      totalCount: data.features?.length || 0,
      filteredCount: filteredFeatures.length,
    });
    
    logger.info('Earthquakes API request completed', {
      path: '/api/earthquakes',
      method: 'GET',
      statusCode: 200,
      duration: totalDuration,
      feed,
      earthquakeCount: filteredFeatures.length,
    });
    
    return NextResponse.json({
      ...data,
      features: filteredFeatures,
      metadata: {
        ...data.metadata,
        count: filteredFeatures.length,
        region: 'San Francisco Bay Area',
      },
    });
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

