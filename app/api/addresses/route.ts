import { NextRequest, NextResponse } from 'next/server';
import { saveUserAddress, getAddressesByVisitor, getAddressStats } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Hash IP address for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex').slice(0, 16);
}

// POST /api/addresses - Save a user address
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { visitorId, address, lat, lon, city } = body;
    
    if (!visitorId || !address || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId, address, lat, lon' },
        { status: 400 }
      );
    }
    
    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIP(ip);
    
    const savedAddress = await saveUserAddress({
      visitorId,
      address,
      lat,
      lon,
      city,
      userAgent,
      ipHash,
    });
    
    if (!savedAddress) {
      logger.error('Failed to save address - database unavailable', {
        path: '/api/addresses',
        method: 'POST',
        statusCode: 503,
        duration: Date.now() - startTime,
      });
      
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }
    
    logger.info('Address saved', {
      path: '/api/addresses',
      method: 'POST',
      statusCode: 200,
      duration: Date.now() - startTime,
      visitorId,
      city,
    });
    
    return NextResponse.json({ 
      success: true, 
      address: savedAddress,
    });
    
  } catch (error) {
    logger.error('Address save error', {
      path: '/api/addresses',
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

// GET /api/addresses - Get addresses for a visitor or stats
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const visitorId = searchParams.get('visitorId');
  const type = searchParams.get('type');
  
  try {
    // Get stats (for admin/analytics)
    if (type === 'stats') {
      const stats = await getAddressStats();
      
      logger.info('Address stats requested', {
        path: '/api/addresses',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        type: 'stats',
      });
      
      return NextResponse.json({ stats });
    }
    
    // Get addresses for a specific visitor
    if (visitorId) {
      const addresses = await getAddressesByVisitor(visitorId);
      
      logger.info('Visitor addresses requested', {
        path: '/api/addresses',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
        visitorId,
        addressCount: addresses.length,
      });
      
      return NextResponse.json({ addresses });
    }
    
    return NextResponse.json(
      { error: 'Missing visitorId parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    logger.error('Address fetch error', {
      path: '/api/addresses',
      method: 'GET',
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

