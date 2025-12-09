// Server-only data loading and processing
// This file contains heavy data operations that should NEVER be serialized to the client

import 'server-only';
import fs from 'fs';
import path from 'path';
import { Earthquake, SwarmEvent } from './types';
import { getRegionForCoordinates, REGIONS } from './regions';
import { detectSwarms } from './analysis';

// Cache for loaded earthquake data (stays on server)
let cachedEarthquakes: Earthquake[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Load all earthquakes from data files (server-only, cached)
export function loadAllEarthquakes(): Earthquake[] {
  const now = Date.now();
  
  // Return cache if valid
  if (cachedEarthquakes && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedEarthquakes;
  }
  
  const dataDir = path.join(process.cwd(), 'data');
  const allEarthquakes: Earthquake[] = [];
  
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
  
  // Cache the result
  cachedEarthquakes = allEarthquakes;
  cacheTimestamp = now;
  
  return allEarthquakes;
}

// Summary data that's small enough to send to client
export interface HistoricalSummary {
  totalCount: number;
  dateRange: {
    start: string; // ISO string
    end: string;
  };
  magnitudeRange: {
    min: number;
    max: number;
    avg: number;
  };
  byRegion: Record<string, number>;
  biggestQuake: {
    id: string;
    magnitude: number;
    place: string;
    timestamp: number;
    region: string;
  } | null;
  regionStats: Array<{
    regionId: string;
    totalCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
  }>;
  swarmSummaries: Array<{
    id: string;
    startTime: string;
    endTime: string;
    peakMagnitude: number;
    totalCount: number;
    region: string;
  }>;
  // Key metrics for dashboard
  sanRamonCount: number;
  santaClaraCount: number;
  sanRamonSwarmCount: number;
  santaClaraSwarmCount: number;
  avgWeeklyRate: number; // Average weekly earthquakes in San Ramon area
}

// Generate lightweight summary for client-side rendering
export function generateHistoricalSummary(): HistoricalSummary {
  const earthquakes = loadAllEarthquakes();
  
  if (earthquakes.length === 0) {
    return {
      totalCount: 0,
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      magnitudeRange: { min: 0, max: 0, avg: 0 },
      byRegion: {},
      biggestQuake: null,
      regionStats: [],
      swarmSummaries: [],
      sanRamonCount: 0,
      santaClaraCount: 0,
      sanRamonSwarmCount: 0,
      santaClaraSwarmCount: 0,
      avgWeeklyRate: 0,
    };
  }

  const magnitudes = earthquakes.map(eq => eq.magnitude);
  const timestamps = earthquakes.map(eq => eq.timestamp);
  
  // Count by region
  const byRegion: Record<string, number> = {};
  for (const eq of earthquakes) {
    byRegion[eq.region] = (byRegion[eq.region] || 0) + 1;
  }

  // Find biggest earthquake
  const biggestQuake = earthquakes.reduce((max, eq) => 
    eq.magnitude > max.magnitude ? eq : max, 
    earthquakes[0]
  );

  // Calculate region stats
  const regionStats = REGIONS.map(region => {
    const regionEqs = earthquakes.filter(eq => eq.region === region.id);
    const mags = regionEqs.map(eq => eq.magnitude);
    return {
      regionId: region.id,
      totalCount: regionEqs.length,
      avgMagnitude: mags.length > 0 ? mags.reduce((a, b) => a + b, 0) / mags.length : 0,
      maxMagnitude: mags.length > 0 ? Math.max(...mags) : 0,
    };
  });

  // Detect swarms - only send summaries, not full earthquake arrays
  const allSwarms = detectSwarms(earthquakes);
  const swarmSummaries = allSwarms.slice(0, 50).map(swarm => ({
    id: swarm.id,
    startTime: swarm.startTime.toISOString(),
    endTime: swarm.endTime.toISOString(),
    peakMagnitude: swarm.peakMagnitude,
    totalCount: swarm.totalCount,
    region: swarm.region,
  }));

  // Regional counts
  const sanRamonQuakes = earthquakes.filter(eq => eq.region === 'san-ramon');
  const santaClaraQuakes = earthquakes.filter(eq => eq.region === 'santa-clara');
  const sanRamonSwarms = detectSwarms(sanRamonQuakes);
  const santaClaraSwarms = detectSwarms(santaClaraQuakes);

  // Calculate average weekly rate (assuming ~15 years of data)
  const dataYears = 15;
  const avgWeeklyRate = Math.round(sanRamonQuakes.length / (dataYears * 52));

  return {
    totalCount: earthquakes.length,
    dateRange: {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString(),
    },
    magnitudeRange: {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      avg: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    },
    byRegion,
    biggestQuake: {
      id: biggestQuake.id,
      magnitude: biggestQuake.magnitude,
      place: biggestQuake.place,
      timestamp: biggestQuake.timestamp,
      region: biggestQuake.region,
    },
    regionStats,
    swarmSummaries,
    sanRamonCount: sanRamonQuakes.length,
    santaClaraCount: santaClaraQuakes.length,
    sanRamonSwarmCount: sanRamonSwarms.length,
    santaClaraSwarmCount: santaClaraSwarms.length,
    avgWeeklyRate,
  };
}

// Get paginated earthquakes for a region (for API routes)
export function getEarthquakesPage(options: {
  region?: string;
  page?: number;
  limit?: number;
  minMagnitude?: number;
  startDate?: number;
  endDate?: number;
}): { earthquakes: Earthquake[]; total: number; hasMore: boolean } {
  const { region, page = 1, limit = 50, minMagnitude = 0, startDate, endDate } = options;
  
  let earthquakes = loadAllEarthquakes();
  
  // Apply filters
  if (region && region !== 'all') {
    earthquakes = earthquakes.filter(eq => eq.region === region);
  }
  if (minMagnitude > 0) {
    earthquakes = earthquakes.filter(eq => eq.magnitude >= minMagnitude);
  }
  if (startDate) {
    earthquakes = earthquakes.filter(eq => eq.timestamp >= startDate);
  }
  if (endDate) {
    earthquakes = earthquakes.filter(eq => eq.timestamp <= endDate);
  }
  
  const total = earthquakes.length;
  const offset = (page - 1) * limit;
  const paginatedQuakes = earthquakes.slice(offset, offset + limit);
  
  return {
    earthquakes: paginatedQuakes,
    total,
    hasMore: offset + limit < total,
  };
}

// Get swarms for a specific region with full earthquake data
export function getSwarmsForRegion(regionId: string): SwarmEvent[] {
  const earthquakes = loadAllEarthquakes();
  const regionQuakes = earthquakes.filter(eq => eq.region === regionId);
  return detectSwarms(regionQuakes);
}

