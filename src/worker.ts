// Custom Cloudflare worker entrypoint.
// Wraps @astrojs/cloudflare's default handler to:
//   • Export Durable Object classes (required by wrangler deploy)
//   • Export `scheduled` cron handler and `queue` consumer on the default object
import { createExports as _createExports } from '@astrojs/cloudflare/entrypoints/server.js';
import { EarthquakeRoom } from './durable-objects/EarthquakeRoom';
import { CommentRoom } from './durable-objects/CommentRoom';
import { handleScheduled } from './lib/cron';
import { sendAPNs, distanceMiles } from './lib/apns';
import { getDevicesForNotification, unregisterDevice } from './lib/d1';
import type { NotificationPayload } from './lib/apns';

export { EarthquakeRoom, CommentRoom };

// ── Scheduled cron handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduled(_event: unknown, env: any, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(handleScheduled(env));
}

// ── Queue consumer (APNs dispatch) ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queue(batch: { messages: Array<{ body: unknown; ack(): void; retry(): void }> }, env: any): Promise<void> {
  if (!env.DB) return;

  for (const msg of batch.messages) {
    const data = msg.body as NotificationPayload;
    try {
      const devices = await getDevicesForNotification(env.DB, data.magnitude);
      const sends = devices
        .filter((d) => {
          if (d.lat !== null && d.lon !== null) {
            const dist = distanceMiles(d.lat, d.lon, data.latitude, data.longitude);
            return dist <= d.radiusMiles;
          }
          return true;
        })
        .map(async (d) => {
          const distance =
            d.lat !== null && d.lon !== null
              ? distanceMiles(d.lat, d.lon, data.latitude, data.longitude)
              : undefined;
          const result = await sendAPNs(
            d.token,
            { ...data, distance, cityName: d.city ?? undefined },
            env,
          );
          if (result.invalidToken) {
            await unregisterDevice(env.DB, d.token).catch(() => {});
          }
        });
      await Promise.allSettled(sends);
      msg.ack();
    } catch (err) {
      console.error('[queue] notification dispatch error:', err);
      msg.retry();
    }
  }
}

// ── createExports ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createExports(manifest: any) {
  const base = _createExports(manifest);
  return {
    ...base,
    default: {
      ...base.default,
      scheduled,
      queue,
    },
    EarthquakeRoom,
    CommentRoom,
  };
}
