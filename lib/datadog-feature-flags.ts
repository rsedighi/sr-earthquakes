import 'server-only';
import { logger } from './logger';

/**
 * Datadog Feature Flags Server-Side Implementation
 * 
 * This module provides server-side feature flag evaluation using Datadog's Feature Flags API.
 * It supports both simple boolean flags and complex multi-variant flags.
 * 
 * Required environment variables:
 * - DD_API_KEY: Your Datadog API key
 * - DD_APP_KEY: Your Datadog Application key
 * - DD_SITE: Datadog site (default: 'datadoghq.com')
 * 
 * Get these values from: Datadog > Organization Settings > API Keys / Application Keys
 */

// Types for feature flags
export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  city?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  custom?: Record<string, string | number | boolean>;
}

export interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagDefinition {
  key: string;
  defaultValue: boolean;
  variants?: Record<string, unknown>;
  rolloutPercentage?: number;
  targetRules?: TargetRule[];
  enabled: boolean;
}

export interface TargetRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'regex';
  value: string | string[] | number;
  variant?: string;
}

// In-memory cache for feature flag definitions with TTL
interface CacheEntry {
  data: Map<string, FeatureFlagDefinition>;
  expiresAt: number;
}

let flagCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

// Default feature flags (fallback when Datadog is unavailable)
const DEFAULT_FLAGS: Map<string, FeatureFlagDefinition> = new Map([
  ['earthquake_alerts_v2', {
    key: 'earthquake_alerts_v2',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
  }],
  ['enhanced_map_layers', {
    key: 'enhanced_map_layers',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
  }],
  ['community_features', {
    key: 'community_features',
    defaultValue: true,
    enabled: true,
    rolloutPercentage: 100,
  }],
  ['dark_mode_v2', {
    key: 'dark_mode_v2',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
  }],
  ['realtime_websockets', {
    key: 'realtime_websockets',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
  }],
  ['ai_earthquake_insights', {
    key: 'ai_earthquake_insights',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
  }],
  ['beta_features', {
    key: 'beta_features',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 0,
    targetRules: [
      {
        attribute: 'custom.beta_tester',
        operator: 'equals',
        value: 'true',
      },
    ],
  }],
]);

/**
 * Hash function for consistent user bucketing
 * Uses a simple string hash for percentage-based rollouts
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get bucket percentage for a user/session
 */
function getBucketPercentage(flagKey: string, identifier: string): number {
  const hash = hashString(`${flagKey}:${identifier}`);
  return hash % 100;
}

/**
 * Evaluate a targeting rule against context
 */
