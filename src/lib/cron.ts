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
import { featuresToInsertable, upsertEarthquakes } from './earthquakes-db';
import { backfillRange } from './backfill';
import { trackNewQuake } from './analytics';

// Safety-net backfill: once per hour the cron walks the last 7 days of USGS
// Bay Area data and re-upserts into D1. Idempotent (INSERT OR IGNORE), so this
// only inserts rows we somehow missed (e.g. a cron skip, USGS feed lag).
// Tracked in KV so we run exactly once per UTC hour even with overlapping cron
// invocations.
const SAFETY_NET_KV_KEY  = 'earthquakes:safety-net:last-hour';
const SAFETY_NET_WINDOW  = 7 * 24 * 60 * 60 * 1000; // 7 days

const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const FEEDS     = ['all_hour', 'all_day', 'all_week'] as const;
type FeedName   = typeof FEEDS[number];

type CronEnv = Pick<
  Env,
  'EARTHQUAKE_KV' | 'EARTHQUAKE_ROOM' | 'NOTIFICATION_QUEUE' | 'DB' | 'ANALYTICS'
>;

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

      return { feed, newQuakes, allFeatures: next.features };
    }),
  );

  // Collect new quakes from the all_hour diff
  const newQuakes: USGSFeature[] = [];
  // Also collect the full all_day snapshot so we can persist Bay Area quakes to D1.
  // `all_day` covers any event the cron might miss with all_hour alone (e.g. if a
  // run is skipped), giving the D1 store a self-healing 24h overlap window.
  let allDayFeatures: USGSFeature[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.feed === 'all_hour') {
        newQuakes.push(...r.value.newQuakes);
      } else if (r.value.feed === 'all_day') {
        allDayFeatures = r.value.allFeatures;
      }
    } else {
      console.error('[cron] feed fetch error:', r.reason);
    }
  }

  // Persist Bay Area quakes to D1. Idempotent via ON CONFLICT(id) DO NOTHING,
  // so re-running with the same all_day snapshot is cheap and safe.
  if (env.DB && allDayFeatures.length > 0) {
    try {
      const rows = featuresToInsertable(allDayFeatures);
      if (rows.length > 0) {
        const { inserted, attempted } = await upsertEarthquakes(env.DB, rows);
        if (inserted > 0) {
          console.log(`[cron] persisted ${inserted}/${attempted} Bay Area quakes to D1`);
        }
      }
    } catch (err) {
      console.error('[cron] D1 upsertEarthquakes failed:', err);
    }
  }

  // Hourly safety-net backfill — walks the last 7 days from USGS and upserts
  // anything we missed. KV-gated so it runs at most once per UTC hour even
  // though the cron itself fires every minute.
  if (env.DB) {
    try {
      const hourKey = Math.floor(Date.now() / (60 * 60 * 1000)).toString();
      const lastRun = await env.EARTHQUAKE_KV.get(SAFETY_NET_KV_KEY);
      if (lastRun !== hourKey) {
        // Mark first so a long-running backfill doesn't double-fire.
        await env.EARTHQUAKE_KV.put(SAFETY_NET_KV_KEY, hourKey, { expirationTtl: 7200 });
        const now = Date.now();
        const result = await backfillRange(env.DB, now - SAFETY_NET_WINDOW, now, { minMagnitude: 0 });
        if (result.totalInserted > 0) {
          console.log(`[cron] safety-net backfilled ${result.totalInserted} missed quakes (last 7d)`);
        }
      }
    } catch (err) {
      console.error('[cron] safety-net backfill failed:', err);
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
