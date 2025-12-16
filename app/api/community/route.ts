import { NextRequest, NextResponse } from 'next/server';
import { getRecentComments, getTrendingEarthquakes, getCommunityStats } from '@/lib/mongodb';
import { logger, logExternalCall } from '@/lib/logger';

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
      const comments = await getRecentComments(limit);
      
      logExternalCall('mongodb', 'getRecentComments', true, Date.now() - dbStart, {
        limit,
        commentCount: comments.length,
      });
      
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
      const [comments, trending, stats] = await Promise.all([
        getRecentComments(30),
        getTrendingEarthquakes(10, 72),
        getCommunityStats(),
      ]);
      
      logExternalCall('mongodb', 'getCommunityAll', true, Date.now() - dbStart, {
        commentCount: comments.length,
        trendingCount: trending.length,
      });
      
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

