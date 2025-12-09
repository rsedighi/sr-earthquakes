import { NextRequest, NextResponse } from 'next/server';

// USGS Earthquake API - Free, no API key needed!
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

// Northern California bounding box
const NORCAL_BOUNDS = {
  minLat: 36.5,
  maxLat: 39.0,
  minLon: -123.5,
  maxLon: -121.0,
};

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
    coordinates: [number, number, number]; // lon, lat, depth
  };
}

interface USGSResponse {
  features: USGSFeature[];
  metadata: {
    count: number;
    generated: number;
    title: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters
  const years = parseInt(searchParams.get('years') || '10');
  const minMagnitude = parseFloat(searchParams.get('minmag') || '1.0');
  const feltOnly = searchParams.get('felt') === 'true';
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);
  
  // Build USGS API URL
  // This is the USGS FDSN Event Web Service - completely free!
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: startDate.toISOString().split('T')[0],
    endtime: endDate.toISOString().split('T')[0],
    minlatitude: NORCAL_BOUNDS.minLat.toString(),
    maxlatitude: NORCAL_BOUNDS.maxLat.toString(),
    minlongitude: NORCAL_BOUNDS.minLon.toString(),
    maxlongitude: NORCAL_BOUNDS.maxLon.toString(),
    minmagnitude: minMagnitude.toString(),
    orderby: 'time',
  });
  
  // Add felt filter if requested (minimum felt reports)
  if (feltOnly) {
    params.set('minfelt', '1');
  }
  
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}`);
    }
    
    const data: USGSResponse = await response.json();
    
    // Transform to our format
    const earthquakes = data.features.map(feature => ({
      id: feature.id,
      magnitude: feature.properties.mag || 0,
      place: feature.properties.place || 'Unknown location',
      time: new Date(feature.properties.time),
      timestamp: feature.properties.time,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2],
      felt: feature.properties.felt,
      significance: feature.properties.sig || 0,
      url: feature.properties.url,
      region: 'norcal', // Will be assigned by client
    }));
    
    return NextResponse.json({
      earthquakes,
      metadata: {
        count: earthquakes.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bounds: NORCAL_BOUNDS,
        feltOnly,
        minMagnitude,
      },
    });
  } catch (error) {
    console.error('Error fetching historical USGS data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical earthquake data' },
      { status: 500 }
    );
  }
}

