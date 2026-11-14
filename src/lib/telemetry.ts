import { sanitizeProps, type TelemetryEvent } from '@/lib/telemetry-shared';

// Transport lives in the inline script in BaseLayout.astro (window.btTrack) so
// asset-failure telemetry still works when bundled chunks fail to load.
declare global {
  interface Window {
    btTrack?: (name: TelemetryEvent, props?: Record<string, unknown>, value?: number) => void;
  }
}

export function trackAction(name: TelemetryEvent, context?: Record<string, unknown>, value?: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.btTrack?.(name, sanitizeProps(context), value);
  } catch {
    // telemetry must never break the UI
  }
}

export function trackError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  trackAction('js_error', { ...context, message: message.slice(0, 160), kind: 'handled' });
}
