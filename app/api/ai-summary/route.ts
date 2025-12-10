import { NextRequest, NextResponse } from 'next/server';
import { getCachedActivitySummary, type ActivitySummaryInput } from '@/lib/openai';
import { logger } from '@/lib/logger';

// POST /api/ai-summary
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: ActivitySummaryInput = await request.json();
    
    if (!body.regionId || body.currentCount === undefined) {
      logger.warn('AI summary request missing required fields', {
        path: '/api/ai-summary',
        method: 'POST',
        statusCode: 400,
        duration: Date.now() - startTime,
        hasRegionId: !!body.regionId,
        hasCurrentCount: body.currentCount !== undefined,
      });
      
      return NextResponse.json(
        { error: 'regionId and currentCount are required' },
        { status: 400 }
      );
    }
    
    const summary = await getCachedActivitySummary(body);
    
    if (!summary) {
      logger.warn('AI summary unavailable - OpenAI not configured', {
        path: '/api/ai-summary',
        method: 'POST',
        statusCode: 503,
        duration: Date.now() - startTime,
        region: body.regionId,
        service: 'openai',
      });
      
      return NextResponse.json(
        { error: 'AI summary unavailable. Check OPENAI_API_KEY configuration.' },
        { status: 503 }
      );
    }
    
    logger.info('AI summary generated successfully', {
      path: '/api/ai-summary',
      method: 'POST',
      statusCode: 200,
      duration: Date.now() - startTime,
      region: body.regionId,
      earthquakeCount: body.currentCount,
      multiplier: body.multiplier,
      isSwarm: body.isSwarm,
    });
    
    return NextResponse.json({ summary });
  } catch (error) {
    logger.error('Failed to generate AI summary', {
      path: '/api/ai-summary',
      method: 'POST',
      statusCode: 500,
      duration: Date.now() - startTime,
      error,
      service: 'openai',
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

