/**
 * Browser push alerts ("Monitor my area").
 *
 * Subscriptions are city-level (lat/lon = city centroid). Delivery is
 * de-duplicated per (subscription, earthquake) in push_deliveries, so queue
 * retries never notify a user twice for the same event.
 */
import { buildPushPayload } from '@block65/webcrypto-web-push';
import { distanceMiles, type NotificationPayload } from './apns';

export const ALERT_RADIUS_OPTIONS = [10, 25, 50] as const;
export const ALERT_MAGNITUDE_OPTIONS = [2.5, 3.0, 3.5, 4.0] as const;
export const DEFAULT_ALERT_PREFS = { radiusMiles: 25, minMagnitude: 3.0 } as const;
// The cron enqueues everything at or above the lowest selectable threshold.
export const MIN_ENQUEUE_MAGNITUDE = ALERT_MAGNITUDE_OPTIONS[0];

const VAPID_SUBJECT = 'mailto:alerts@baytremor.com';
const SEND_CONCURRENCY = 25;
const MAX_CONSECUTIVE_FAILURES = 10;

export interface PushEnv {
  DB: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  city: string;
  lat: number;
  lon: number;
  radiusMiles: number;
  minMagnitude: number;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  city: string;
  lat: number;
  lon: number;
  radius_miles: number;
  min_magnitude: number;
  failure_count: number;
}

interface AlertPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export async function subscriptionId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function upsertPushSubscription(db: D1Database, input: PushSubscriptionInput): Promise<{ id: string; isNew: boolean }> {
  const id = await subscriptionId(input.endpoint);
  const now = Date.now();
  const row = await db.prepare(
    `INSERT INTO push_subscriptions
       (id, endpoint, p256dh, auth, city, lat, lon, radius_miles, min_magnitude, created_at, updated_at, failure_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       p256dh = excluded.p256dh, auth = excluded.auth, city = excluded.city,
       lat = excluded.lat, lon = excluded.lon, radius_miles = excluded.radius_miles,
       min_magnitude = excluded.min_magnitude, updated_at = excluded.updated_at, failure_count = 0
     RETURNING created_at = updated_at AS is_new`,
  ).bind(
    id, input.endpoint, input.p256dh, input.auth, input.city, input.lat, input.lon,
    input.radiusMiles, input.minMagnitude, now, now,
  ).first<{ is_new: number }>();
  return { id, isNew: row?.is_new === 1 };
}

