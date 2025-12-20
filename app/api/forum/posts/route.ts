import { NextRequest, NextResponse } from 'next/server';
import { createForumPost, getForumPosts } from '@/lib/mongodb';
import { getPusherServer, PUSHER_EVENTS } from '@/lib/pusher';
import { logger } from '@/lib/logger';

// GET /api/forum/posts?threadId=xxx - Get posts for a thread
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const threadId = searchParams.get('threadId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);

  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
  }

  try {
    const result = await getForumPosts(threadId, { limit, skip });

    logger.info('Get posts request', {
      path: '/api/forum/posts',
      method: 'GET',
      statusCode: 200,
      duration: Date.now() - startTime,
      threadId,
      postCount: result.posts.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Get posts error', {
      path: '/api/forum/posts',
      method: 'GET',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/forum/posts - Create a new post
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { threadId, parentPostId, author, authorLocation, content, feltIt, intensity } = body;

    // Validation
    if (!threadId || !author || !content) {
      return NextResponse.json(
        { error: 'threadId, author, and content are required' },
        { status: 400 }
      );
    }

    if (author.length > 50) {
      return NextResponse.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
    }

    if (intensity && (intensity < 1 || intensity > 5)) {
      return NextResponse.json({ error: 'Intensity must be between 1 and 5' }, { status: 400 });
    }

    const post = await createForumPost({
      threadId,
      parentPostId,
      author: author.trim(),
      authorLocation: authorLocation?.trim(),
      content: content.trim(),
      feltIt,
      intensity,
    });

    if (!post) {
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Broadcast to Pusher for real-time updates
    const pusher = getPusherServer();
    if (pusher) {
      try {
        await pusher.trigger(
          `forum-thread-${threadId}`,
          PUSHER_EVENTS.NEW_COMMENT,
          post
        );
      } catch (pusherError) {
        console.error('Pusher error:', pusherError);
        // Don't fail the request if Pusher fails
      }
    }

    logger.info('Post created', {
      path: '/api/forum/posts',
      method: 'POST',
      statusCode: 201,
      duration: Date.now() - startTime,
      postId: post._id,
      threadId,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    logger.error('Create post error', {
      path: '/api/forum/posts',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

