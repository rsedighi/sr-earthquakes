import { NextRequest, NextResponse } from 'next/server';
import {
  createForumThread,
  getForumThreads,
  getTrendingThreads,
  searchForumThreads,
  getForumStats,
  ForumCategory,
} from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// GET /api/forum/threads
// Query params: category, earthquakeId, limit, skip, sortBy, search, trending
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  const category = searchParams.get('category') as ForumCategory | null;
  const earthquakeId = searchParams.get('earthquakeId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const sortBy = searchParams.get('sortBy') as 'latest' | 'popular' | 'active' | null;
  const search = searchParams.get('search');
  const trending = searchParams.get('trending') === 'true';
  const stats = searchParams.get('stats') === 'true';

  try {
    // Return forum stats
    if (stats) {
      const forumStats = await getForumStats();
      return NextResponse.json({ stats: forumStats });
    }

    // Return trending threads
    if (trending) {
      const threads = await getTrendingThreads(limit);
      logger.info('Trending threads request', {
        path: '/api/forum/threads',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        threadCount: threads.length,
      });
      return NextResponse.json({ threads });
    }

    // Search threads
    if (search) {
      const threads = await searchForumThreads(search, { category: category || undefined, limit });
      logger.info('Search threads request', {
        path: '/api/forum/threads',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        search,
        threadCount: threads.length,
      });
      return NextResponse.json({ threads });
    }

    // Get threads by category/filters
    const result = await getForumThreads({
      category: category || undefined,
      earthquakeId: earthquakeId || undefined,
      limit,
      skip,
      sortBy: sortBy || 'latest',
    });

    logger.info('Get threads request', {
      path: '/api/forum/threads',
      method: 'GET',
      statusCode: 200,
      duration: Date.now() - startTime,
      category,
      threadCount: result.threads.length,
      total: result.total,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Forum threads API error', {
      path: '/api/forum/threads',
      method: 'GET',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/forum/threads - Create a new thread
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { title, category, author, authorLocation, content, earthquakeId, earthquakeData, tags } = body;

    // Validation
    if (!title || !category || !author || !content) {
      return NextResponse.json(
        { error: 'title, category, author, and content are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: 'Content too long (max 10000 chars)' }, { status: 400 });
    }

    if (author.length > 50) {
      return NextResponse.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
    }

    const validCategories: ForumCategory[] = ['earthquake', 'general', 'neighborhood', 'preparedness', 'science'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const thread = await createForumThread({
      title: title.trim(),
      category,
      author: author.trim(),
      authorLocation: authorLocation?.trim(),
      content: content.trim(),
      earthquakeId,
      earthquakeData,
      tags,
    });

    if (!thread) {
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    logger.info('Thread created', {
      path: '/api/forum/threads',
      method: 'POST',
      statusCode: 201,
      duration: Date.now() - startTime,
      threadId: thread._id,
      category,
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    logger.error('Create thread error', {
      path: '/api/forum/threads',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

