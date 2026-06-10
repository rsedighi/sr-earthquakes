'use client';

import { useEffect } from 'react';

type DatadogRumModule = typeof import('@datadog/browser-rum');

let rumPromise: Promise<DatadogRumModule> | null = null;

function getRum(): Promise<DatadogRumModule> {
  if (!rumPromise) {
    rumPromise = import('@datadog/browser-rum');
  }
  return rumPromise;
}

export function DatadogRUM() {
  useEffect(() => {
    const applicationId = import.meta.env.PUBLIC_DD_APPLICATION_ID;
    const clientToken = import.meta.env.PUBLIC_DD_CLIENT_TOKEN;
    const site = import.meta.env.PUBLIC_DD_SITE || 'datadoghq.com';

    if (!applicationId || !clientToken) {
      if (import.meta.env.DEV) {
        console.log(
          '[Datadog RUM] Not initialized - missing PUBLIC_DD_APPLICATION_ID or PUBLIC_DD_CLIENT_TOKEN'
        );
      }
      return;
    }

    getRum().then(({ datadogRum }) => {
      if (datadogRum.getInitConfiguration()) return;

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
        enableExperimentalFeatures: ['feature_flags'],
        allowedTracingUrls: [
          { match: /https:\/\/.*\.baytremor\.com/, propagatorTypes: ['tracecontext', 'datadog'] },
          { match: window.location.origin, propagatorTypes: ['tracecontext', 'datadog'] },
        ],
      });

      datadogRum.setGlobalContextProperty('app_name', 'baytremor.com');
      datadogRum.setGlobalContextProperty('region', 'bay_area');
    });
  }, []);

  return null;
}

export function trackAction(name: string, context?: Record<string, unknown>) {
  getRum().then(({ datadogRum }) => datadogRum.addAction(name, context));
}

export function trackError(error: Error, context?: Record<string, unknown>) {
  getRum().then(({ datadogRum }) => datadogRum.addError(error, context));
}

export function setUser(user: { id?: string; name?: string; email?: string }) {
  getRum().then(({ datadogRum }) => datadogRum.setUser(user));
}

export function trackView(name: string) {
  getRum().then(({ datadogRum }) => datadogRum.startView({ name }));
}

export function trackFeatureFlag(flagKey: string, value: boolean | string) {
  getRum().then(({ datadogRum }) => datadogRum.addFeatureFlagEvaluation(flagKey, value));
}

export function trackFeatureFlags(flags: Record<string, boolean | string>) {
  getRum().then(({ datadogRum }) => {
    Object.entries(flags).forEach(([key, value]) => {
      datadogRum.addFeatureFlagEvaluation(key, value);
    });
  });
}

export default DatadogRUM;
