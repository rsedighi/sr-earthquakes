import type { APIRoute } from 'astro';
import {
  classifyTraffic,
  deviceClass,
  isKnownEvent,
  referrerSource,
  routeFamily,
  sanitizeProps,
} from '@/lib/telemetry-shared';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_EVENTS = 25;

interface EventBatch {
  v?: unknown;
  sid?: unknown;
  vid?: unknown;
  path?: unknown;
  landing?: unknown;
  ref?: unknown;
  wd?: unknown;
  internal?: unknown;
  events?: unknown;
}

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

// POST /api/events — first-party product + operational telemetry (sendBeacon target).
// Body is text/plain JSON so sendBeacon avoids a CORS preflight.
export const POST: APIRoute = async ({ request, locals }) => {
  const ae = locals.runtime?.env?.ANALYTICS;
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let batch: EventBatch;
  try { batch = JSON.parse(text) as EventBatch; } catch { return new Response(null, { status: 400 }); }
  if (!Array.isArray(batch.events)) return new Response(null, { status: 400 });

  const userAgent = request.headers.get('user-agent');
  const cf = locals.runtime?.cf as { verifiedBotCategory?: string; country?: string } | undefined;
  const traffic = classifyTraffic({
    userAgent,
    verifiedBotCategory: cf?.verifiedBotCategory,
    webdriver: batch.wd === true,
    internal: batch.internal === true,
  });
  const device = deviceClass(userAgent);
  const route = routeFamily(str(batch.path, 200) || '/');
  const landing = routeFamily(str(batch.landing, 200) || '/');
  const source = referrerSource(str(batch.ref, 500));
  const version = str(batch.v, 64) || 'unknown';
  const sessionId = str(batch.sid, 40);
  const visitorId = str(batch.vid, 40);
  const country = cf?.country ?? 'XX';

  if (ae) {
    for (const raw of batch.events.slice(0, MAX_EVENTS)) {
      const event = raw as { n?: unknown; p?: unknown; val?: unknown };
      if (!isKnownEvent(event.n)) continue;
      const value = typeof event.val === 'number' && Number.isFinite(event.val) ? event.val : 0;
      const props = sanitizeProps(event.p);
      // Low-cardinality dimension that SQL can filter on directly (e.g. LCP/INP/CLS).
      const label = typeof props.metric === 'string' ? props.metric : '';
      try {
        ae.writeDataPoint({
          indexes: [event.n],
          blobs: [
            event.n,
            traffic,
            route,
            landing,
            device,
            version,
            country,
            source,
            sessionId,
            visitorId,
            JSON.stringify(props).slice(0, 1024),
            label,
          ],
          doubles: [value, 1],
        });
      } catch {
        // analytics must never break a request
      }
    }
  }

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};
