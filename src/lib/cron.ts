/**
 * Scheduled cron handler — runs every minute via [triggers] in wrangler.toml.
 *
 * Steps:
 *   1. Fetch all three USGS GeoJSON feeds in parallel.
 *   2. Diff all_hour against the KV-cached version to find newly added quakes.
 *   3. Write every feed back to KV (refreshes TTL).
 *   4. If new quakes were found, POST to EarthquakeRoom DO → fans out to WebSocket clients.
 *   5. Enqueue M3.0+ quakes to NOTIFICATION_QUEUE for APNs dispatch.
 */
import { getEarthquakeFeed, setEarthquakeFeed } from './kv';
import type { USGSResponse, USGSFeature } from './types';

const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const FEEDS     = ['all_hour', 'all_day', 'all_week'] as const;
type FeedName   = typeof FEEDS[number];

interface CronEnv {
  EARTHQUAKE_KV:   KVNamespace;
  EARTHQUAKE_ROOM: DurableObjectNamespace;
  NOTIFICATION_QUEUE?: Queue;
}

async function fetchUSGS(feed: FeedName): Promise<USGSResponse> {
  const res = await fetch(`${USGS_BASE}/${feed}.geojson`);
  if (!res.ok) throw new Error(`USGS fetch failed for ${feed}: ${res.status}`);
  return res.json() as Promise<USGSResponse>;
}

export async function handleScheduled(env: CronEnv): Promise<void> {
  // 1 + 2 + 3: Fetch, diff, and store all feeds in parallel
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const [prev, next] = await Promise.all([
        feed === 'all_hour'
          ? getEarthquakeFeed<USGSResponse>(env.EARTHQUAKE_KV, feed)
          : Promise.resolve(null),
        fetchUSGS(feed),
      ]);

      await setEarthquakeFeed(env.EARTHQUAKE_KV, feed, next);

      const newQuakes: USGSFeature[] =
        feed === 'all_hour' && prev?.features
          ? (() => {
              const prevIds = new Set(prev.features.map((f) => f.id));
              return next.features.filter((f) => !prevIds.has(f.id));
            })()
          : [];

      return { feed, newQuakes };
    }),
  );

  // Collect new quakes from the all_hour diff
  const newQuakes: USGSFeature[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.feed === 'all_hour') {
      newQuakes.push(...r.value.newQuakes);
    } else if (r.status === 'rejected') {
      console.error('[cron] feed fetch error:', r.reason);
    }
  }

  if (newQuakes.length === 0) return;

  console.log(`[cron] ${newQuakes.length} new quake(s) detected`);

  for (const f of newQuakes) {
    trackNewQuake(env.ANALYTICS, {
      id: f.id,
      magnitude: f.properties.mag ?? 0,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      place: f.properties.place,
    });
  }

  // 4. Broadcast to EarthquakeRoom DO (fans out to connected WebSocket clients)
  try {
    const stub = env.EARTHQUAKE_ROOM.get(
      env.EARTHQUAKE_ROOM.idFromName('global'),
    );
    await stub.fetch(
      new Request('https://do-internal/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_earthquake', earthquakes: newQuakes }),
      }),
    );
  } catch (err) {
    console.error('[cron] EarthquakeRoom broadcast failed:', err);
  }

  // 5. Enqueue M3.0+ for APNs (if queue is bound)
  if (env.NOTIFICATION_QUEUE) {
    const significant = newQuakes.filter((f) => (f.properties.mag ?? 0) >= 3.0);
    if (significant.length > 0) {
      await env.NOTIFICATION_QUEUE.sendBatch(
        significant.map((f) => ({
          body: {
            earthquakeId: f.id,
            magnitude:    f.properties.mag,
            place:        f.properties.place,
            time:         f.properties.time,
            latitude:     f.geometry.coordinates[1],
            longitude:    f.geometry.coordinates[0],
            depth:        f.geometry.coordinates[2],
          },
        })),
      );
      console.log(`[cron] enqueued ${significant.length} notification(s)`);
    }
  }
}
