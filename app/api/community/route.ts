import { NextRequest, NextResponse } from 'next/server';
import { getRecentComments, getTrendingEarthquakes, getCommunityStats, CommentWithId } from '@/lib/mongodb';
import { logger, logExternalCall } from '@/lib/logger';

// Cache for earthquake data to avoid repeated fetches
const earthquakeCache = new Map<string, { place: string; magnitude: number; time: number } | null>();

// Fetch earthquake details from USGS
async function getEarthquakeDetails(earthquakeId: string): Promise<{ place: string; magnitude: number; time: number } | null> {
  if (earthquakeCache.has(earthquakeId)) {
    return earthquakeCache.get(earthquakeId) || null;
  }
  
  try {
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${earthquakeId}.geojson`,
      { 
        next: { revalidate: 300 }, // Cache for 5 minutes (community data doesn't need to be as fresh)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = {
        place: data.properties.place,
        magnitude: data.properties.mag,
        time: data.properties.time,
      };
      earthquakeCache.set(earthquakeId, result);
      return result;
    }
  } catch (err) {
    console.error(`Failed to fetch earthquake ${earthquakeId}:`, err);
  }
  
  earthquakeCache.set(earthquakeId, null);
  return null;
}

// Enrich comments with earthquake data
async function enrichCommentsWithEarthquakeData(comments: CommentWithId[]) {
  // Get unique earthquake IDs
  const earthquakeIds = [...new Set(comments.map(c => c.earthquakeId))];
  
  // Fetch earthquake details in parallel
  const earthquakeDetails = await Promise.all(
    earthquakeIds.map(async id => ({ id, details: await getEarthquakeDetails(id) }))
  );
  
  // Create lookup map
  const detailsMap = new Map(earthquakeDetails.map(e => [e.id, e.details]));
  
  // Enrich comments
  return comments.map(comment => {
    const details = detailsMap.get(comment.earthquakeId);
    return {
      ...comment,
      earthquakePlace: details?.place,
      earthquakeMagnitude: details?.magnitude,
      earthquakeTime: details?.time ? new Date(details.time).toISOString() : undefined,
    };
  });
}

// GET /api/community - Get community feed data
// ?type=feed - Recent comments across all earthquakes
// ?type=trending - Earthquakes with most discussion
// ?type=stats - Community statistics
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'feed';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  
  try {
    if (type === 'feed') {
      const dbStart = Date.now();
      const rawComments = await getRecentComments(limit);
      
      logExternalCall('mongodb', 'getRecentComments', true, Date.now() - dbStart, {
        limit,
        commentCount: rawComments.length,
      });
      
      // Enrich comments with earthquake data
      const comments = await enrichCommentsWithEarthquakeData(rawComments);
      
      logger.info('Community feed request', {
        path: '/api/community',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        type: 'feed',
        commentCount: comments.length,
      });
      
      return NextResponse.json({ comments });
    }
    
    if (type === 'trending') {
      const hoursBack = parseInt(searchParams.get('hours') || '72', 10);
      const dbStart = Date.now();
      const trending = await getTrendingEarthquakes(limit, hoursBack);
      
      logExternalCall('mongodb', 'getTrendingEarthquakes', true, Date.now() - dbStart, {
        limit,
        hoursBack,
        trendingCount: trending.length,
      });
      
      logger.info('Trending earthquakes request', {
        path: '/api/community',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        type: 'trending',
        trendingCount: trending.length,
      });
      
      return NextResponse.json({ trending });
    }
    
    if (type === 'stats') {
      const dbStart = Date.now();
      const stats = await getCommunityStats();
      
      logExternalCall('mongodb', 'getCommunityStats', true, Date.now() - dbStart, stats);
      
      logger.info('Community stats request', {
        path: '/api/community',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        type: 'stats',
        ...stats,
      });
      
      return NextResponse.json({ stats });
    }
    
    // All data at once (for initial load)
    if (type === 'all') {
      const dbStart = Date.now();
      const [rawComments, trending, stats] = await Promise.all([
        getRecentComments(30),
        getTrendingEarthquakes(10, 72),
        getCommunityStats(),
      ]);
      
      logExternalCall('mongodb', 'getCommunityAll', true, Date.now() - dbStart, {
        commentCount: rawComments.length,
        trendingCount: trending.length,
      });
      
      // Enrich comments with earthquake data
      const comments = await enrichCommentsWithEarthquakeData(rawComments);
      
      logger.info('Community all data request', {
        path: '/api/community',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        type: 'all',
        commentCount: comments.length,
        trendingCount: trending.length,
      });
      
      return NextResponse.json({ comments, trending, stats });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    
  } catch (error) {
    logger.error('Community API error', {
      path: '/api/community',
      method: 'GET',
      statusCode: 500,
      duration: Date.now() - startTime,
      type,
      error,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

