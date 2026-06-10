import type { APIRoute } from 'astro';
import { loadHistoricalEarthquakes } from '@/lib/historical';

/**
 * Returns historical Bay Area earthquakes from the HISTORICAL_R2 bucket.
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
    let quakes = await loadHistoricalEarthquakes(env.HISTORICAL_R2);

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
