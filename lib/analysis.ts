import { 
  Earthquake, 
  SwarmEvent, 
  TimeSeriesPoint, 
  MagnitudeBucket,
  RegionStats 
} from './types';
import { REGIONS } from './regions';

// Constants for swarm detection
const SWARM_TIME_WINDOW_HOURS = 72; // 3 days
const SWARM_MIN_EARTHQUAKES = 5;
const SWARM_DISTANCE_KM = 10;

// Calculate distance between two points (Haversine formula)
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Detect earthquake swarms
export function detectSwarms(earthquakes: Earthquake[]): SwarmEvent[] {
  const swarms: SwarmEvent[] = [];
  const processed = new Set<string>();
  
  // Sort by time
  const sorted = [...earthquakes].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 0; i < sorted.length; i++) {
    if (processed.has(sorted[i].id)) continue;
    
    const seed = sorted[i];
    const cluster: Earthquake[] = [seed];
    processed.add(seed.id);
    
    // Find earthquakes within time and distance window
    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      if (processed.has(candidate.id)) continue;
      
      // Check time window
      const hoursDiff = (candidate.timestamp - seed.timestamp) / (1000 * 60 * 60);
      if (hoursDiff > SWARM_TIME_WINDOW_HOURS) break;
      
      // Check distance
      const distance = haversineDistance(
        seed.latitude, seed.longitude,
        candidate.latitude, candidate.longitude
      );
      
      if (distance <= SWARM_DISTANCE_KM) {
        cluster.push(candidate);
        processed.add(candidate.id);
      }
    }
    
    // If cluster meets minimum, record as swarm
    if (cluster.length >= SWARM_MIN_EARTHQUAKES) {
      const centerLat = cluster.reduce((sum, eq) => sum + eq.latitude, 0) / cluster.length;
      const centerLon = cluster.reduce((sum, eq) => sum + eq.longitude, 0) / cluster.length;
      
      swarms.push({
        id: `swarm-${seed.id}`,
        startTime: new Date(Math.min(...cluster.map(eq => eq.timestamp))),
        endTime: new Date(Math.max(...cluster.map(eq => eq.timestamp))),
        earthquakes: cluster.sort((a, b) => a.timestamp - b.timestamp),
        peakMagnitude: Math.max(...cluster.map(eq => eq.magnitude)),
        totalCount: cluster.length,
        region: seed.region,
        centerLat,
        centerLon,
      });
    }
  }
  
  return swarms.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

// Generate time series data
export function generateTimeSeries(
  earthquakes: Earthquake[],
  intervalDays: number = 30
): TimeSeriesPoint[] {
  if (earthquakes.length === 0) return [];
  
  const sorted = [...earthquakes].sort((a, b) => a.timestamp - b.timestamp);
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp;
  
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const points: TimeSeriesPoint[] = [];
  
  let currentStart = start;
  
  while (currentStart <= end) {
    const currentEnd = currentStart + intervalMs;
    const inRange = sorted.filter(
      eq => eq.timestamp >= currentStart && eq.timestamp < currentEnd
    );
    
    const magnitudes = inRange.map(eq => eq.magnitude);
    
    points.push({
      date: new Date(currentStart),
      timestamp: currentStart,
      count: inRange.length,
      maxMagnitude: magnitudes.length > 0 ? Math.max(...magnitudes) : 0,
      avgMagnitude: magnitudes.length > 0 
        ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length 
        : 0,
      cumulativeEnergy: inRange.reduce((sum, eq) => 
        sum + Math.pow(10, 1.5 * eq.magnitude), 0
      ),
    });
    
    currentStart = currentEnd;
  }
  
  return points;
}