function evaluateRule(rule: TargetRule, context: FeatureFlagContext): boolean {
  // Get the attribute value from context
  let value: unknown;
  
  if (rule.attribute.startsWith('custom.')) {
    const customKey = rule.attribute.replace('custom.', '');
    value = context.custom?.[customKey];
  } else {
    value = (context as Record<string, unknown>)[rule.attribute];
  }
  
  if (value === undefined || value === null) {
    return false;
  }
  
  switch (rule.operator) {
    case 'equals':
      return String(value) === String(rule.value);
    case 'contains':
      return String(value).includes(String(rule.value));
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(String(value));
    case 'gt':
      return Number(value) > Number(rule.value);
    case 'lt':
      return Number(value) < Number(rule.value);
    case 'gte':
      return Number(value) >= Number(rule.value);
    case 'lte':
      return Number(value) <= Number(rule.value);
    case 'regex':
      try {
        return new RegExp(String(rule.value)).test(String(value));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Fetch feature flag definitions from Datadog
 * Falls back to defaults if Datadog is unavailable
 */
async function fetchFlagDefinitions(): Promise<Map<string, FeatureFlagDefinition>> {
  const apiKey = process.env.DD_API_KEY;
  const appKey = process.env.DD_APP_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  
  // Return defaults if credentials are missing
  if (!apiKey || !appKey) {
    logger.warn('Datadog API credentials missing, using default feature flags', {
      service: 'feature-flags',
    });
    return DEFAULT_FLAGS;
  }
  
  // Check cache
  if (flagCache && flagCache.expiresAt > Date.now()) {
    return flagCache.data;
  }
  
  try {
    // Note: This is a placeholder for the actual Datadog Feature Flags API
    // In production, you would use the Datadog Feature Flags API endpoint
    // For now, we simulate by using environment-based configuration
    
    const envFlags = process.env.FEATURE_FLAGS;
    if (envFlags) {
      try {
        const parsedFlags = JSON.parse(envFlags) as Record<string, Partial<FeatureFlagDefinition>>;
        const flags = new Map<string, FeatureFlagDefinition>();
        
        for (const [key, value] of Object.entries(parsedFlags)) {
          flags.set(key, {
            key,
            defaultValue: value.defaultValue ?? false,
            enabled: value.enabled ?? true,
            rolloutPercentage: value.rolloutPercentage ?? 0,
            variants: value.variants,
            targetRules: value.targetRules,
          });
        }
        
        // Merge with defaults
        for (const [key, value] of DEFAULT_FLAGS) {
          if (!flags.has(key)) {
            flags.set(key, value);
          }
        }
        
        // Update cache
        flagCache = {
          data: flags,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        
        logger.info('Feature flags loaded from environment', {
          service: 'feature-flags',
          flagCount: flags.size,
        });
        
        return flags;
      } catch (parseError) {
        logger.error('Failed to parse FEATURE_FLAGS environment variable', {
          service: 'feature-flags',
          error: parseError,
        });
      }
    }
    
    // Return defaults and cache them
    flagCache = {
      data: DEFAULT_FLAGS,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    
    return DEFAULT_FLAGS;
  } catch (error) {
    logger.error('Failed to fetch feature flags from Datadog', {
      service: 'feature-flags',
      error,
    });
    return DEFAULT_FLAGS;
  }
}

/**
 * Evaluate a feature flag for a given context
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  context: FeatureFlagContext = {}
): Promise<FeatureFlagResult> {
  const startTime = Date.now();
  
  try {
    const flags = await fetchFlagDefinitions();
    const flag = flags.get(flagKey);
    
    // Flag doesn't exist
    if (!flag) {
      logger.warn('Feature flag not found', {
        service: 'feature-flags',
        flagKey,
        duration: Date.now() - startTime,
      });
      
      return {
        enabled: false,
        reason: 'flag_not_found',
      };
    }
    
    // Flag is disabled globally
    if (!flag.enabled) {
      return {
        enabled: false,
        reason: 'flag_disabled',
      };
    }
    
    // Check targeting rules first
    if (flag.targetRules && flag.targetRules.length > 0) {
      for (const rule of flag.targetRules) {
        if (evaluateRule(rule, context)) {
          return {
            enabled: true,
            variant: rule.variant,
            reason: 'targeting_rule_match',
            metadata: { rule: rule.attribute },
          };
        }
      }
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const identifier = context.userId || context.sessionId || 'anonymous';
      const bucket = getBucketPercentage(flagKey, identifier);
      
      if (bucket < flag.rolloutPercentage) {
        return {
          enabled: true,
          reason: 'rollout_percentage',
          metadata: { bucket, rolloutPercentage: flag.rolloutPercentage },
        };
      }
      
      return {
        enabled: false,
        reason: 'rollout_excluded',
        metadata: { bucket, rolloutPercentage: flag.rolloutPercentage },
      };
    }
    
    // Return default value
    return {
      enabled: flag.defaultValue,
      reason: 'default_value',
    };
  } catch (error) {
    logger.error('Error evaluating feature flag', {
      service: 'feature-flags',
      flagKey,
      error,
      duration: Date.now() - startTime,
    });
    
    return {
      enabled: false,
      reason: 'evaluation_error',
    };
  }
}

/**
 * Evaluate multiple feature flags at once
 */
export async function evaluateFeatureFlags(
  flagKeys: string[],
  context: FeatureFlagContext = {}
): Promise<Record<string, FeatureFlagResult>> {
  const results: Record<string, FeatureFlagResult> = {};
  
  await Promise.all(
    flagKeys.map(async (key) => {
      results[key] = await evaluateFeatureFlag(key, context);
    })
  );
  
  return results;
}

/**
 * Get all feature flags with their current state
 */
export async function getAllFeatureFlags(
  context: FeatureFlagContext = {}
): Promise<Record<string, FeatureFlagResult>> {
  const flags = await fetchFlagDefinitions();
  const results: Record<string, FeatureFlagResult> = {};
  
  await Promise.all(
    Array.from(flags.keys()).map(async (key) => {
      results[key] = await evaluateFeatureFlag(key, context);
    })
  );
  
  return results;
}

/**
 * Check if a feature flag is enabled (simple boolean check)
 */
export async function isFeatureEnabled(
  flagKey: string,
  context: FeatureFlagContext = {}
): Promise<boolean> {
  const result = await evaluateFeatureFlag(flagKey, context);
  return result.enabled;
}

/**
 * Clear the feature flag cache
 */
export function clearFeatureFlagCache(): void {
  flagCache = null;
  logger.info('Feature flag cache cleared', {
    service: 'feature-flags',
  });
}
