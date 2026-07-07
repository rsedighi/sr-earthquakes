import type { APIRoute } from 'astro';
import { getCachedRiskReport, isInReportBounds } from '@/lib/risk-report-service';

/**
 * GET /api/risk-report?lat=..&lon=..
 *
 * Server-side Home Seismic Risk Report: CGS regulatory hazard zones + USGS
 * Quaternary fault distance + local quake history, with a transparent band.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);

  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: 'lat and lon are required' }, { status: 400 });
  }
  if (!isInReportBounds(lat, lon)) {
    return Response.json(
      { error: 'Location is outside the Bay Area coverage zone' },
      { status: 422 },
    );
  }

  try {
    const { report, cached } = await getCachedRiskReport(
      env, lat, lon,
      p => locals.runtime.ctx.waitUntil(p),
    );
    return Response.json(
      { report, cached },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
    );
  } catch (err) {
    console.error('[api/risk-report]', err);
    return Response.json({ error: 'Failed to compute risk report' }, { status: 500 });
  }
};
