import { NextRequest, NextResponse } from 'next/server';
import { getForumThread, getForumPosts, getOrCreateEarthquakeThread } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// GET /api/forum/threads/[slug] - Get a thread with its posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const postsLimit = parseInt(searchParams.get('postsLimit') || '50', 10);
  const postsSkip = parseInt(searchParams.get('postsSkip') || '0', 10);
  
  // Special handling for earthquake threads - auto-create if needed
  const earthquakeId = searchParams.get('earthquakeId');
  const magnitude = searchParams.get('magnitude');
  const place = searchParams.get('place');
  const time = searchParams.get('time');

  try {
    let thread;

    // If earthquake data is provided, get or create the thread
    if (earthquakeId && magnitude && place && time) {
      thread = await getOrCreateEarthquakeThread({
        id: earthquakeId,
        magnitude: parseFloat(magnitude),
        place,
        time,
      });
    } else {
      // Regular thread lookup by slug or ID
      thread = await getForumThread(slug, true); // Increment view count
    }

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Get posts for this thread
    const postsResult = await getForumPosts(thread._id, {
      limit: postsLimit,
      skip: postsSkip,
    });

    logger.info('Get thread request', {
      path: `/api/forum/threads/${slug}`,
      method: 'GET',
      statusCode: 200,
      duration: Date.now() - startTime,
      threadId: thread._id,
      postCount: postsResult.posts.length,
    });

    return NextResponse.json({
      thread,
      posts: postsResult.posts,
      totalPosts: postsResult.total,
    });
  } catch (error) {
    logger.error('Get thread error', {
      path: `/api/forum/threads/${slug}`,
      method: 'GET',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