// Generate magnitude distribution
export function getMagnitudeDistribution(earthquakes: Earthquake[]): MagnitudeBucket[] {
  const buckets: MagnitudeBucket[] = [
    { range: '0-1', min: 0, max: 1, count: 0, percentage: 0 },
    { range: '1-2', min: 1, max: 2, count: 0, percentage: 0 },
    { range: '2-3', min: 2, max: 3, count: 0, percentage: 0 },
    { range: '3-4', min: 3, max: 4, count: 0, percentage: 0 },
    { range: '4-5', min: 4, max: 5, count: 0, percentage: 0 },
    { range: '5+', min: 5, max: 10, count: 0, percentage: 0 },
  ];
  
  for (const eq of earthquakes) {
    for (const bucket of buckets) {
      if (eq.magnitude >= bucket.min && eq.magnitude < bucket.max) {
        bucket.count++;
        break;
      }
      // Handle 5+ case
      if (bucket.range === '5+' && eq.magnitude >= 5) {
        bucket.count++;
        break;
      }
    }
  }
  
  const total = earthquakes.length;
  for (const bucket of buckets) {
    bucket.percentage = total > 0 ? (bucket.count / total) * 100 : 0;
  }
  
  return buckets;
}

// Get statistics for each region
export function getRegionStats(earthquakes: Earthquake[]): RegionStats[] {
  const stats: RegionStats[] = [];
  
  for (const region of REGIONS) {
    const regionEqs = earthquakes.filter(eq => eq.region === region.id);
    
    if (regionEqs.length === 0) {
      stats.push({
        regionId: region.id,
        totalCount: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        avgDepth: 0,
        swarmCount: 0,
        earthquakesPerYear: 0,
        lastActivity: new Date(0),
      });
      continue;
    }
    
    const magnitudes = regionEqs.map(eq => eq.magnitude);
    const depths = regionEqs.map(eq => eq.depth);
    const times = regionEqs.map(eq => eq.timestamp);
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const yearSpan = (maxTime - minTime) / (1000 * 60 * 60 * 24 * 365) || 1;
    
    const swarms = detectSwarms(regionEqs);
    
    stats.push({
      regionId: region.id,
      totalCount: regionEqs.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      swarmCount: swarms.length,
      earthquakesPerYear: regionEqs.length / yearSpan,
      lastActivity: new Date(maxTime),
    });
  }
  
  return stats;
}

// Find the biggest earthquake
export function findBiggestEarthquake(earthquakes: Earthquake[]): Earthquake | null {
  if (earthquakes.length === 0) return null;
  return earthquakes.reduce((max, eq) => 
    eq.magnitude > max.magnitude ? eq : max
  );
}

// Get recent activity (last N days)
export function getRecentActivity(
  earthquakes: Earthquake[],
  days: number = 7
): Earthquake[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return earthquakes.filter(eq => eq.timestamp >= cutoff)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Get magnitude color for visual representation
// Using distinct colors for better visibility: red (critical) -> orange (high) -> yellow (moderate) -> green (minor)
export function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 5) return '#ef4444'; // red-500 - critical/major
  if (magnitude >= 4) return '#f97316'; // orange-500 - strong
  if (magnitude >= 3) return '#eab308'; // yellow-500 - moderate
  if (magnitude >= 2) return '#22c55e'; // green-500 - minor
  if (magnitude >= 1) return '#10b981'; // emerald-500 - micro
  return '#6b7280'; // gray-500 - trace
}

// Get magnitude severity label
export function getMagnitudeLabel(magnitude: number): string {
  if (magnitude >= 7) return 'Major';
  if (magnitude >= 6) return 'Strong';
  if (magnitude >= 5) return 'Moderate';
  if (magnitude >= 4) return 'Light';
  if (magnitude >= 3) return 'Minor';
  if (magnitude >= 2) return 'Micro';
  return 'Trace';
}

// Calculate if felt
export function wasLikelyFelt(magnitude: number, depth: number): boolean {
  // Generally earthquakes M2.5+ can be felt, but depth matters
  // Shallow quakes are more likely to be felt
  const depthFactor = depth < 10 ? 0.3 : depth < 20 ? 0.5 : 0.8;
  return magnitude >= 2.5 - depthFactor;
}

