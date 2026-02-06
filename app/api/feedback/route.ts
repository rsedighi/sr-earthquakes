import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getFeedbackStats, FeedbackType } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Valid feedback types
const VALID_FEEDBACK_TYPES: FeedbackType[] = ['feedback', 'improvement', 'bug', 'feature', 'advertising'];

// Hash IP address for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'default-salt')).digest('hex').slice(0, 16);
}

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { type, name, email, message, page } = body;

    // Validate required fields
    if (!type || !VALID_FEEDBACK_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIP(ip);

    const result = await createFeedback({
      type: type as FeedbackType,
      name: name?.trim() || 'Anonymous',
      email: email?.trim() || 'Not provided',
      message: message.trim(),
      page: page || '/',
      userAgent,
      ipHash,
    });

    if (!result) {
      logger.error('Failed to save feedback to database', {
        path: '/api/feedback',
        method: 'POST',
        statusCode: 503,
        duration: Date.now() - startTime,
        feedbackType: type,
      });

      return NextResponse.json(
        { error: 'Failed to save feedback. Please try again.' },
        { status: 503 }
      );
    }

    logger.info('Feedback submitted successfully', {
      path: '/api/feedback',
      method: 'POST',
      statusCode: 200,
      duration: Date.now() - startTime,
      feedbackType: type,
      feedbackId: result._id,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      id: result._id,
    });

  } catch (error) {
    logger.error('Feedback submission error', {
      path: '/api/feedback',
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

// GET /api/feedback - Get feedback stats (could be used for admin dashboard)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  try {
    if (type === 'stats') {
      const stats = await getFeedbackStats();

      logger.info('Feedback stats requested', {
        path: '/api/feedback',
        method: 'GET',
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({ stats });
    }

    // Default: just return basic info
    const stats = await getFeedbackStats();

    return NextResponse.json({
      total: stats.total,
    });

  } catch (error) {
    logger.error('Feedback fetch error', {
      path: '/api/feedback',
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
