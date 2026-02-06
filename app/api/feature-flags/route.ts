import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  evaluateFeatureFlags, 
  getAllFeatureFlags,
  type FeatureFlagContext 
} from '@/lib/datadog-feature-flags';

/**
 * Feature Flags API Endpoint
 * 
 * GET /api/feature-flags
 * 
 * Query Parameters:
 * - userId: User identifier for consistent evaluation
 * - sessionId: Session identifier for anonymous users
 * - deviceType: Device type (mobile, tablet, desktop)
 * - flags: Comma-separated list of flag keys to evaluate (optional, defaults to all)
 * - custom_*: Custom attributes for targeting (e.g., custom_beta_tester=true)
 * 
 * Response:
 * {
 *   "flags": {
 *     "flag_key": {
 *       "enabled": boolean,
 *       "variant": string | undefined,
 *       "reason": string
 *     }
 *   },
 *   "timestamp": number
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build context from query params
    const context: FeatureFlagContext = {
      userId: searchParams.get('userId') || undefined,
      sessionId: searchParams.get('sessionId') || undefined,
      deviceType: (searchParams.get('deviceType') as 'mobile' | 'tablet' | 'desktop') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      custom: {},
    };
    
    // Extract custom attributes
    searchParams.forEach((value, key) => {
      if (key.startsWith('custom_')) {
        const customKey = key.replace('custom_', '');
        // Parse boolean and number values
        if (value === 'true') {
          context.custom![customKey] = true;
        } else if (value === 'false') {
          context.custom![customKey] = false;
        } else if (!isNaN(Number(value))) {
          context.custom![customKey] = Number(value);
        } else {
          context.custom![customKey] = value;
        }
      }
    });
    
    // Get flag keys to evaluate
    const flagKeysParam = searchParams.get('flags');
    let flags;
    
    if (flagKeysParam) {
      const flagKeys = flagKeysParam.split(',').map(k => k.trim()).filter(Boolean);
      flags = await evaluateFeatureFlags(flagKeys, context);
    } else {
      flags = await getAllFeatureFlags(context);
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Feature flags evaluated', {
      path: '/api/feature-flags',
      method: 'GET',
      statusCode: 200,
      duration,
      flagCount: Object.keys(flags).length,
      hasUser: !!context.userId,
      hasSession: !!context.sessionId,
    });
    
    return NextResponse.json(
      {
        flags,
        timestamp: Date.now(),
      },
      {
        headers: {
          // Short cache for feature flags - they should be relatively fresh
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to evaluate feature flags', {
      path: '/api/feature-flags',
      method: 'GET',
      statusCode: 500,
      duration,
      error,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to evaluate feature flags',
        flags: {},
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
