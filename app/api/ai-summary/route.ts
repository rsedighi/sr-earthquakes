import { NextRequest, NextResponse } from 'next/server';
import { getCachedActivitySummary, type ActivitySummaryInput } from '@/lib/openai';

// POST /api/ai-summary
export async function POST(request: NextRequest) {
  try {
    const body: ActivitySummaryInput = await request.json();
    
    if (!body.regionId || body.currentCount === undefined) {
      return NextResponse.json(
        { error: 'regionId and currentCount are required' },
        { status: 400 }
      );
    }
    
    const summary = await getCachedActivitySummary(body);
    
    if (!summary) {
      return NextResponse.json(
        { error: 'AI summary unavailable. Check OPENAI_API_KEY configuration.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

