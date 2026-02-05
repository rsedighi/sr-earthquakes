import { NextRequest, NextResponse } from 'next/server';
import { addToIOSWaitlist, getIOSWaitlistStats } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash IP address for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex').slice(0, 16);
}

// POST /api/ios-waitlist - Add email to waitlist
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { email, source, referralCode } = body;
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIP(ip);
    
    const result = await addToIOSWaitlist({
      email: trimmedEmail,
      source: source || 'website',
      referralCode,
      userAgent,
      ipHash,
    });
    
    if (!result.success) {
      logger.error('Failed to add to iOS waitlist', {
        path: '/api/ios-waitlist',
        method: 'POST',
        statusCode: 503,
        duration: Date.now() - startTime,
        error: new Error(result.error),
      });
      
      return NextResponse.json(
        { error: result.error || 'Failed to join waitlist' },
        { status: 503 }
      );
    }
    
    logger.info('iOS waitlist signup', {
      path: '/api/ios-waitlist',
      method: 'POST',
      statusCode: 200,
      duration: Date.now() - startTime,
      isNew: result.isNew,
    });
    
    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      message: result.isNew 
        ? "You're on the list! We'll notify you when the app launches." 
        : "You're already on the waitlist. We'll notify you when the app launches!",
    });
    
  } catch (error) {
    logger.error('iOS waitlist error', {
      path: '/api/ios-waitlist',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
    });
    
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/ios-waitlist - Get waitlist stats (for admin/display)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  
  try {
    if (type === 'stats') {
      const stats = await getIOSWaitlistStats();
      
      logger.info('iOS waitlist stats requested', {
        path: '/api/ios-waitlist',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
      });
      
      return NextResponse.json({ stats });
    }
    
    // Default: just return total count (public info)
    const stats = await getIOSWaitlistStats();
    
    return NextResponse.json({ 
      totalSignups: stats.totalSignups,
    });
    
  } catch (error) {
    logger.error('iOS waitlist fetch error', {
      path: '/api/ios-waitlist',
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