export async function deletePushSubscription(db: D1Database, endpoint: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(await subscriptionId(endpoint)).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function purgeOldDeliveries(db: D1Database, olderThanMs = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  await db.prepare('DELETE FROM push_deliveries WHERE created_at < ?').bind(Date.now() - olderThanMs).run();
}

function trackDelivery(ae: AnalyticsEngineDataset | undefined, args: { status: string; city: string; endpoint: string; magnitude: number; httpStatus: number }): void {
  if (!ae) return;
  let pushService = 'unknown';
  try { pushService = new URL(args.endpoint).hostname; } catch { /* keep unknown */ }
  try {
    ae.writeDataPoint({
      indexes: ['alert_delivery'],
      blobs: ['alert_delivery', args.status, args.city, pushService],
      doubles: [args.magnitude, args.httpStatus],
    });
  } catch {
    // analytics must never break delivery
  }
}

async function sendPush(env: PushEnv, sub: Pick<PushSubscriptionRow, 'endpoint' | 'p256dh' | 'auth'>, payload: AlertPayload, urgency: 'normal' | 'high'): Promise<number> {
  if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY) throw new Error('VAPID keys are not configured');
  const { d } = JSON.parse(env.VAPID_PRIVATE_JWK) as { d?: string };
  // aes128gcm (RFC 8291) is required by Apple's push service; legacy aesgcm is rejected.
  const request = await buildPushPayload(
    {
      data: { ...payload },
      options: { ttl: 6 * 60 * 60, urgency, topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'baytremor' },
    },
    { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    { subject: VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: d },
  );
  const res = await fetch(sub.endpoint, { method: 'POST', headers: request.headers, body: request.body });
  return res.status;
}

export async function sendTestPush(env: PushEnv, input: PushSubscriptionInput): Promise<number> {
  return sendPush(env, input, {
    title: 'BayTremor alerts are on',
    body: `We'll notify you about M${input.minMagnitude.toFixed(1)}+ earthquakes within ${input.radiusMiles} mi of ${input.city}. Not an official early warning.`,
    url: '/',
    tag: 'baytremor-test',
  }, 'normal');
}

function formatPacificTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

export async function dispatchWebPushAlerts(env: PushEnv, quake: NotificationPayload): Promise<{ sent: number; failed: number; removed: number }> {
  const stats = { sent: 0, failed: 0, removed: 0 };
  if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY || typeof quake.magnitude !== 'number') return stats;

  const { results } = await env.DB
    .prepare('SELECT id, endpoint, p256dh, auth, city, lat, lon, radius_miles, min_magnitude, failure_count FROM push_subscriptions WHERE min_magnitude <= ?')
    .bind(quake.magnitude)
    .all<PushSubscriptionRow>();

  const targets = results
    .map((sub) => ({ sub, distance: distanceMiles(sub.lat, sub.lon, quake.latitude, quake.longitude) }))
    .filter(({ sub, distance }) => distance <= sub.radius_miles);

  const deliver = async ({ sub, distance }: (typeof targets)[number]) => {
    const claimed = await env.DB
      .prepare('INSERT OR IGNORE INTO push_deliveries (subscription_id, earthquake_id, created_at) VALUES (?, ?, ?)')
      .bind(sub.id, quake.earthquakeId, Date.now())
      .run();
    if ((claimed.meta?.changes ?? 0) === 0) return;

    let status = 0;
    try {
      status = await sendPush(env, sub, {
        title: `M${quake.magnitude.toFixed(1)} earthquake · ${Math.max(1, Math.round(distance))} mi from ${sub.city}`,
        body: `${quake.place} · ${formatPacificTime(quake.time)}`,
        url: `/earthquake/${encodeURIComponent(quake.earthquakeId)}?utm_source=push`,
        tag: `quake-${quake.earthquakeId}`,
      }, quake.magnitude >= 4 ? 'high' : 'normal');
    } catch (err) {
      console.error('[push] send failed:', err);
    }

    if (status >= 200 && status < 300) {
      stats.sent++;
      await env.DB.prepare('UPDATE push_subscriptions SET last_notified_at = ?, failure_count = 0 WHERE id = ?').bind(Date.now(), sub.id).run();
      trackDelivery(env.ANALYTICS, { status: 'delivered', city: sub.city, endpoint: sub.endpoint, magnitude: quake.magnitude, httpStatus: status });
      return;
    }

    const expired = status === 404 || status === 410 || sub.failure_count + 1 >= MAX_CONSECUTIVE_FAILURES;
    if (expired) {
      stats.removed++;
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
    } else {
      stats.failed++;
      await env.DB.batch([
        env.DB.prepare('UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE id = ?').bind(sub.id),
        // Release the claim so a queue retry can attempt delivery again.
        env.DB.prepare('DELETE FROM push_deliveries WHERE subscription_id = ? AND earthquake_id = ?').bind(sub.id, quake.earthquakeId),
      ]);
    }
    trackDelivery(env.ANALYTICS, { status: expired ? 'expired' : 'failed', city: sub.city, endpoint: sub.endpoint, magnitude: quake.magnitude, httpStatus: status });
  };

  for (let i = 0; i < targets.length; i += SEND_CONCURRENCY) {
    await Promise.allSettled(targets.slice(i, i + SEND_CONCURRENCY).map(deliver));
  }
  if (stats.sent + stats.failed + stats.removed > 0) {
    console.log(`[push] ${quake.earthquakeId} M${quake.magnitude}: sent=${stats.sent} failed=${stats.failed} removed=${stats.removed}`);
  }
  return stats;
}
