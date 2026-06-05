import type { APIRoute } from 'astro';
import { loadAllEarthquakes } from '@/lib/server-data';

const baseUrl = import.meta.env.PUBLIC_BASE_URL ?? 'https://baytremor.com';

export const GET: APIRoute = async () => {
  const quakes = await loadAllEarthquakes('all_week');
  const significant = quakes.filter((q) => q.magnitude >= 2.5).slice(0, 100);

  const items = significant.map((eq) => {
    const pubDate = new Date(eq.timestamp).toISOString();
    const title = `M${eq.magnitude.toFixed(1)} Earthquake - ${eq.place}`;
    return `  <url>
    <loc>${baseUrl}/earthquake/${eq.id}</loc>
    <news:news>
      <news:publication>
        <news:name>Bay Tremor</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
      <news:keywords>earthquake, bay area, seismic activity, M${eq.magnitude.toFixed(1)}</news:keywords>
    </news:news>
  </url>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
};
