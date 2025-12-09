import { Dashboard } from '@/components/dashboard';
import { Earthquake, SwarmEvent } from '@/lib/types';
import { getRegionForCoordinates, REGIONS } from '@/lib/regions';
import { detectSwarms } from '@/lib/analysis';
import fs from 'fs';
import path from 'path';

// Load and process historical data at build time
async function getHistoricalData() {
  const dataDir = path.join(process.cwd(), 'data');
  const allEarthquakes: Earthquake[] = [];
  
  // Read all JSON files in data directory
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        for (const feature of data.features) {
          const [longitude, latitude, depth] = feature.geometry.coordinates;
          const earthquake: Earthquake = {
            id: feature.id,
            magnitude: feature.properties.mag,
            place: feature.properties.place,
            time: new Date(feature.properties.time),
            timestamp: feature.properties.time,
            latitude,
            longitude,
            depth,
            felt: feature.properties.felt,
            significance: feature.properties.sig,
            url: feature.properties.url,
            region: getRegionForCoordinates(latitude, longitude),
          };
          allEarthquakes.push(earthquake);
        }
      }
    }
  } catch (error) {
    console.error('Error loading historical data:', error);
  }

  // Sort by time descending
  allEarthquakes.sort((a, b) => b.timestamp - a.timestamp);

  // Calculate summary statistics
  const magnitudes = allEarthquakes.map(eq => eq.magnitude);
  const timestamps = allEarthquakes.map(eq => eq.timestamp);
  
  const summary = {
    totalCount: allEarthquakes.length,
    dateRange: {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    },
    magnitudeRange: {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      avg: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    },
    byRegion: {} as Record<string, number>,
  };

  // Count by region
  for (const eq of allEarthquakes) {
    summary.byRegion[eq.region] = (summary.byRegion[eq.region] || 0) + 1;
  }

  // Detect all swarms
  const swarms = detectSwarms(allEarthquakes);

  // Find biggest earthquake
  const biggestQuake = allEarthquakes.reduce((max, eq) => 
    eq.magnitude > max.magnitude ? eq : max, 
    allEarthquakes[0]
  );

  // Get region stats
  const regionStats = REGIONS.map(region => {
    const regionEqs = allEarthquakes.filter(eq => eq.region === region.id);
    const mags = regionEqs.map(eq => eq.magnitude);
    return {
      regionId: region.id,
      totalCount: regionEqs.length,
      avgMagnitude: mags.length > 0 ? mags.reduce((a, b) => a + b, 0) / mags.length : 0,
      maxMagnitude: mags.length > 0 ? Math.max(...mags) : 0,
    };
  });

  // Filter for San Ramon and Santa Clara
  const sanRamonQuakes = allEarthquakes.filter(eq => eq.region === 'san-ramon');
  const sanRamonSwarms = detectSwarms(sanRamonQuakes);
  const santaClaraQuakes = allEarthquakes.filter(eq => eq.region === 'santa-clara');
  const santaClaraSwarms = detectSwarms(santaClaraQuakes);

  return {
    earthquakes: allEarthquakes,
    summary,
    swarms,
    biggestQuake,
    regionStats,
    sanRamonQuakes,
    sanRamonSwarms,
    santaClaraQuakes,
    santaClaraSwarms,
  };
}

export default async function Home() {
  const historicalData = await getHistoricalData();
  
  return <Dashboard historicalData={historicalData} />;
}

// Revalidate every hour
export const revalidate = 3600;

