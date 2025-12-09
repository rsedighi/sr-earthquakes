import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { REGIONS, BAY_AREA_LANDMARKS } from '@/lib/regions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// Get unique earthquake IDs from data files
function getEarthquakeIds(): string[] {
  const dataDir = path.join(process.cwd(), 'data');
  const earthquakeIds: string[] = [];
  
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        for (const feature of data.features) {
          earthquakeIds.push(feature.id);
        }
      }
    }
  } catch (error) {
    console.error('Error loading earthquake IDs for sitemap:', error);
  }
  
  return earthquakeIds;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const earthquakeIds = getEarthquakeIds();
  const now = new Date();
  
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
  
  // Region pages for local SEO (very important!)
  const regionPages: MetadataRoute.Sitemap = REGIONS.map(region => ({
    url: `${baseUrl}/region/${region.id}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));
  
  // City pages for hyper-local SEO
  const majorCities = BAY_AREA_LANDMARKS
    .filter(l => l.type === 'city')
    .slice(0, 30); // Top 30 cities
  
  const cityPages: MetadataRoute.Sitemap = majorCities.map(city => ({
    url: `${baseUrl}/city/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));
  
  // Recent earthquake pages (prioritize recent ones)
  // Only include most recent 1000 earthquakes in sitemap for performance
  const recentEarthquakeIds = earthquakeIds.slice(0, 1000);
  
  const earthquakePages: MetadataRoute.Sitemap = recentEarthquakeIds.map((id, index) => ({
    url: `${baseUrl}/earthquake/${id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    // Higher priority for more recent earthquakes
    priority: Math.max(0.4, 0.7 - (index * 0.0003)),
  }));
  
  return [...staticPages, ...regionPages, ...cityPages, ...earthquakePages];
}

