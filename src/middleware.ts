import { defineMiddleware, sequence } from 'astro:middleware';
import { trackPageView } from '@/lib/analytics';

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://*.datadoghq.com https://static.cloudflareinsights.com https://ep2.adtrafficquality.google https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://ws-na.amazon-adsystem.com https://www.google-analytics.com https://ep1.adtrafficquality.google",
    "font-src 'self'",
    "connect-src 'self' https://earthquake.usgs.gov wss: https://*.datadoghq.com https://browser-intake-datadoghq.com https://www.google-analytics.com https://cloudflareinsights.com",
    "frame-src 'self' https://googleads.g.doubleclick.net https://ep2.adtrafficquality.google https://www.google.com/recaptcha/",
    "worker-src 'self' blob:",
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
// Bump CACHE_VERSION to invalidate all cached responses after a deploy.
const CACHE_VERSION = 'v4';
// Dynamic routes whose HTML embeds hashed asset paths AND/OR per-user data —
// must never be served from the edge HTML cache. Matches the exact path or
// any sub-path (e.g. '/community' and '/community/general/foo').
const CACHE_BYPASS_PATHS = ['/api', '/community', '/my-area', '/history'];

const cacheMiddleware = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const start = Date.now();
  const ae = context.locals.runtime?.env?.ANALYTICS;
  const country = context.locals.cf?.country;

  if (context.request.method !== 'GET') return next();

  // Bypass for private/dynamic routes
  if (CACHE_BYPASS_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) {
    const r = await next();
    trackPageView(ae, { route: url.pathname, country, status: r.status, cacheHit: false, durationMs: Date.now() - start });
    return r;
  }

  // Static asset prefixes are served directly by [assets] binding; skip here
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/favicon')) {
    return next();
  }

  // Cache API is only available at runtime in CF Workers
  // @ts-expect-error caches.default exists on Cloudflare Workers runtime
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (!cache) return next();

  // Cache key: URL-only + version. Including all request headers causes
  // fragmentation and unpredictable hits (Cache API ignores most headers anyway).
  const versionedUrl = new URL(url.toString());
  versionedUrl.searchParams.set('__cv', CACHE_VERSION);
  const cacheKey = new Request(versionedUrl.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  // Defensive: never serve cached redirects or non-2xx responses.
  if (cached && cached.ok && cached.status >= 200 && cached.status < 300) {
    trackPageView(ae, { route: url.pathname, country, status: cached.status, cacheHit: true, durationMs: Date.now() - start });
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
  if (response.ok && response.status === 200 && contentType.includes('text/html')) {
    const cacheableResponse = response.clone();
    cacheableResponse.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    context.locals.runtime?.ctx?.waitUntil?.(cache.put(cacheKey, cacheableResponse));
    response.headers.set('X-Cache', 'MISS');
  }

  trackPageView(ae, { route: url.pathname, country, status: response.status, cacheHit: false, durationMs: Date.now() - start });
  return response;
});

export const onRequest = sequence(geoMiddleware, securityHeadersMiddleware, cacheMiddleware);
