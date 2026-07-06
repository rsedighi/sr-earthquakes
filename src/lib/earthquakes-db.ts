/**
 * D1 helpers for the `earthquakes` table.
 *
 * The table is the canonical store of Bay Area quakes that have happened
 * since the R2 historical dataset cutoff (2025-12-08). It is populated by:
 *   • the every-minute cron (src/lib/cron.ts) for live ingest
 *   • the admin backfill route (src/pages/api/admin/backfill-earthquakes.ts)
 */
import type { Earthquake, USGSFeature } from './types';
import { getRegionForCoordinates } from './regions';

// Bay Area bounding box — matches src/lib/historical.ts so the two stores
// describe the same geographic region.
export const BAY_AREA_BOUNDS = {
  minLat: 36.9, maxLat: 38.35,
  minLon: -123.0, maxLon: -121.4,
};

// Date the static R2 historical dataset ends. D1 covers everything from this
// timestamp forward.
export const HISTORICAL_CUTOFF_MS = Date.UTC(2025, 11, 8); // 2025-12-08

export interface EarthquakeRow {
  id: string;
  magnitude: number;
  place: string | null;
  time_ms: number;
  latitude: number;
  longitude: number;
  depth: number | null;
  felt: number | null;
  significance: number | null;
  url: string | null;
  region: string | null;
}

function rowToEarthquake(r: EarthquakeRow): Earthquake {
  return {
    id: r.id,
    magnitude: r.magnitude,
    place: r.place ?? 'Unknown location',
    time: new Date(r.time_ms),
    timestamp: r.time_ms,
    latitude: r.latitude,
    longitude: r.longitude,
    depth: r.depth ?? 0,
    felt: r.felt,
    significance: r.significance ?? 0,
    url: r.url ?? '',
    region: r.region ?? getRegionForCoordinates(r.latitude, r.longitude),
  };
}

function isInBayArea(lat: number, lon: number): boolean {
  return (
    lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
    lon >= BAY_AREA_BOUNDS.minLon && lon <= BAY_AREA_BOUNDS.maxLon
  );
}

/**
 * Filter raw USGS features down to Bay Area events with a valid magnitude/time
 * and map them into the shape we persist. Returns events ready for upsert.
 */
export function featuresToInsertable(features: USGSFeature[]): Array<{
  id: string;
  magnitude: number;
  place: string | null;
  time_ms: number;
  latitude: number;
  longitude: number;
  depth: number | null;
  felt: number | null;
  significance: number | null;
  url: string | null;
  region: string;
}> {
  const out = [];
  for (const f of features) {
    if (!f?.id || !f.geometry?.coordinates || !f.properties) continue;
    const [lon, lat, depth] = f.geometry.coordinates;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    if (!isInBayArea(lat, lon)) continue;
    if (typeof f.properties.time !== 'number') continue;
    if (typeof f.properties.mag !== 'number') continue;
    out.push({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place ?? null,
      time_ms: f.properties.time,
      latitude: lat,
      longitude: lon,
      depth: typeof depth === 'number' ? depth : null,
      felt: f.properties.felt ?? null,
      significance: f.properties.sig ?? null,
      url: f.properties.url ?? null,
      region: getRegionForCoordinates(lat, lon),
    });
  }
  return out;
}

/**
 * Insert (or ignore on conflict) a batch of earthquakes into D1.
 * Returns { inserted, attempted } — `inserted` may be less than `attempted`
 * because duplicates are silently skipped (idempotent).
 *
 * D1 caps a single statement at ~100 bound params, so this batches via
 * `db.batch()` with one prepared statement per row (D1 pipelines them).
 */
export async function upsertEarthquakes(
  db: D1Database,
  rows: ReturnType<typeof featuresToInsertable>,
): Promise<{ inserted: number; attempted: number }> {
  if (rows.length === 0) return { inserted: 0, attempted: 0 };

  const now = Date.now();
  const stmt = db.prepare(
    `INSERT INTO earthquakes
       (id, magnitude, place, time_ms, latitude, longitude, depth, felt, significance, url, region, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usgs', ?)
     ON CONFLICT(id) DO NOTHING`,
  );

  // Chunk to stay well under D1's per-batch statement limit.
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const results = await db.batch(
      chunk.map((r) =>
        stmt.bind(
          r.id,
          r.magnitude,
          r.place,
          r.time_ms,
          r.latitude,
          r.longitude,
          r.depth,
          r.felt,
          r.significance,
          r.url,
          r.region,
          now,
        ),
      ),
    );
    for (const res of results) {
      inserted += res.meta?.changes ?? 0;
    }
  }

  return { inserted, attempted: rows.length };
}

/**
 * Return all stored earthquakes with `time_ms >= sinceMs`, newest first.
 */
export async function getEarthquakesSince(
  db: D1Database,
  sinceMs: number,
  options?: { minMagnitude?: number; limit?: number },
): Promise<Earthquake[]> {
  const minMag = options?.minMagnitude ?? -10;
  const limit = options?.limit ?? 50000;
  const { results } = await db
    .prepare(
      `SELECT id, magnitude, place, time_ms, latitude, longitude, depth, felt, significance, url, region
         FROM earthquakes
        WHERE time_ms >= ? AND magnitude >= ?
        ORDER BY time_ms DESC
        LIMIT ?`,
    )
    .bind(sinceMs, minMag, limit)
    .all<EarthquakeRow>();
  return results.map(rowToEarthquake);
}

/**
 * Return the most recent `time_ms` we've stored, or null if the table is empty.
 * Used by the backfill route to resume where we left off.
 */
export async function getLatestEarthquakeTime(db: D1Database): Promise<number | null> {
  const row = await db
    .prepare('SELECT MAX(time_ms) as max_ms FROM earthquakes')
    .first<{ max_ms: number | null }>();
  return row?.max_ms ?? null;
}

export async function getEarthquakeCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as cnt FROM earthquakes')
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}
