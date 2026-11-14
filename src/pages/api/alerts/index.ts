import type { APIRoute } from 'astro';
import { BAY_AREA_LANDMARKS } from '@/lib/regions';
import {
  ALERT_MAGNITUDE_OPTIONS,
  ALERT_RADIUS_OPTIONS,
  DEFAULT_ALERT_PREFS,
  deletePushSubscription,
  sendTestPush,
  upsertPushSubscription,
} from '@/lib/push';

// The Worker POSTs to subscription endpoints, so only accept real push services.
const PUSH_SERVICE_HOST = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.apple\.com)$/;
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function parseEndpoint(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1024) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && PUSH_SERVICE_HOST.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

const isKey = (value: unknown, min: number, max: number): value is string =>
  typeof value === 'string' && value.length >= min && value.length <= max && BASE64URL.test(value);

// GET /api/alerts — public config for the "Monitor my area" flow.
export const GET: APIRoute = async ({ locals }) => {
  const { env } = locals.runtime;
  return Response.json(
    {
      vapidPublicKey: env.VAPID_PUBLIC_KEY ?? null,
      radiusOptions: ALERT_RADIUS_OPTIONS,
      magnitudeOptions: ALERT_MAGNITUDE_OPTIONS,
      defaults: DEFAULT_ALERT_PREFS,
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
};

// POST /api/alerts — create or update a browser push subscription.
export const POST: APIRoute = async ({ request, locals }) => {
  const { env, ctx } = locals.runtime;
  let body: {
    subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
    city?: unknown;
    radiusMiles?: unknown;
    minMagnitude?: unknown;
  };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const endpoint = parseEndpoint(body.subscription?.endpoint);
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;
  if (!endpoint || !isKey(p256dh, 80, 100) || !isKey(auth, 16, 32)) {
    return Response.json({ error: 'Unsupported or invalid push subscription.' }, { status: 400 });
  }

  const city = BAY_AREA_LANDMARKS.find((l) => l.type === 'city' && l.name === body.city);
  if (!city) return Response.json({ error: 'Please choose a Bay Area city.' }, { status: 400 });

  const radiusMiles = Number(body.radiusMiles);
  const minMagnitude = Number(body.minMagnitude);
  if (!(ALERT_RADIUS_OPTIONS as readonly number[]).includes(radiusMiles) || !(ALERT_MAGNITUDE_OPTIONS as readonly number[]).includes(minMagnitude)) {
    return Response.json({ error: 'Unsupported alert preferences.' }, { status: 400 });
  }

  const input = { endpoint, p256dh, auth, city: city.name, lat: city.lat, lon: city.lon, radiusMiles, minMagnitude };
  try {
    const { isNew } = await upsertPushSubscription(env.DB, input);
    if (isNew) {
      ctx.waitUntil(sendTestPush(env, input).catch((err) => console.error('[api/alerts] test push failed:', err)));
    }
    return Response.json({ ok: true, isNew, city: city.name, radiusMiles, minMagnitude }, { status: isNew ? 201 : 200 });
  } catch (err) {
    console.error('[api/alerts POST]', err);
    return Response.json({ error: 'Could not save your alert. Please try again.' }, { status: 500 });
  }
};

// DELETE /api/alerts — unsubscribe immediately.
export const DELETE: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  let body: { endpoint?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof body.endpoint !== 'string' || body.endpoint.length > 1024) {
    return Response.json({ error: 'endpoint is required' }, { status: 400 });
  }
  try {
    const removed = await deletePushSubscription(env.DB, body.endpoint);
    return Response.json({ ok: true, removed });
  } catch (err) {
    console.error('[api/alerts DELETE]', err);
    return Response.json({ error: 'Could not turn off alerts. Please try again.' }, { status: 500 });
  }
};
