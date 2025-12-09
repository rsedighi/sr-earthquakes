import { Region } from './types';

// Define the regions of Northern California with area codes for easy identification
// Using a consistent monochrome palette for a polished, professional look
export const REGIONS: Region[] = [
  {
    id: 'san-ramon',
    name: 'San Ramon / Dublin / Pleasanton',
    description: 'I-680/I-580 corridor along the Calaveras Fault',
    bounds: {
      minLat: 37.635,
      maxLat: 37.919,
      minLon: -122.109,
      maxLon: -121.845,
    },
    color: '#ffffff',
    faultLine: 'Calaveras Fault',
    areaCode: '925',
    county: 'Contra Costa / Alameda',
  },
  {
    id: 'berkeley-oakland',
    name: 'Berkeley / Oakland / Piedmont',
    description: 'Western East Bay along the Hayward Fault',
    bounds: {
      minLat: 37.772,
      maxLat: 38.071,
      minLon: -122.439,
      maxLon: -122.047,
    },
    color: '#e5e5e5',
    faultLine: 'Hayward Fault',
    areaCode: '510',
    county: 'Alameda',
  },
  {
    id: 'sf-peninsula',
    name: 'SF Peninsula / Millbrae / Pacifica',
    description: 'Peninsula along the San Andreas Fault',
    bounds: {
      minLat: 37.317,
      maxLat: 37.818,
      minLon: -122.533,
      maxLon: -122.066,
    },
    color: '#d4d4d4',
    faultLine: 'San Andreas Fault',
    areaCode: '650',
    county: 'San Mateo',
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara / San Jose / Morgan Hill',
    description: 'South Bay along the Calaveras Fault',
    bounds: {
      minLat: 36.95,
      maxLat: 37.455,
      minLon: -122.44,
      maxLon: -121.632,
    },
    color: '#a3a3a3',
    faultLine: 'Calaveras Fault',
    areaCode: '408',
    county: 'Santa Clara',
  },
  {
    id: 'gilroy-south',
    name: 'Gilroy / Hollister / South Valley',
    description: 'Southern Santa Clara County',
    bounds: {
      minLat: 36.763,
      maxLat: 37.455,
      minLon: -122.113,
      maxLon: -121.443,
    },
    color: '#737373',
    faultLine: 'Calaveras/San Andreas',
    areaCode: '831',
    county: 'Santa Clara / San Benito',
  },
  {
    id: 'sonoma-north',
    name: 'Sonoma / Napa / North Bay',
    description: 'Wine Country along the Rodgers Creek Fault',
    bounds: {
      minLat: 37.81,
      maxLat: 38.66,
      minLon: -123.069,
      maxLon: -122.421,
    },
    color: '#525252',
    faultLine: 'Rodgers Creek Fault',
    areaCode: '707',
    county: 'Sonoma / Napa',
  },
  {
    id: 'richmond-hercules',
    name: 'Richmond / Hercules / Pinole',
    description: 'Northern Contra Costa along the Hayward Fault',
    bounds: {
      minLat: 37.88,
      maxLat: 38.05,
      minLon: -122.48,
      maxLon: -122.25,
    },
    color: '#404040',
    faultLine: 'Hayward Fault',
    areaCode: '510',
    county: 'Contra Costa',
  },
  {
    id: 'vallejo-benicia',
    name: 'Vallejo / Benicia / Martinez',
    description: 'Carquinez Strait area along multiple fault systems',
    bounds: {
      minLat: 38.0,
      maxLat: 38.25,
      minLon: -122.45,
      maxLon: -122.05,
    },
    color: '#262626',
    faultLine: 'Concord/Green Valley Fault',
    areaCode: '707',
    county: 'Solano / Contra Costa',
  },
];

// All of Northern California for broader context
export const NORCAL_BOUNDS = {
  minLat: 36.5,
  maxLat: 39.0,
  minLon: -123.5,
  maxLon: -121.0,
  center: { lat: 37.75, lon: -122.25 },
};

// Bay Area proper (9 counties) - excludes areas like The Geysers
export const BAY_AREA_BOUNDS = {
  minLat: 36.9,   // Southern Santa Clara County
  maxLat: 38.35,  // Northern Solano/Napa (excludes The Geysers at ~38.75)
  minLon: -123.0, // Pacific coast
  maxLon: -121.4, // Eastern Contra Costa/Alameda
  center: { lat: 37.75, lon: -122.25 },
};

