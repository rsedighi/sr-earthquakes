import type { APIRoute } from 'astro';
import {
  HISTORICAL_CUTOFF_MS,
  getEarthquakeCount,
  getLatestEarthquakeTime,
} from '@/lib/earthquakes-db';
import { backfillRange } from '@/lib/backfill';

/**
 * One-shot backfill of Bay Area earthquakes from USGS into D1, covering the
 * gap between the static R2 historical dataset cutoff (2025-12-08) and "now".
 *
 * Auth: requires `Authorization: Bearer <ADMIN_BACKFILL_TOKEN>` header. Set
 * the secret with: `npx wrangler secret put ADMIN_BACKFILL_TOKEN`.
 *
 * Paginates USGS week-by-week (each request returns up to 20k events, well
 * inside the 25k API ceiling for ~7 days of mag>=0 Bay Area activity).
 *
 * Query params:
 *   ?from=YYYY-MM-DD    Override start date (defaults to HISTORICAL_CUTOFF or
 *                       1 hour before the latest D1 row, whichever is later).
 *   ?to=YYYY-MM-DD      Override end date (defaults to today).
 *   ?minMag=N           Minimum magnitude (default 0).
 *   ?dryRun=true        Fetch + count but don't write to D1.
 *
 * Safe to re-run; INSERT OR IGNORE makes it idempotent.
 */
function parseDateParam(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  // Auth
  const expected = env.ADMIN_BACKFILL_TOKEN;
  const authHeader = request.headers.get('Authorization');
  if (!expected) {
    return Response.json(
      { error: 'Server misconfigured: ADMIN_BACKFILL_TOKEN not set' },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!env.DB) {
    return Response.json({ error: 'D1 binding (DB) not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const minMag = parseFloat(url.searchParams.get('minMag') ?? '0');
  const explicitFrom = parseDateParam(url.searchParams.get('from'));
  const explicitTo = parseDateParam(url.searchParams.get('to'));

  // Default start = max(HISTORICAL_CUTOFF, latest stored - 1h overlap)
  const latest = await getLatestEarthquakeTime(env.DB);
  const defaultStart = Math.max(
    HISTORICAL_CUTOFF_MS,
    latest ? latest - 60 * 60 * 1000 : 0,
  );
  const startMs = explicitFrom ?? defaultStart;
  const endMs = explicitTo ?? Date.now();

  if (endMs <= startMs) {
    return Response.json({
      ok: true,
      message: 'Nothing to backfill — endMs <= startMs',
      startMs, endMs,
    });
  }

  const result = await backfillRange(env.DB, startMs, endMs, { minMagnitude: minMag, dryRun });
  const finalCount = await getEarthquakeCount(env.DB);

  return Response.json({
    ok: true,
    dryRun,
    range: { startMs, endMs, startIso: new Date(startMs).toISOString(), endIso: new Date(endMs).toISOString() },
    minMag,
    totals: {
      fetched: result.totalFetched,
      inserted: result.totalInserted,
      attempted: result.totalAttempted,
    },
    weeks: result.weeks,
    d1RowCountAfter: finalCount,
    windows: result.windows,
  });
};
