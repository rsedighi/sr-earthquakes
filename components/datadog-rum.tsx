'use client';

import { useEffect } from 'react';

/**
 * Datadog RUM (Real User Monitoring) Component
 * 
 * This component initializes Datadog RUM for frontend monitoring including:
 * - Page views and navigation
 * - User interactions (clicks, form submissions)
 * - JavaScript errors and crashes
 * - Performance metrics (Core Web Vitals)
 * - API call tracking
 * 
 * To enable RUM, add these environment variables:
 * - NEXT_PUBLIC_DD_APPLICATION_ID: Your Datadog RUM Application ID
 * - NEXT_PUBLIC_DD_CLIENT_TOKEN: Your Datadog Client Token
 * - NEXT_PUBLIC_DD_SITE: Datadog site (e.g., 'datadoghq.com', 'datadoghq.eu')
 * 
 * Get these values from: Datadog > UX Monitoring > RUM Applications
 */

declare global {
  interface Window {
    DD_RUM?: {
      init: (config: DatadogRUMConfig) => void;
      setUser: (user: { id?: string; name?: string; email?: string }) => void;
      setGlobalContextProperty: (key: string, value: unknown) => void;
      addAction: (name: string, context?: Record<string, unknown>) => void;
      addError: (error: Error, context?: Record<string, unknown>) => void;
      startView: (name: string) => void;
    };
  }
}

interface DatadogRUMConfig {
  applicationId: string;
  clientToken: string;
  site: string;
  service: string;
  env: string;
  version: string;
  sessionSampleRate: number;
  sessionReplaySampleRate: number;
  trackUserInteractions: boolean;
  trackResources: boolean;
  trackLongTasks: boolean;
  defaultPrivacyLevel: 'mask-user-input' | 'mask' | 'allow';
  allowedTracingUrls?: Array<string | RegExp | { match: string | RegExp; propagatorTypes: string[] }>;
}

export function DatadogRUM() {
  useEffect(() => {
    const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    const site = process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com';
    
    // Don't initialize if credentials are missing
    if (!applicationId || !clientToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[Datadog RUM] Not initialized - missing NEXT_PUBLIC_DD_APPLICATION_ID or NEXT_PUBLIC_DD_CLIENT_TOKEN'
        );
      }
      return;
    }
    
    // Load the Datadog RUM SDK
    const script = document.createElement('script');
    script.src = 'https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js';
    script.async = true;
    
    script.onload = () => {
      if (window.DD_RUM) {
        window.DD_RUM.init({
          applicationId,
          clientToken,
          site,
          service: 'baytremor',
          env: process.env.NODE_ENV || 'production',
          version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
          sessionSampleRate: 100, // Sample 100% of sessions
          sessionReplaySampleRate: 20, // Record 20% of sessions for replay
          trackUserInteractions: true,
          trackResources: true,
          trackLongTasks: true,
          defaultPrivacyLevel: 'mask-user-input',
          // Connect RUM with APM traces if you add APM later
          allowedTracingUrls: [
            /https:\/\/.*\.baytremor\.com/,
            /https:\/\/.*\.netlify\.app/,
            { match: window.location.origin, propagatorTypes: ['tracecontext', 'datadog'] },
          ],
        });
        
        // Set global context for all RUM events
        window.DD_RUM.setGlobalContextProperty('app_name', 'baytremor');
        window.DD_RUM.setGlobalContextProperty('region', 'bay_area');
        
        console.log('[Datadog RUM] Initialized successfully');
      }
    };
    
    script.onerror = () => {
      console.error('[Datadog RUM] Failed to load SDK');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if component unmounts (though this shouldn't happen in layout)
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  return null;
}

// Helper functions to use throughout your app

/**
 * Track a custom action (e.g., user clicked on earthquake, filtered data)
 */
export function trackAction(name: string, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.DD_RUM) {
    window.DD_RUM.addAction(name, context);
  }
}

/**
 * Track a custom error
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.DD_RUM) {
    window.DD_RUM.addError(error, context);
  }
}

/**
 * Set user information (if you add auth later)
 */
export function setUser(user: { id?: string; name?: string; email?: string }) {
  if (typeof window !== 'undefined' && window.DD_RUM) {
    window.DD_RUM.setUser(user);
  }
}

/**
 * Track a custom view (for SPA navigation not caught automatically)
 */
export function trackView(name: string) {
  if (typeof window !== 'undefined' && window.DD_RUM) {
    window.DD_RUM.startView(name);
  }
}

export default DatadogRUM;

