import type { APIRoute } from 'astro';
import { cachedImage, renderPng } from '@/lib/og';
import { EarthquakeCard, OG_SIZE, SQUARE_SIZE } from '@/lib/og-cards';
import { fetchEarthquakeDetail } from '@/lib/usgs-detail';

/**
 * Share card for an earthquake. `?size=square` returns 1080x1080 (Instagram etc);
 * `?units=metric` shows km (default is miles, matching the site default).
 * The cache key embeds the fields drawn on the card, so USGS revisions
 * (e.g. M2.1 -> M2.5) produce a fresh image instead of a stale one.
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const quake = await fetchEarthquakeDetail(params.id!, 3000);
  if (!quake) return new Response('Earthquake not found', { status: 404 });

  const square = url.searchParams.get('size') === 'square';
  const units = url.searchParams.get('units') === 'metric' ? 'metric' : 'imperial';
  const env = locals.runtime?.env;
  const version = env?.CF_VERSION_METADATA?.id ?? 'dev';
  const signature = [quake.magnitude, quake.depth, quake.felt ?? 0, quake.place].join('|');
  const key = `${url.origin}/__og/earthquake/${encodeURIComponent(quake.id)}?s=${square ? 'sq' : 'og'}&u=${units}&v=${version}&d=${encodeURIComponent(signature)}`;

  return cachedImage(key, locals.runtime?.ctx, () =>
    renderPng(EarthquakeCard({ quake, square, units }), square ? SQUARE_SIZE : OG_SIZE, { origin: url.origin, assets: env?.ASSETS })
  );
};
