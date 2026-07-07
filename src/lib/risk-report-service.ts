/**
 * Shared entry point for KV-cached risk reports — used by the /api/risk-report
 * route (address flow) and the server-rendered /risk/{city} SEO pages.
 */
import { computeRiskReport, type RiskReport } from './risk-report';
import { loadHistoricalEarthquakes } from './historical';
import { getEarthquakesSince, HISTORICAL_CUTOFF_MS } from './earthquakes-db';
import type { Earthquake } from './types';

// Serve reports for the greater Bay Area only — the CGS zone layers cover all
// of CA, but our quake history and copy are Bay Area-specific.
export const REPORT_BOUNDS = { minLat: 36.5, maxLat: 38.9, minLon: -123.6, maxLon: -121.0 };

// Zone geometry is essentially static and the quake-history summary tolerates
// staleness; cache aggressively per ~110 m grid cell.
const KV_TTL_SECONDS = 7 * 24 * 60 * 60;

export function isInReportBounds(lat: number, lon: number): boolean {
  return (
    lat >= REPORT_BOUNDS.minLat && lat <= REPORT_BOUNDS.maxLat &&
    lon >= REPORT_BOUNDS.minLon && lon <= REPORT_BOUNDS.maxLon
  );
}

interface ReportEnv {
  EARTHQUAKE_KV?: KVNamespace;
  HISTORICAL_R2?: R2Bucket;
  DB?: D1Database;
}

/**
 * Cached risk report for a coordinate. Coordinates are rounded to ~11 m for
 * computation and ~110 m for the cache key, so neighbors share entries.
 */
export async function getCachedRiskReport(
  env: ReportEnv,
  lat: number,
  lon: number,
  waitUntil?: (p: Promise<unknown>) => void,
): Promise<{ report: RiskReport; cached: boolean }> {
  const qLat = Math.round(lat * 10_000) / 10_000;
  const qLon = Math.round(lon * 10_000) / 10_000;
  const cacheKey = `risk-report:v2:${qLat.toFixed(3)}:${qLon.toFixed(3)}`;

  const cached = await env.EARTHQUAKE_KV?.get(cacheKey, 'json');
  if (cached) return { report: cached as RiskReport, cached: true };

  // History summary source: R2 archive + recent D1 rows, deduped.
  let quakes: Earthquake[] = [];
  try {
    const [historical, recent] = await Promise.all([
      loadHistoricalEarthquakes(env.HISTORICAL_R2),
      env.DB
        ? getEarthquakesSince(env.DB, HISTORICAL_CUTOFF_MS)
        : Promise.resolve([] as Earthquake[]),
    ]);
    const seen = new Set<string>();
    for (const q of recent) if (!seen.has(q.id)) { seen.add(q.id); quakes.push(q); }
    for (const q of historical) if (!seen.has(q.id)) { seen.add(q.id); quakes.push(q); }
  } catch (err) {
    console.error('[risk-report-service] history load failed:', err);
    quakes = [];
  }

  const report = await computeRiskReport(qLat, qLon, quakes);

  if (env.EARTHQUAKE_KV) {
    const put = env.EARTHQUAKE_KV.put(cacheKey, JSON.stringify(report), {
      expirationTtl: KV_TTL_SECONDS,
    });
    if (waitUntil) waitUntil(put);
    else await put;
  }

  return { report, cached: false };
}
