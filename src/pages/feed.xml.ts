import type { APIRoute } from 'astro';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeLabel } from '@/lib/analysis';
import { getRegionById } from '@/lib/regions';

const baseUrl = import.meta.env.PUBLIC_BASE_URL ?? 'https://baytremor.com';

export const GET: APIRoute = async () => {
  const earthquakes = await loadAllEarthquakes('all_week');
  const recent = earthquakes.slice(0, 50);

  const items = recent.map((eq) => {
    const region = getRegionById(eq.region);
    const pubDate = new Date(eq.timestamp).toUTCString();
    const title = `M${eq.magnitude.toFixed(1)} Earthquake - ${eq.place}`;
    const desc = `A ${getMagnitudeLabel(eq.magnitude).toLowerCase()} magnitude ${eq.magnitude.toFixed(1)} earthquake occurred ${eq.place} at a depth of ${eq.depth.toFixed(1)}km.${region ? ` Located in the ${region.name} region.` : ''}`;
    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${baseUrl}/earthquake/${eq.id}</link>
      <guid isPermaLink="true">${baseUrl}/earthquake/${eq.id}</guid>
      <description><![CDATA[${desc}]]></description>
      <pubDate>${pubDate}</pubDate>
      <geo:lat>${eq.latitude}</geo:lat>
      <geo:long>${eq.longitude}</geo:long>
      <category>Earthquake</category>
      <category>${getMagnitudeLabel(eq.magnitude)}</category>
      ${region ? `<category>${region.name}</category>` : ''}
    </item>`;
  }).join('\n');

  const lastBuildDate = recent.length > 0
    ? new Date(recent[0].timestamp).toUTCString()
    : new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bay Tremor - Bay Area Earthquake Feed</title>
    <link>${baseUrl}</link>
    <description>Real-time earthquake updates for the San Francisco Bay Area. Monitor seismic activity with live USGS data.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/android-chrome-512x512.png</url>
      <title>Bay Tremor</title>
      <link>${baseUrl}</link>
    </image>
    <category>Science</category>
    <category>Earthquake</category>
    <category>Bay Area</category>
    <ttl>15</ttl>
    ${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
};
