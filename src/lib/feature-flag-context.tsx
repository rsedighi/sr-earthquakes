'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { datadogRum } from '@datadog/browser-rum';

/**
 * Client-side Feature Flag Context and Hooks
 * 
 * Provides React components and hooks for consuming feature flags in the browser.
 * Works with the server-side feature flag API to evaluate flags.
 */

interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

interface FeatureFlagContextType {
  flags: Record<string, FeatureFlagResult>;
  isLoading: boolean;
  isEnabled: (flagKey: string) => boolean;
  getVariant: (flagKey: string) => string | undefined;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: ReactNode;
  /** User ID for consistent flag evaluation */
  userId?: string;
  /** Session ID for anonymous users */
  sessionId?: string;
  /** Custom attributes for targeting */
  customAttributes?: Record<string, string | number | boolean>;
  /** Flag keys to fetch (defaults to all) */
  flagKeys?: string[];
  /** Polling interval in ms (0 to disable) */
  pollingInterval?: number;
}

/**
 * Generate a session ID for anonymous users
 */
function generateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = sessionStorage.getItem('ff_session_id');
  if (stored) return stored;
  
  const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('ff_session_id', newId);
  return newId;
}

/**
 * Get device type from user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Track feature flag evaluation in Datadog RUM
 */
function trackFeatureFlagEvaluation(
  flagKey: string,
  result: FeatureFlagResult
): void {
  try {
    // Check if RUM is initialized
    if (!datadogRum.getInitConfiguration()) {
      return;
    }
    
    // Add feature flag evaluation to RUM context
    datadogRum.addFeatureFlagEvaluation(flagKey, result.enabled);
    
    // Also track as custom action for detailed analytics
    datadogRum.addAction('feature_flag_evaluated', {
      flag_key: flagKey,
      enabled: result.enabled,
      variant: result.variant,
      reason: result.reason,
    });
  } catch {
    // Silently fail if RUM is not available
  }
}

export function FeatureFlagProvider({
  children,
  userId,
  sessionId: providedSessionId,
  customAttributes = {},
  flagKeys,
  pollingInterval = 0,
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, FeatureFlagResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchFlags = useCallback(async () => {
    try {
      const sessionId = providedSessionId || generateSessionId();
      const deviceType = getDeviceType();
      
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (sessionId) params.set('sessionId', sessionId);
      params.set('deviceType', deviceType);
      
      // Add custom attributes
      Object.entries(customAttributes).forEach(([key, value]) => {
        params.set(`custom_${key}`, String(value));
      });
      
      // Add specific flag keys if provided
      if (flagKeys && flagKeys.length > 0) {
        params.set('flags', flagKeys.join(','));
      }
      
      const response = await fetch(`/api/feature-flags?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.status}`);
      }
      
      const data = await response.json() as { flags: Record<string, FeatureFlagResult> };
      
      // Track evaluations in Datadog RUM
      Object.entries(data.flags).forEach(
        ([key, result]) => {
          trackFeatureFlagEvaluation(key, result);
        }
      );
      
      setFlags(data.flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to fetch flags:', error);
      // Keep existing flags on error
    } finally {
      setIsLoading(false);
    }
  }, [userId, providedSessionId, customAttributes, flagKeys]);
  
  // Initial fetch
  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);
  
  // Polling
  useEffect(() => {
    if (pollingInterval <= 0) return;
    
    const interval = setInterval(fetchFlags, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchFlags, pollingInterval]);
  
  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      const flag = flags[flagKey];
      return flag?.enabled ?? false;
    },
    [flags]
  );
  
  const getVariant = useCallback(
    (flagKey: string): string | undefined => {
      const flag = flags[flagKey];
      return flag?.variant;
    },
    [flags]
  );
  
  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isLoading,
        isEnabled,
        getVariant,
        refetch: fetchFlags,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access the feature flag context
 */
export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  
  return context;
}

/**
 * Hook to check if a specific feature flag is enabled
 */
export function useFeatureFlag(flagKey: string): {
  isEnabled: boolean;
  isLoading: boolean;
  variant?: string;
} {
  const { flags, isLoading, isEnabled, getVariant } = useFeatureFlags();
  
  return {
    isEnabled: isEnabled(flagKey),
    isLoading,
    variant: getVariant(flagKey),
  };
}

/**
 * Hook to conditionally render based on feature flag
 */
export function useFeatureGate(
  flagKey: string,
  options: {
    /** Show loading state while flags are being fetched */
    showLoading?: boolean;
    /** Default value before flags are loaded */
    defaultValue?: boolean;
  } = {}
): boolean {
  const { flags, isLoading, isEnabled } = useFeatureFlags();
  const { showLoading = false, defaultValue = false } = options;
  
  if (isLoading) {
    return showLoading ? false : defaultValue;
  }
  
  return isEnabled(flagKey);
}

/**
 * Component wrapper for feature-gated content
 */
interface FeatureGateProps {
  /** Feature flag key to check */
  flagKey: string;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Content to render when feature is disabled */
  fallback?: ReactNode;
  /** Content to render while loading */
  loading?: ReactNode;
}

export function FeatureGate({
  flagKey,
  children,
  fallback = null,
  loading = null,
}: FeatureGateProps) {
  const { isEnabled, isLoading } = useFeatureFlag(flagKey);
  
  if (isLoading && loading !== null) {
    return <>{loading}</>;
  }
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Track custom feature flag event in Datadog
 */
export function trackFeatureFlagEvent(
  eventName: string,
  flagKey: string,
  context?: Record<string, unknown>
): void {
  try {
    if (!datadogRum.getInitConfiguration()) {
      return;
    }
    
    datadogRum.addAction(eventName, {
      flag_key: flagKey,
      ...context,
    });
  } catch {
    // Silently fail if RUM is not available
  }
}

export default FeatureFlagProvider;
