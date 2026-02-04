import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { REGIONS, BAY_AREA_LANDMARKS } from '@/lib/regions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface EarthquakeData {
  id: string;
  magnitude: number;
  timestamp: number;
  place: string;
}

// Get earthquake data with timestamps for priority calculation
function getEarthquakeData(): EarthquakeData[] {
  const dataDir = path.join(process.cwd(), 'data');
  const earthquakes: EarthquakeData[] = [];
  
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        for (const feature of data.features) {
          if (feature.properties?.time && feature.properties?.mag != null) {
            earthquakes.push({
              id: feature.id,
              magnitude: feature.properties.mag,
              timestamp: feature.properties.time,
              place: feature.properties.place || '',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading earthquake IDs for sitemap:', error);
  }
  
  // Sort by timestamp descending (most recent first)
  return earthquakes.sort((a, b) => b.timestamp - a.timestamp);
}

// Calculate priority based on recency and magnitude
function calculateEarthquakePriority(earthquake: EarthquakeData, index: number): number {
  const now = Date.now();
  const ageInDays = (now - earthquake.timestamp) / (1000 * 60 * 60 * 24);
  
  // Base priority on age
  let priority = 0.8;
  
  if (ageInDays < 1) {
    priority = 0.9; // Last 24 hours - highest priority
  } else if (ageInDays < 7) {
    priority = 0.8; // Last week
  } else if (ageInDays < 30) {
    priority = 0.7; // Last month
  } else if (ageInDays < 90) {
    priority = 0.6; // Last 3 months
  } else {
    priority = 0.5; // Older
  }
  
  // Boost for significant earthquakes (M3.5+)
  if (earthquake.magnitude >= 4.5) {
    priority = Math.min(priority + 0.1, 1.0);
  } else if (earthquake.magnitude >= 3.5) {
    priority = Math.min(priority + 0.05, 0.95);
  }
  
  return Math.round(priority * 100) / 100;
}

// Get change frequency based on age
function getChangeFrequency(timestamp: number): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  const now = Date.now();
  const ageInDays = (now - timestamp) / (1000 * 60 * 60 * 24);
  
  if (ageInDays < 1) return 'hourly';
  if (ageInDays < 7) return 'daily';
  if (ageInDays < 30) return 'weekly';
  return 'monthly';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const earthquakeData = getEarthquakeData();
  const now = new Date();
  
  // ===== CORE PAGES (Highest Priority) =====
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'always', // Real-time data
      priority: 1.0,
    },
    {
      url: `${baseUrl}/today`,
      lastModified: now,
      changeFrequency: 'always', // Updates constantly
      priority: 1.0,
    },
    {
      url: `${baseUrl}/latest`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
  ];
  
  // ===== PILLAR CONTENT PAGES (Critical for SEO) =====
  const pillarPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/earthquake-preparedness`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/san-andreas-fault`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/hayward-fault`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
  ];
  
  // ===== HIGH-VALUE CONTENT PAGES =====
  const contentPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/community`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community/earthquake`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/community/general`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community/neighborhood`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community/preparedness`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community/science`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/history`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/my-area`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
  
  // ===== REGION PAGES (Critical for Local SEO) =====
  const regionPages: MetadataRoute.Sitemap = REGIONS.map(region => ({
    url: `${baseUrl}/region/${region.id}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));
  
  // ===== CITY PAGES (Hyper-Local SEO) =====
  // All cities, not just top 30
  const allCities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  
  const cityPages: MetadataRoute.Sitemap = allCities.map(city => ({
    url: `${baseUrl}/city/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));
  
  // ===== CITY "TODAY" PAGES (Critical for "X earthquake today" searches) =====
  const majorCities = ['san-francisco', 'oakland', 'san-jose', 'berkeley', 'fremont', 
    'hayward', 'santa-rosa', 'sunnyvale', 'concord', 'vallejo', 'richmond',
    'san-mateo', 'daly-city', 'palo-alto', 'mountain-view', 'livermore',
    'pleasanton', 'san-ramon', 'walnut-creek', 'napa'];
  
  const cityTodayPages: MetadataRoute.Sitemap = majorCities.map(citySlug => ({
    url: `${baseUrl}/${citySlug}-earthquake-today`,
    lastModified: now,
    changeFrequency: 'always' as const,
    priority: 0.95, // Very high priority for "today" searches
  }));
  
  // ===== EARTHQUAKE DETAIL PAGES (Dynamic Priority) =====
  // Include more earthquakes with smart prioritization
  const recentEarthquakes = earthquakeData.slice(0, 2000);
  
  const earthquakePages: MetadataRoute.Sitemap = recentEarthquakes.map((eq, index) => ({
    url: `${baseUrl}/earthquake/${eq.id}`,
    lastModified: new Date(eq.timestamp),
    changeFrequency: getChangeFrequency(eq.timestamp),
    priority: calculateEarthquakePriority(eq, index),
  }));
  
  return [
    ...corePages,
    ...pillarPages,
    ...contentPages,
    ...regionPages,
    ...cityPages,
    ...cityTodayPages,
    ...earthquakePages,
  ];
}
