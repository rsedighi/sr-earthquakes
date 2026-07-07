import type { APIRoute } from 'astro';
import { REGIONS, BAY_AREA_LANDMARKS } from '@/lib/regions';

const baseUrl = import.meta.env.PUBLIC_BASE_URL ?? 'https://baytremor.com';
const now = new Date().toISOString().split('T')[0];

const CITY_SLUGS = [
  'san-francisco', 'oakland', 'san-jose', 'berkeley', 'fremont',
  'hayward', 'santa-rosa', 'sunnyvale', 'concord', 'vallejo',
  'richmond', 'san-mateo', 'daly-city', 'palo-alto', 'mountain-view',
  'livermore', 'pleasanton', 'san-ramon', 'walnut-creek', 'napa',
  'santa-clara', 'milpitas', 'dublin', 'redwood-city', 'san-leandro',
  'alameda', 'union-city', 'newark', 'cupertino', 'campbell',
];

function url(path: string, priority: string, freq: string, lastmod = now) {
  return `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: APIRoute = () => {
  const staticUrls = [
    url('/', '1.0', 'always'),
    url('/today', '0.9', 'always'),
    url('/latest', '0.9', 'always'),
    url('/community', '0.7', 'hourly'),
    url('/my-area', '0.8', 'hourly'),
    url('/history', '0.7', 'daily'),
    url('/compare', '0.6', 'weekly'),
    url('/learn', '0.6', 'weekly'),
    url('/news', '0.6', 'daily'),
    url('/san-andreas-fault', '0.7', 'monthly'),
    url('/hayward-fault', '0.7', 'monthly'),
    url('/calaveras-fault', '0.7', 'monthly'),
    url('/earthquake-preparedness', '0.6', 'monthly'),
    url('/faq', '0.5', 'monthly'),
    url('/about', '0.5', 'monthly'),
    url('/privacy', '0.3', 'yearly'),
    url('/support', '0.4', 'monthly'),
    url('/ios', '0.6', 'monthly'),
  ];

  const regionUrls = REGIONS.map((r) => url(`/region/${r.id}`, '0.7', 'hourly'));

  const cityUrls = CITY_SLUGS.map((slug) =>
    url(`/${slug}-earthquake-today`, '0.8', 'always'),
  );

  const riskUrls = CITY_SLUGS.map((slug) => url(`/risk/${slug}`, '0.8', 'weekly'));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...regionUrls, ...cityUrls, ...riskUrls].join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
