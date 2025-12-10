'use client';

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';

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
 * Required environment variables in Netlify:
 * - NEXT_PUBLIC_DD_APPLICATION_ID: Your Datadog RUM Application ID
 * - NEXT_PUBLIC_DD_CLIENT_TOKEN: Your Datadog Client Token
 * - NEXT_PUBLIC_DD_SITE: Datadog site (default: 'datadoghq.com')
 * 
 * Get these values from: Datadog > UX Monitoring > RUM Applications
 */

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

    // Don't re-initialize if already initialized
    if (datadogRum.getInitConfiguration()) {
      return;
    }

    datadogRum.init({
      applicationId,
      clientToken,
      site,
      service: 'baytremor.com',
      env: 'prod',
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
      allowedTracingUrls: [
        { match: /https:\/\/.*\.baytremor\.com/, propagatorTypes: ['tracecontext', 'datadog'] },
        { match: /https:\/\/.*\.netlify\.app/, propagatorTypes: ['tracecontext', 'datadog'] },
        { match: window.location.origin, propagatorTypes: ['tracecontext', 'datadog'] },
      ],
    });

    // Set global context for all RUM events
    datadogRum.setGlobalContextProperty('app_name', 'baytremor.com');
    datadogRum.setGlobalContextProperty('region', 'bay_area');

    console.log('[Datadog RUM] Initialized successfully');
  }, []);

  return null;
}

// Helper functions to use throughout your app

/**
 * Track a custom action (e.g., user clicked on earthquake, filtered data)
 */
export function trackAction(name: string, context?: Record<string, unknown>) {
  datadogRum.addAction(name, context);
}

/**
 * Track a custom error
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  datadogRum.addError(error, context);
}

/**
 * Set user information (if you add auth later)
 */
export function setUser(user: { id?: string; name?: string; email?: string }) {
  datadogRum.setUser(user);
}

/**
 * Track a custom view (for SPA navigation not caught automatically)
 */
export function trackView(name: string) {
  datadogRum.startView({ name });
}

export default DatadogRUM;
