import fs from 'fs';
import path from 'path';
import { getRegionForCoordinates, getRegionById } from '@/lib/regions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface EarthquakeNews {
  id: string;
  magnitude: number;
  place: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  region: string;
}

// Get recent earthquakes for news sitemap (last 48 hours for Google News)
function getRecentEarthquakes(): EarthquakeNews[] {
  const dataDir = path.join(process.cwd(), 'data');
  const earthquakes: EarthquakeNews[] = [];
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        for (const feature of data.features) {
          if (
            feature.properties?.time &&
            feature.properties?.mag != null &&
            feature.geometry?.type === 'Point' &&
            feature.properties.time > twoDaysAgo
          ) {
            const [longitude, latitude] = feature.geometry.coordinates;
            const region = getRegionForCoordinates(latitude, longitude);
            
            earthquakes.push({
              id: feature.id,
              magnitude: feature.properties.mag,
              place: feature.properties.place || 'Bay Area',
              timestamp: feature.properties.time,
              latitude,
              longitude,
              region,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading earthquakes for news sitemap:', error);
  }
  
  // Sort by timestamp descending
  return earthquakes.sort((a, b) => b.timestamp - a.timestamp);
}

// Generate news headline based on magnitude
function generateHeadline(eq: EarthquakeNews): string {
  const regionInfo = getRegionById(eq.region);
  const location = eq.place.split(',')[0] || regionInfo?.name || 'Bay Area';
  
  if (eq.magnitude >= 5.0) {
    return `BREAKING: M${eq.magnitude.toFixed(1)} Earthquake Shakes ${location}, California`;
  } else if (eq.magnitude >= 4.0) {
    return `M${eq.magnitude.toFixed(1)} Earthquake Strikes Near ${location}, California - Felt Across Bay Area`;
  } else if (eq.magnitude >= 3.0) {
    return `M${eq.magnitude.toFixed(1)} Earthquake Recorded Near ${location} - Did You Feel It?`;
  } else if (eq.magnitude >= 2.5) {
    return `Minor M${eq.magnitude.toFixed(1)} Earthquake Detected Near ${location}, California`;
  }
  return `M${eq.magnitude.toFixed(1)} Earthquake Near ${location}, California`;
}

// Generate keywords for the earthquake
function generateKeywords(eq: EarthquakeNews): string[] {
  const regionInfo = getRegionById(eq.region);
  const keywords = [
    'earthquake',
    'Bay Area earthquake',
    'California earthquake',
    eq.place,
    regionInfo?.name || '',
    regionInfo?.county ? `${regionInfo.county} County` : '',
    regionInfo?.faultLine || '',
    `M${eq.magnitude.toFixed(1)} earthquake`,
    'seismic activity',
    'earthquake today',
  ].filter(Boolean);
  
  return [...new Set(keywords)];
}

export async function GET() {
  const earthquakes = getRecentEarthquakes();
  
  // Also try to fetch real-time data from USGS for the freshest earthquakes
  let realtimeEarthquakes: EarthquakeNews[] = [];
  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    if (response.ok) {
      const data = await response.json();
      realtimeEarthquakes = data.features
        .filter((f: { geometry: { coordinates: number[] }; properties: { mag: number } }) => {
          // Filter to Bay Area region
          const [lon, lat] = f.geometry.coordinates;
          return lat >= 36.5 && lat <= 39.0 && lon >= -123.5 && lon <= -121.0;
        })
        .map((feature: { id: string; properties: { mag: number; place: string; time: number }; geometry: { coordinates: number[] } }) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          return {
            id: feature.id,
            magnitude: feature.properties.mag,
            place: feature.properties.place || 'Bay Area',
            timestamp: feature.properties.time,
            latitude,
            longitude,
            region: getRegionForCoordinates(latitude, longitude),
          };
        });
    }
  } catch {
    // Continue with local data only
  }
  
  // Merge and dedupe earthquakes
  const allEarthquakes = [...realtimeEarthquakes, ...earthquakes];
  const uniqueEarthquakes = Array.from(
    new Map(allEarthquakes.map(eq => [eq.id, eq])).values()
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  // Generate news sitemap entries
  const newsEntries = uniqueEarthquakes.slice(0, 1000).map(eq => {
    const pubDate = new Date(eq.timestamp);
    const headline = generateHeadline(eq);
    const keywords = generateKeywords(eq);
    
    return `
  <url>
    <loc>${baseUrl}/earthquake/${eq.id}</loc>
    <news:news>
      <news:publication>
        <news:name>Bay Tremor</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate.toISOString()}</news:publication_date>
      <news:title><![CDATA[${headline}]]></news:title>
      <news:keywords>${keywords.join(', ')}</news:keywords>
      <news:geo_locations>California, USA</news:geo_locations>
    </news:news>
    <lastmod>${pubDate.toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Bay Tremor News Sitemap - Real-time Bay Area Earthquake Coverage -->
  <!-- Generated: ${new Date().toISOString()} -->
  <!-- Total Articles: ${Math.min(uniqueEarthquakes.length, 1000)} -->
${newsEntries}
</urlset>`;

  return new Response(newsSitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
    },
  });
}

