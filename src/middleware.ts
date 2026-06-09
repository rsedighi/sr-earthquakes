import { defineMiddleware, sequence } from 'astro:middleware';

// ── Security headers (ported from next.config.js) ────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy-Report-Only': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://*.datadoghq.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://ws-na.amazon-adsystem.com https://www.google-analytics.com",
    "font-src 'self'",
    "connect-src 'self' https://earthquake.usgs.gov wss: https://*.datadoghq.com https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

const geoMiddleware = defineMiddleware(async (context, next) => {
  // Cloudflare Workers expose the parsed CF properties via Astro.locals.runtime.cf
  const cf = context.locals.runtime?.cf as
    | import('@cloudflare/workers-types').IncomingRequestCfProperties
    | undefined;

  if (cf) {
    context.locals.cf = {
      city: cf.city,
      region: cf.region,
      country: cf.country,
      timezone: cf.timezone,
      colo: cf.colo,
      latitude: cf.latitude,
      longitude: cf.longitude,
    };
  }

  return next();
});

const securityHeadersMiddleware = defineMiddleware(async (_context, next) => {
  const response = await next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }

  return response;
});

// ── Cache API: cache GET responses for public pages (10 min TTL) ─────────────
const CACHE_TTL = 600; // 10 minutes
const CACHE_BYPASS_PREFIXES = ['/api/', '/community/', '/my-area/'];

const cacheMiddleware = defineMiddleware(async (context, next) => {
  if (context.request.method !== 'GET') return next();

  const url = new URL(context.request.url);

  // Bypass for private/dynamic routes
  if (CACHE_BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    return next();
  }

  // Static asset prefixes are served directly by [assets] binding; skip here
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/favicon')) {
    return next();
  }

  // Cache API is only available at runtime in CF Workers
  // @ts-expect-error caches.default exists on Cloudflare Workers runtime
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (!cache) return next();

  const cacheKey = new Request(url.toString(), { method: 'GET', headers: context.request.headers });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      status: cached.status,
      headers: new Headers([
        ...cached.headers,
        ['X-Cache', 'HIT'],
      ] as [string, string][]),
    });
  }

  const response = await next();

  // Only cache successful HTML responses
  const contentType = response.headers.get('content-type') ?? '';
  if (response.ok && contentType.includes('text/html')) {
    const cacheableResponse = response.clone();
    cacheableResponse.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    context.locals.runtime?.ctx?.waitUntil?.(cache.put(cacheKey, cacheableResponse));
    response.headers.set('X-Cache', 'MISS');
  }

  return response;
});

export const onRequest = sequence(geoMiddleware, securityHeadersMiddleware, cacheMiddleware);
