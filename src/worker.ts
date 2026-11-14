// Custom Cloudflare worker entrypoint.
// Wraps @astrojs/cloudflare's default handler to:
//   • Export Durable Object classes (required by wrangler deploy)
//   • Export `scheduled` cron handler and `queue` consumer on the default object
//   • Serve basemap vector tiles before Astro (no middleware, no page_view noise)
import { createExports as _createExports } from '@astrojs/cloudflare/entrypoints/server.js';
import { EarthquakeRoom } from './durable-objects/EarthquakeRoom';
import { CommentRoom } from './durable-objects/CommentRoom';
import { handleScheduled } from './lib/cron';
import { BASEMAP_TILE_PATH, handleBasemapTile } from './lib/basemap';
import { runMonitors } from './lib/monitor';
import { dispatchWebPushAlerts } from './lib/push';
import { sendAPNs, distanceMiles } from './lib/apns';
import { getDevicesForNotification, unregisterDevice } from './lib/d1';
import type { NotificationPayload } from './lib/apns';

export { EarthquakeRoom, CommentRoom };

// ── Scheduled cron handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduled(_event: unknown, env: any, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(handleScheduled(env));
  ctx.waitUntil(runMonitors(env).catch((err) => console.error('[monitor] run failed:', err)));
}

// ── Queue consumer (APNs + browser push dispatch) ─────────────────────────────

const APNS_MIN_MAGNITUDE = 3.0;
const MAX_PUSH_ATTEMPTS = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queue(batch: { messages: Array<{ body: unknown; attempts: number; ack(): void; retry(): void }> }, env: any): Promise<void> {
  if (!env.DB) return;

  for (const msg of batch.messages) {
    const data = msg.body as NotificationPayload;
    try {
      // Web push is de-duplicated per subscription in D1, so retries are safe.
      const push = await dispatchWebPushAlerts(env, data);

      // APNs has no delivery dedupe: only send on the first attempt.
      if (msg.attempts > 1 || data.magnitude < APNS_MIN_MAGNITUDE) {
        if (push.failed > 0 && msg.attempts < MAX_PUSH_ATTEMPTS) msg.retry();
        else msg.ack();
        continue;
      }

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
      if (push.failed > 0 && msg.attempts < MAX_PUSH_ATTEMPTS) msg.retry();
      else msg.ack();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch(request: Request, env: any, ctx: ExecutionContext) {
        if (new URL(request.url).pathname.startsWith(BASEMAP_TILE_PATH)) {
          return handleBasemapTile(request, env, ctx);
        }
        return base.default.fetch(request, env, ctx);
      },
      scheduled,
      queue,
    },
    EarthquakeRoom,
    CommentRoom,
  };
}