// Major cities/landmarks for location context with area codes
export const BAY_AREA_LANDMARKS: Array<{
  name: string;
  lat: number;
  lon: number;
  county: string;
  areaCode: string;
  type: 'city' | 'landmark';
}> = [
  // Major Cities with their area codes
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, county: 'San Francisco', areaCode: '415', type: 'city' },
  { name: 'Oakland', lat: 37.8044, lon: -122.2712, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Berkeley', lat: 37.8716, lon: -122.2727, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'San Ramon', lat: 37.7799, lon: -121.9780, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Dublin', lat: 37.7022, lon: -121.9358, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Pleasanton', lat: 37.6624, lon: -121.8747, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Fremont', lat: 37.5485, lon: -121.9886, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Hayward', lat: 37.6688, lon: -122.0808, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Concord', lat: 37.9780, lon: -122.0311, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Walnut Creek', lat: 37.9101, lon: -122.0652, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Danville', lat: 37.8216, lon: -121.9997, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Livermore', lat: 37.6819, lon: -121.7680, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Richmond', lat: 37.9358, lon: -122.3478, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'Vallejo', lat: 38.1041, lon: -122.2566, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Napa', lat: 38.2975, lon: -122.2869, county: 'Napa', areaCode: '707', type: 'city' },
  { name: 'Santa Rosa', lat: 38.4404, lon: -122.7141, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'San Mateo', lat: 37.5630, lon: -122.3255, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Palo Alto', lat: 37.4419, lon: -122.1430, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Mountain View', lat: 37.3861, lon: -122.0839, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Sunnyvale', lat: 37.3688, lon: -122.0363, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Santa Clara', lat: 37.3541, lon: -121.9552, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Morgan Hill', lat: 37.1305, lon: -121.6544, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Gilroy', lat: 37.0058, lon: -121.5683, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Hollister', lat: 36.8525, lon: -121.4016, county: 'San Benito', areaCode: '831', type: 'city' },
  { name: 'Pacifica', lat: 37.6138, lon: -122.4869, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Daly City', lat: 37.6879, lon: -122.4702, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'San Leandro', lat: 37.7249, lon: -122.1561, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Union City', lat: 37.5934, lon: -122.0438, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Milpitas', lat: 37.4323, lon: -121.8996, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Antioch', lat: 38.0049, lon: -121.8058, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Pittsburg', lat: 38.0278, lon: -121.8847, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Brentwood', lat: 37.9319, lon: -121.6958, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Martinez', lat: 38.0194, lon: -122.1341, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Benicia', lat: 38.0494, lon: -122.1586, county: 'Solano', areaCode: '707', type: 'city' },
  // Notable locations/landmarks
  { name: 'The Geysers', lat: 38.8, lon: -122.8, county: 'Sonoma/Lake', areaCode: '707', type: 'landmark' },
  { name: 'Mt. Diablo', lat: 37.8816, lon: -121.9142, county: 'Contra Costa', areaCode: '925', type: 'landmark' },
  { name: 'Mt. Hamilton', lat: 37.3414, lon: -121.6425, county: 'Santa Clara', areaCode: '408', type: 'landmark' },
];

// Assign a region to an earthquake based on coordinates
export function getRegionForCoordinates(lat: number, lon: number): string {
  for (const region of REGIONS) {
    const { minLat, maxLat, minLon, maxLon } = region.bounds;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return region.id;
    }
  }
  return 'unknown';
}

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}

export function getRegionColor(regionId: string): string {
  return getRegionById(regionId)?.color ?? '#6b7280';
}

export function getRegionName(regionId: string): string {
  return getRegionById(regionId)?.name ?? 'Unknown Region';
}

export function getRegionAreaCode(regionId: string): string {
  return getRegionById(regionId)?.areaCode ?? '';
}

export function getRegionCounty(regionId: string): string {
  return getRegionById(regionId)?.county ?? '';
}

// Check if coordinates are within the Bay Area proper
export function isInBayArea(lat: number, lon: number): boolean {
  return lat >= BAY_AREA_BOUNDS.minLat && 
         lat <= BAY_AREA_BOUNDS.maxLat && 
         lon >= BAY_AREA_BOUNDS.minLon && 
         lon <= BAY_AREA_BOUNDS.maxLon;
}

// Calculate distance between two points using Haversine formula (returns km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Convert km to miles
function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Find the nearest city to given coordinates
export function getNearestCity(lat: number, lon: number): {
  name: string;
  county: string;
  distance: number; // in miles
  direction: string;
} | null {
  const cities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  
  let nearest: typeof cities[0] | null = null;
  let minDistance = Infinity;
  
  for (const city of cities) {
    const distance = haversineDistance(lat, lon, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }
  
  if (!nearest) return null;
  
  // Calculate direction
  const dLon = nearest.lon - lon;
  const dLat = nearest.lat - lat;
  let direction = '';
  
  if (Math.abs(dLat) > 0.01 || Math.abs(dLon) > 0.01) {
    if (dLat > 0.01) direction += 'S';
    else if (dLat < -0.01) direction += 'N';
    
    if (dLon > 0.01) direction += 'W';
    else if (dLon < -0.01) direction += 'E';
  }
  
  // Reverse direction (we want direction FROM city TO earthquake)
  const reverseDir: Record<string, string> = {
    'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E',
    'NE': 'SW', 'NW': 'SE', 'SE': 'NW', 'SW': 'NE'
  };
  
  return {
    name: nearest.name,
    county: nearest.county,
    distance: Math.round(kmToMiles(minDistance) * 10) / 10,
    direction: reverseDir[direction] || direction,
  };
}

// Get enhanced location info for an earthquake
export interface LocationContext {
  nearestCity: string;
  county: string;
  distanceMiles: number;
  direction: string;
  formattedLocation: string;
  region: Region | undefined;
  isInBayArea: boolean;
}

export function getLocationContext(lat: number, lon: number): LocationContext {
  const region = REGIONS.find(r => {
    const { minLat, maxLat, minLon, maxLon } = r.bounds;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
  });
  
  const nearestCityInfo = getNearestCity(lat, lon);
  const inBayArea = isInBayArea(lat, lon);
  
  let formattedLocation = '';
  if (nearestCityInfo) {
    if (nearestCityInfo.distance < 1) {
      formattedLocation = `Near ${nearestCityInfo.name}`;
    } else {
      const dirText = nearestCityInfo.direction ? `${nearestCityInfo.direction} of ` : 'near ';
      formattedLocation = `${nearestCityInfo.distance} mi ${dirText}${nearestCityInfo.name}`;
    }
    formattedLocation += ` (${nearestCityInfo.county} County)`;
  }
  
  return {
    nearestCity: nearestCityInfo?.name ?? 'Unknown',
    county: nearestCityInfo?.county ?? region?.county ?? 'Unknown',
    distanceMiles: nearestCityInfo?.distance ?? 0,
    direction: nearestCityInfo?.direction ?? '',
    formattedLocation,
    region,
    isInBayArea: inBayArea,
  };
}

