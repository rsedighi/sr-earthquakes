import { NextRequest, NextResponse } from 'next/server';

const FEEDS = {
  all_hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  all_day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  all_week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
};

// Northern California bounding box (approximate)
const NORCAL_BOUNDS = {
  minLat: 36.5,
  maxLat: 39.0,
  minLon: -123.5,
  maxLon: -121.0,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feed = (searchParams.get('feed') || 'all_day') as keyof typeof FEEDS;
  
  const feedUrl = FEEDS[feed] || FEEDS.all_day;
  
  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to Northern California earthquakes
    const filteredFeatures = data.features.filter((feature: {
      geometry: { coordinates: [number, number, number] }
    }) => {
      const [lon, lat] = feature.geometry.coordinates;
      return lat >= NORCAL_BOUNDS.minLat && 
             lat <= NORCAL_BOUNDS.maxLat && 
             lon >= NORCAL_BOUNDS.minLon && 
             lon <= NORCAL_BOUNDS.maxLon;
    });
    
    return NextResponse.json({
      ...data,
      features: filteredFeatures,
      metadata: {
        ...data.metadata,
        count: filteredFeatures.length,
        region: 'Northern California',
      },
    });
  } catch (error) {
    console.error('Error fetching USGS data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
}

