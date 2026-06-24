import type { APIRoute } from 'astro';
import { loadHistoricalEarthquakes } from '@/lib/historical';
import { getEarthquakesSince, HISTORICAL_CUTOFF_MS } from '@/lib/earthquakes-db';
import type { Earthquake } from '@/lib/types';

/**
 * Returns historical Bay Area earthquakes from the HISTORICAL_R2 bucket,
 * merged with anything we've ingested into D1 since the R2 cutoff so the
 * "history" surface stays current.
 *
 * Used by HistoricalSwarms (history page) and MyNeighborhood (my-area page).
 *
 * Query params:
 *   ?all=true       Return all available historical data (default response when present)
 *   ?minMag=N       Filter to magnitude >= N
 *   ?limit=N        Cap the response (server applies after sorting)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);
  const minMag = parseFloat(url.searchParams.get('minMag') ?? '0');
  const limit = parseInt(url.searchParams.get('limit') ?? '0', 10);

  try {
    // R2 covers everything up to HISTORICAL_CUTOFF_MS (2025-12-08).
    // D1 covers everything from the cutoff forward (cron + backfill).
    const [historical, recent] = await Promise.all([
      loadHistoricalEarthquakes(env.HISTORICAL_R2),
      env.DB
        ? getEarthquakesSince(env.DB, HISTORICAL_CUTOFF_MS, { minMagnitude: minMag })
        : Promise.resolve([] as Earthquake[]),
    ]);

    // Merge + dedupe by id (D1 wins on conflict — fresher).
    const seen = new Set<string>();
    let quakes: Earthquake[] = [];
    for (const q of recent) {
      if (!seen.has(q.id)) { seen.add(q.id); quakes.push(q); }
    }
    for (const q of historical) {
      if (!seen.has(q.id)) { seen.add(q.id); quakes.push(q); }
    }
    quakes.sort((a, b) => b.timestamp - a.timestamp);

    if (minMag > 0) {
      quakes = quakes.filter((eq) => eq.magnitude >= minMag);
    }
    if (limit > 0) {
      quakes = quakes.slice(0, limit);
    }

    // `time` is a Date object — serialize to ISO so the client can rehydrate.
    const serialized = quakes.map((eq) => ({
      ...eq,
      time: eq.time.toISOString(),
    }));

    return Response.json(
      { earthquakes: serialized, count: serialized.length },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=3600',
        },
      },
    );
  } catch (err) {
    console.error('[api/earthquakes/list]', err);
    return Response.json(
      { error: 'Failed to load historical earthquakes', earthquakes: [] },
      { status: 500 },
    );
  }
};
