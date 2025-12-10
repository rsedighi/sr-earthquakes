import { NextRequest, NextResponse } from 'next/server';
import { logger, logExternalCall } from '@/lib/logger';

// USGS Earthquake API - Free, no API key needed!
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

// Northern California / Bay Area bounding box
const BAYAREA_BOUNDS = {
  minLat: 36.5,
  maxLat: 39.0,
  minLon: -123.5,
  maxLon: -121.0,
};

// Historical data cutoff - we have static data up to this date
// After this date, we fetch from USGS API
const HISTORICAL_DATA_CUTOFF = '2025-12-08';

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
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Get parameters
  const minMagnitude = parseFloat(searchParams.get('minmag') || '0.1');
  const feltOnly = searchParams.get('felt') === 'true';
  const recentOnly = searchParams.get('recent') === 'true'; // Only fetch data after cutoff
  
  // Calculate date range - only fetch RECENT data (since our static data cutoff)
  const endDate = new Date();
  const startDate = recentOnly 
    ? new Date(HISTORICAL_DATA_CUTOFF) 
    : new Date(HISTORICAL_DATA_CUTOFF); // Always start from cutoff - historical data is in files
  
  // Format dates as YYYY-MM-DD (USGS requires this exact format)
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Build USGS API URL - only for recent data since 12/8/2025
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: formatDate(startDate),
    endtime: formatDate(endDate),
    minlatitude: BAYAREA_BOUNDS.minLat.toString(),
    maxlatitude: BAYAREA_BOUNDS.maxLat.toString(),
    minlongitude: BAYAREA_BOUNDS.minLon.toString(),
    maxlongitude: BAYAREA_BOUNDS.maxLon.toString(),
    minmagnitude: minMagnitude.toString(),
    orderby: 'time',
    limit: '5000',
  });
  
  // Add felt filter if requested
  if (feltOnly) {
    params.set('minfelt', '1');
  }
  
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;
  
  logger.debug('Fetching recent USGS historical data', {
    path: '/api/earthquakes/historical',
    minMagnitude,
    feltOnly,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  });
  
  try {
    const fetchStart = Date.now();
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes for recent data
    });
    const fetchDuration = Date.now() - fetchStart;
    
    if (!response.ok) {
      const errorText = await response.text();
      
      logExternalCall('usgs', 'fetchHistorical', false, fetchDuration, {
        statusCode: response.status,
        errorPreview: errorText.slice(0, 200),
      });
      
      throw new Error(`USGS API returned ${response.status}: ${errorText.slice(0, 200)}`);
    }
    
    const data: USGSResponse = await response.json();
    
    // Transform to our format and deduplicate by ID
    const seenIds = new Set<string>();
    const earthquakes = data.features
      .filter(feature => {
        if (seenIds.has(feature.id)) return false;
        seenIds.add(feature.id);
        return true;
      })
      .map(feature => ({
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
    
    const totalDuration = Date.now() - startTime;
    
    logExternalCall('usgs', 'fetchHistorical', true, fetchDuration, {
      rawCount: data.features?.length || 0,
      deduplicatedCount: earthquakes.length,
    });
    
    logger.info('Historical earthquakes API request completed', {
      path: '/api/earthquakes/historical',
      method: 'GET',
      statusCode: 200,
      duration: totalDuration,
      earthquakeCount: earthquakes.length,
      minMagnitude,
      feltOnly,
    });
    
    return NextResponse.json({
      earthquakes,
      metadata: {
        count: earthquakes.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bounds: BAYAREA_BOUNDS,
        feltOnly,
        minMagnitude,
        note: 'Recent data only. Historical data (before 2025-12-08) is loaded from static files.',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch historical earthquake data from USGS', {
      path: '/api/earthquakes/historical',
      method: 'GET',
      statusCode: 500,
      duration,
      error,
      service: 'usgs',
      minMagnitude,
      feltOnly,
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch recent earthquake data', details: String(error) },
      { status: 500 }
    );
  }
}

