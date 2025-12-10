import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByEarthquakeId, createComment, getCommentCountsForEarthquakes, getDatabase } from '@/lib/mongodb';
import { getPusherServer, getEarthquakeChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { logger, logExternalCall } from '@/lib/logger';

// Check MongoDB connection status
async function checkMongoStatus(): Promise<boolean> {
  try {
    const db = await getDatabase();
    return db !== null;
  } catch {
    return false;
  }
}

// Check Pusher connection status
function checkPusherStatus(): boolean {
  return getPusherServer() !== null;
}

// GET /api/comments?earthquakeId=xxx or GET /api/comments?earthquakeIds=xxx,yyy,zzz (for counts)
// GET /api/comments?status=true to check service status
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const earthquakeId = searchParams.get('earthquakeId');
  const earthquakeIds = searchParams.get('earthquakeIds');
  const checkStatus = searchParams.get('status');
  
  // Status check endpoint
  if (checkStatus === 'true') {
    const mongoConnected = await checkMongoStatus();
    const pusherConnected = checkPusherStatus();
    
    logger.info('Service health check', {
      path: '/api/comments',
      method: 'GET',
      statusCode: 200,
      duration: Date.now() - startTime,
      mongodbConnected: mongoConnected,
      pusherConnected: pusherConnected,
    });
    
    return NextResponse.json({
      status: 'ok',
      services: {
        mongodb: {
          connected: mongoConnected,
          message: mongoConnected ? 'Connected to MongoDB' : 'MongoDB not configured (add MONGODB_URI to .env)',
        },
        pusher: {
          connected: pusherConnected,
          message: pusherConnected ? 'Pusher configured for real-time updates' : 'Pusher not configured (add PUSHER_* vars to .env)',
        },
      },
    });
  }
  
  // Get comment counts for multiple earthquakes
  if (earthquakeIds) {
    const ids = earthquakeIds.split(',').filter(Boolean);
    const dbStart = Date.now();
    const counts = await getCommentCountsForEarthquakes(ids);
    
    logExternalCall('mongodb', 'getCommentCounts', true, Date.now() - dbStart, {
      earthquakeCount: ids.length,
    });
    
    return NextResponse.json({ counts });
  }
  
  // Get comments for a single earthquake
  if (!earthquakeId) {
    logger.warn('Comments request missing earthquakeId', {
      path: '/api/comments',
      method: 'GET',
      statusCode: 400,
      duration: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'earthquakeId is required' }, { status: 400 });
  }
  
  const dbStart = Date.now();
  const comments = await getCommentsByEarthquakeId(earthquakeId);
  
  logExternalCall('mongodb', 'getComments', true, Date.now() - dbStart, {
    earthquakeId,
    commentCount: comments.length,
  });
  
  return NextResponse.json({ comments });
}

// POST /api/comments
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    const { earthquakeId, parentId, author, content, location, feltIt } = body;
    
    if (!earthquakeId || !author || !content) {
      logger.warn('Comment creation missing required fields', {
        path: '/api/comments',
        method: 'POST',
        statusCode: 400,
        duration: Date.now() - startTime,
        hasEarthquakeId: !!earthquakeId,
        hasAuthor: !!author,
        hasContent: !!content,
      });
      
      return NextResponse.json(
        { error: 'earthquakeId, author, and content are required' },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (author.length > 50) {
      logger.warn('Comment author name too long', {
        path: '/api/comments',
        method: 'POST',
        statusCode: 400,
        duration: Date.now() - startTime,
        authorLength: author.length,
      });
      return NextResponse.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
    }
    
    if (content.length > 1000) {
      logger.warn('Comment content too long', {
        path: '/api/comments',
        method: 'POST',
        statusCode: 400,
        duration: Date.now() - startTime,
        contentLength: content.length,
      });
      return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 });
    }
    
    // Create the comment
    const dbStart = Date.now();
    const comment = await createComment({
      earthquakeId,
      parentId: parentId || undefined,
      author: author.trim(),
      content: content.trim(),
      location: location?.trim(),
      feltIt: feltIt || false,
    });
    const dbDuration = Date.now() - dbStart;
    
    if (!comment) {
      logExternalCall('mongodb', 'createComment', false, dbDuration, {
        earthquakeId,
      });
      
      logger.error('Failed to create comment - database issue', {
        path: '/api/comments',
        method: 'POST',
        statusCode: 500,
        duration: Date.now() - startTime,
        earthquakeId,
        service: 'mongodb',
      });
      
      return NextResponse.json(
        { error: 'Failed to create comment. Database may not be configured.' },
        { status: 500 }
      );
    }
    
    logExternalCall('mongodb', 'createComment', true, dbDuration, {
      earthquakeId,
      commentId: comment._id,
    });
    
    // Broadcast to Pusher for real-time updates
    const pusher = getPusherServer();
    if (pusher) {
      const pusherStart = Date.now();
      try {
        await pusher.trigger(
          getEarthquakeChannel(earthquakeId),
          PUSHER_EVENTS.NEW_COMMENT,
          comment
        );
        logExternalCall('pusher', 'trigger', true, Date.now() - pusherStart, {
          earthquakeId,
          channel: getEarthquakeChannel(earthquakeId),
        });
      } catch (pusherError) {
        logExternalCall('pusher', 'trigger', false, Date.now() - pusherStart, {
          earthquakeId,
          error: pusherError,
        });
        // Don't fail the request if Pusher fails
      }
    }
    
    logger.info('Comment created successfully', {
      path: '/api/comments',
      method: 'POST',
      statusCode: 201,
      duration: Date.now() - startTime,
      earthquakeId,
      commentId: comment._id,
      feltIt: feltIt || false,
      hasLocation: !!location,
    });
    
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create comment', {
      path: '/api/comments',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

