import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByEarthquakeId, createComment, getCommentCountsForEarthquakes, getDatabase } from '@/lib/mongodb';
import { getPusherServer, getEarthquakeChannel, PUSHER_EVENTS } from '@/lib/pusher';

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
  const searchParams = request.nextUrl.searchParams;
  const earthquakeId = searchParams.get('earthquakeId');
  const earthquakeIds = searchParams.get('earthquakeIds');
  const checkStatus = searchParams.get('status');
  
  // Status check endpoint
  if (checkStatus === 'true') {
    const mongoConnected = await checkMongoStatus();
    const pusherConnected = checkPusherStatus();
    
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
    const counts = await getCommentCountsForEarthquakes(ids);
    return NextResponse.json({ counts });
  }
  
  // Get comments for a single earthquake
  if (!earthquakeId) {
    return NextResponse.json({ error: 'earthquakeId is required' }, { status: 400 });
  }
  
  const comments = await getCommentsByEarthquakeId(earthquakeId);
  return NextResponse.json({ comments });
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { earthquakeId, parentId, author, content, location, feltIt } = body;
    
    if (!earthquakeId || !author || !content) {
      return NextResponse.json(
        { error: 'earthquakeId, author, and content are required' },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (author.length > 50) {
      return NextResponse.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
    }
    
    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 });
    }
    
    // Create the comment
    const comment = await createComment({
      earthquakeId,
      parentId: parentId || undefined,
      author: author.trim(),
      content: content.trim(),
      location: location?.trim(),
      feltIt: feltIt || false,
    });
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Failed to create comment. Database may not be configured.' },
        { status: 500 }
      );
    }
    
    // Broadcast to Pusher for real-time updates
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(
        getEarthquakeChannel(earthquakeId),
        PUSHER_EVENTS.NEW_COMMENT,
        comment
      );
    }
    
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

