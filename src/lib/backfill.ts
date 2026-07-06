/**
 * Shared backfill helper — walks USGS week-by-week and upserts every Bay Area
 * quake into D1. Used by both the manual admin route and the hourly cron
 * safety-net. Idempotent via `INSERT OR IGNORE`.
 */
import {
  BAY_AREA_BOUNDS,
  featuresToInsertable,
  upsertEarthquakes,
} from './earthquakes-db';
import type { USGSResponse } from './types';

const USGS_QUERY = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface BackfillWindow {
  start: number;
  end: number;
  fetched: number;
  inserted: number;
  attempted: number;
  error?: string;
}

export interface BackfillResult {
  totalFetched: number;
  totalInserted: number;
  totalAttempted: number;
  weeks: number;
  windows: BackfillWindow[];
}

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchWindow(startMs: number, endMs: number, minMag: number): Promise<USGSResponse> {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: fmtDate(startMs),
    endtime: fmtDate(endMs),
    minlatitude: BAY_AREA_BOUNDS.minLat.toString(),
    maxlatitude: BAY_AREA_BOUNDS.maxLat.toString(),
    minlongitude: BAY_AREA_BOUNDS.minLon.toString(),
    maxlongitude: BAY_AREA_BOUNDS.maxLon.toString(),
    minmagnitude: minMag.toString(),
    orderby: 'time',
    limit: '20000',
  });
  const res = await fetch(`${USGS_QUERY}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`USGS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json() as Promise<USGSResponse>;
}

/**
 * Backfill the [startMs, endMs] range into D1, paginating week-by-week.
 *
 * Safe to call repeatedly with overlapping ranges — the underlying upsert is
 * idempotent. One failed week does not abort the run.
 */
export async function backfillRange(
  db: D1Database,
  startMs: number,
  endMs: number,
  options?: { minMagnitude?: number; dryRun?: boolean },
): Promise<BackfillResult> {
  const minMag = options?.minMagnitude ?? 0;
  const dryRun = options?.dryRun ?? false;

  const windows: BackfillWindow[] = [];
  let totalFetched = 0;
  let totalInserted = 0;
  let totalAttempted = 0;

  for (let cursor = startMs; cursor < endMs; cursor += WEEK_MS) {
    const wEnd = Math.min(cursor + WEEK_MS, endMs);
    try {
      const resp = await fetchWindow(cursor, wEnd, minMag);
      const rows = featuresToInsertable(resp.features ?? []);
      totalFetched += rows.length;

      let inserted = 0;
      let attempted = 0;
      if (!dryRun && rows.length > 0) {
        const r = await upsertEarthquakes(db, rows);
        inserted = r.inserted;
        attempted = r.attempted;
        totalInserted += inserted;
        totalAttempted += attempted;
      }

      windows.push({ start: cursor, end: wEnd, fetched: rows.length, inserted, attempted });
    } catch (err) {
      windows.push({
        start: cursor, end: wEnd,
        fetched: 0, inserted: 0, attempted: 0,
        error: String(err),
      });
    }
  }

  return { totalFetched, totalInserted, totalAttempted, weeks: windows.length, windows };
}
