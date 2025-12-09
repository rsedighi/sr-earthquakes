import { NextRequest, NextResponse } from 'next/server';
import { getEarthquakesPage, getSwarmsForRegion, loadAllEarthquakes } from '@/lib/server-data';

// API endpoint for paginated historical earthquake data
// This keeps the heavy data on the server and only sends what's needed
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const region = searchParams.get('region') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 20000); // Allow large batches for history view
  const minMagnitude = parseFloat(searchParams.get('minmag') || '0');
  const startDate = searchParams.get('start') ? parseInt(searchParams.get('start')!, 10) : undefined;
  const endDate = searchParams.get('end') ? parseInt(searchParams.get('end')!, 10) : undefined;
  const includeSwarms = searchParams.get('swarms') === 'true';
  const fetchAll = searchParams.get('all') === 'true'; // For history/swarm views that need complete data
  
  try {
    // For history/swarm views, fetch all data at once (region-filtered)
    if (fetchAll) {
      let allQuakes = loadAllEarthquakes();
      
      // Apply region filter if specified
      if (region && region !== 'all') {
        allQuakes = allQuakes.filter(eq => eq.region === region);
      }
      
      // Apply magnitude filter
      if (minMagnitude > 0) {
        allQuakes = allQuakes.filter(eq => eq.magnitude >= minMagnitude);
      }
      
      const earthquakes = allQuakes.map(eq => ({
        ...eq,
        time: eq.time.toISOString(),
      }));
      
      return NextResponse.json({
        earthquakes,
        total: earthquakes.length,
        hasMore: false,
        page: 1,
        limit: earthquakes.length,
      });
    }
    
    const result = getEarthquakesPage({
      region,
      page,
      limit,
      minMagnitude,
      startDate,
      endDate,
    });
    
    // Serialize earthquakes (Date objects need conversion)
    const earthquakes = result.earthquakes.map(eq => ({
      ...eq,
      time: eq.time.toISOString(),
    }));
    
    // Optionally include swarms for the region
    let swarms = undefined;
    if (includeSwarms && region && region !== 'all') {
      const regionSwarms = getSwarmsForRegion(region);
      swarms = regionSwarms.slice(0, 20).map(swarm => ({
        id: swarm.id,
        startTime: swarm.startTime.toISOString(),
        endTime: swarm.endTime.toISOString(),
        peakMagnitude: swarm.peakMagnitude,
        totalCount: swarm.totalCount,
        region: swarm.region,
        centerLat: swarm.centerLat,
        centerLon: swarm.centerLon,
      }));
    }
    
    return NextResponse.json({
      earthquakes,
      total: result.total,
      hasMore: result.hasMore,
      page,
      limit,
      swarms,
    });
  } catch (error) {
    console.error('Error fetching earthquakes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
}

