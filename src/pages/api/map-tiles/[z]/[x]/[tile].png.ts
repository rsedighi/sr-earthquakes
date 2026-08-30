import type { APIRoute } from 'astro';

const BROWSER_TTL = 7 * 24 * 60 * 60;
const EDGE_TTL = 30 * 24 * 60 * 60;

export const GET: APIRoute = async ({ params, request, locals }) => {
  const z = Number(params.z);
  const x = Number(params.x);
  const tileMatch = params.tile?.match(/^(\d+)(@2x)?$/);
  const y = Number(tileMatch?.[1]);
  const scale = tileMatch?.[2] ?? '';
  const maxCoordinate = Number.isInteger(z) && z >= 0 && z <= 20 ? 2 ** z : 0;

  if (
    maxCoordinate === 0 ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= maxCoordinate ||
    y >= maxCoordinate
  ) {
    return new Response('Invalid tile coordinates', { status: 400 });
  }

  const apiKey = locals.runtime.env.CARTO_API ?? import.meta.env.CARTO_API;
  if (!apiKey) return new Response('Map tiles are not configured', { status: 503 });

  const cache = typeof caches !== 'undefined'
    ? (caches as CacheStorage & { default: Cache }).default
    : null;
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cached = await cache?.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set('X-Map-Cache', 'HIT');
    return response;
  }

  const upstreamUrl = new URL(`https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${scale}.png`);
  upstreamUrl.searchParams.set('key', apiKey);
  const upstream = await fetch(upstreamUrl, { headers: { Accept: 'image/png' } });

  if (!upstream.ok || !upstream.body) {
    console.error('[api/map-tiles GET]', { status: upstream.status, z, x, y, scale });
    return new Response('Map tile unavailable', { status: 502 });
  }

  const headers = new Headers({
    'Cache-Control': `public, max-age=${BROWSER_TTL}, s-maxage=${EDGE_TTL}`,
    'Content-Type': upstream.headers.get('Content-Type') ?? 'image/png',
    'X-Map-Cache': 'MISS',
  });
  const etag = upstream.headers.get('ETag');
  if (etag) headers.set('ETag', etag);

  const response = new Response(upstream.body, { headers });
  if (cache) locals.runtime.ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
