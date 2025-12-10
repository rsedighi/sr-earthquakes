import { Region } from './types';

// Define the regions of Northern California with area codes for easy identification
// Using a consistent monochrome palette for a polished, professional look
// IMPORTANT: Regions are checked in ORDER - more specific regions should come before broader ones
export const REGIONS: Region[] = [
  // San Francisco City - Most iconic, check first
  {
    id: 'san-francisco',
    name: 'San Francisco',
    description: 'The City by the Bay, straddling the San Andreas Fault',
    bounds: {
      minLat: 37.708,
      maxLat: 37.833,
      minLon: -122.527,
      maxLon: -122.357,
    },
    color: '#f59e0b', // Amber/gold for SF
    faultLine: 'San Andreas Fault',
    areaCode: '415',
    county: 'San Francisco',
  },
  // Marin County - North of SF, across the Golden Gate
  {
    id: 'marin',
    name: 'Marin / Sausalito / San Rafael',
    description: 'North Bay across the Golden Gate Bridge along the San Andreas Fault',
    bounds: {
      minLat: 37.833,
      maxLat: 38.10,
      minLon: -122.76,
      maxLon: -122.45,
    },
    color: '#10b981', // Emerald green for Marin's nature
    faultLine: 'San Andreas Fault',
    areaCode: '415',
    county: 'Marin',
  },
  // Fremont/Newark/Union City - Important gap filler between Oakland and Santa Clara
  {
    id: 'fremont-newark',
    name: 'Fremont / Newark / Union City',
    description: 'Southern Alameda County along the Hayward Fault',
    bounds: {
      minLat: 37.455,
      maxLat: 37.620,
      minLon: -122.15,
      maxLon: -121.85,
    },
    color: '#06b6d4', // Cyan for this tech corridor
    faultLine: 'Hayward Fault',
    areaCode: '510',
    county: 'Alameda',
  },
  {
    id: 'san-ramon',
    name: 'San Ramon / Dublin / Pleasanton',
    description: 'I-680/I-580 corridor along the Calaveras Fault',
    bounds: {
      minLat: 37.620,
      maxLat: 37.919,
      minLon: -122.109,
      maxLon: -121.70,
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
      minLat: 37.620,
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
      maxLat: 37.708, // Adjusted to meet SF boundary
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
      minLat: 38.10, // Adjusted to not overlap Marin
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
      maxLat: 38.10, // Adjusted boundary
      minLon: -122.48,
      maxLon: -122.20,
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
      maxLon: -121.70, // Extended east to cover more of eastern Contra Costa
    },
    color: '#262626',
    faultLine: 'Concord/Green Valley Fault',
    areaCode: '707',
    county: 'Solano / Contra Costa',
  },
  // Eastern Contra Costa - Antioch, Brentwood, Pittsburg
  {
    id: 'east-contra-costa',
    name: 'Antioch / Brentwood / Pittsburg',
    description: 'Eastern Contra Costa along the Greenville Fault',
    bounds: {
      minLat: 37.85,
      maxLat: 38.05,
      minLon: -121.95,
      maxLon: -121.45,
    },
    color: '#78716c', // Stone color for delta region
    faultLine: 'Greenville Fault',
    areaCode: '925',
    county: 'Contra Costa',
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
// Comprehensive list covering all 9 Bay Area counties + San Benito
export const BAY_AREA_LANDMARKS: Array<{
  name: string;
  lat: number;
  lon: number;
  county: string;
  areaCode: string;
  type: 'city' | 'landmark';
}> = [
  // === SAN FRANCISCO COUNTY (415) ===
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, county: 'San Francisco', areaCode: '415', type: 'city' },
  
  // === MARIN COUNTY (415) ===
  { name: 'Sausalito', lat: 37.8591, lon: -122.4853, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Mill Valley', lat: 37.9060, lon: -122.5450, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'San Rafael', lat: 37.9735, lon: -122.5311, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Novato', lat: 38.1074, lon: -122.5697, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Tiburon', lat: 37.8735, lon: -122.4567, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Larkspur', lat: 37.9341, lon: -122.5353, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Corte Madera', lat: 37.9255, lon: -122.5275, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'San Anselmo', lat: 37.9746, lon: -122.5614, county: 'Marin', areaCode: '415', type: 'city' },
  { name: 'Fairfax', lat: 37.9871, lon: -122.5889, county: 'Marin', areaCode: '415', type: 'city' },
  
  // === ALAMEDA COUNTY (510/925) ===
  { name: 'Oakland', lat: 37.8044, lon: -122.2712, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Berkeley', lat: 37.8716, lon: -122.2727, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Fremont', lat: 37.5485, lon: -121.9886, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Hayward', lat: 37.6688, lon: -122.0808, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'San Leandro', lat: 37.7249, lon: -122.1561, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Alameda', lat: 37.7652, lon: -122.2416, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Union City', lat: 37.5934, lon: -122.0438, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Newark', lat: 37.5316, lon: -122.0400, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Dublin', lat: 37.7022, lon: -121.9358, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Pleasanton', lat: 37.6624, lon: -121.8747, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Livermore', lat: 37.6819, lon: -121.7680, county: 'Alameda', areaCode: '925', type: 'city' },
  { name: 'Castro Valley', lat: 37.6941, lon: -122.0864, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Emeryville', lat: 37.8313, lon: -122.2852, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Albany', lat: 37.8869, lon: -122.2978, county: 'Alameda', areaCode: '510', type: 'city' },
  { name: 'Piedmont', lat: 37.8244, lon: -122.2317, county: 'Alameda', areaCode: '510', type: 'city' },
  
  // === CONTRA COSTA COUNTY (925/510) ===
  { name: 'San Ramon', lat: 37.7799, lon: -121.9780, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Concord', lat: 37.9780, lon: -122.0311, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Walnut Creek', lat: 37.9101, lon: -122.0652, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Danville', lat: 37.8216, lon: -121.9997, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Richmond', lat: 37.9358, lon: -122.3478, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'Antioch', lat: 38.0049, lon: -121.8058, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Pittsburg', lat: 38.0278, lon: -121.8847, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Brentwood', lat: 37.9319, lon: -121.6958, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Martinez', lat: 38.0194, lon: -122.1341, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Pleasant Hill', lat: 37.9480, lon: -122.0608, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Lafayette', lat: 37.8858, lon: -122.1180, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Orinda', lat: 37.8769, lon: -122.1797, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Moraga', lat: 37.8349, lon: -122.1297, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'El Cerrito', lat: 37.9161, lon: -122.3108, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'Hercules', lat: 38.0172, lon: -122.2886, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'Pinole', lat: 38.0044, lon: -122.2989, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'San Pablo', lat: 37.9622, lon: -122.3456, county: 'Contra Costa', areaCode: '510', type: 'city' },
  { name: 'Clayton', lat: 37.9410, lon: -121.9358, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Oakley', lat: 37.9975, lon: -121.7125, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Bay Point', lat: 38.0294, lon: -121.9614, county: 'Contra Costa', areaCode: '925', type: 'city' },
  { name: 'Discovery Bay', lat: 37.9086, lon: -121.6000, county: 'Contra Costa', areaCode: '925', type: 'city' },
  
  // === SAN MATEO COUNTY (650) ===
  { name: 'San Mateo', lat: 37.5630, lon: -122.3255, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Pacifica', lat: 37.6138, lon: -122.4869, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Daly City', lat: 37.6879, lon: -122.4702, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'South San Francisco', lat: 37.6547, lon: -122.4077, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Redwood City', lat: 37.4852, lon: -122.2364, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'San Bruno', lat: 37.6305, lon: -122.4111, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Millbrae', lat: 37.5985, lon: -122.3872, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Burlingame', lat: 37.5841, lon: -122.3660, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'San Carlos', lat: 37.5072, lon: -122.2608, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Belmont', lat: 37.5202, lon: -122.2759, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Foster City', lat: 37.5585, lon: -122.2711, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Menlo Park', lat: 37.4530, lon: -122.1817, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Atherton', lat: 37.4613, lon: -122.1978, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Half Moon Bay', lat: 37.4636, lon: -122.4286, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Brisbane', lat: 37.6808, lon: -122.3999, county: 'San Mateo', areaCode: '650', type: 'city' },
  { name: 'Colma', lat: 37.6769, lon: -122.4600, county: 'San Mateo', areaCode: '650', type: 'city' },
  
  // === SANTA CLARA COUNTY (408/650) ===
  { name: 'San Jose', lat: 37.3382, lon: -121.8863, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Palo Alto', lat: 37.4419, lon: -122.1430, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Mountain View', lat: 37.3861, lon: -122.0839, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Sunnyvale', lat: 37.3688, lon: -122.0363, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Santa Clara', lat: 37.3541, lon: -121.9552, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Milpitas', lat: 37.4323, lon: -121.8996, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Morgan Hill', lat: 37.1305, lon: -121.6544, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Gilroy', lat: 37.0058, lon: -121.5683, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Cupertino', lat: 37.3230, lon: -122.0322, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Campbell', lat: 37.2872, lon: -121.9500, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Los Gatos', lat: 37.2358, lon: -121.9624, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Saratoga', lat: 37.2638, lon: -122.0230, county: 'Santa Clara', areaCode: '408', type: 'city' },
  { name: 'Los Altos', lat: 37.3852, lon: -122.1141, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Los Altos Hills', lat: 37.3796, lon: -122.1375, county: 'Santa Clara', areaCode: '650', type: 'city' },
  { name: 'Monte Sereno', lat: 37.2366, lon: -121.9925, county: 'Santa Clara', areaCode: '408', type: 'city' },
  
  // === SOLANO COUNTY (707) ===
  { name: 'Vallejo', lat: 38.1041, lon: -122.2566, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Benicia', lat: 38.0494, lon: -122.1586, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Fairfield', lat: 38.2494, lon: -122.0400, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Vacaville', lat: 38.3566, lon: -121.9877, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Suisun City', lat: 38.2383, lon: -122.0302, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Dixon', lat: 38.4455, lon: -121.8233, county: 'Solano', areaCode: '707', type: 'city' },
  { name: 'Rio Vista', lat: 38.1555, lon: -121.6925, county: 'Solano', areaCode: '707', type: 'city' },
  
  // === NAPA COUNTY (707) ===
  { name: 'Napa', lat: 38.2975, lon: -122.2869, county: 'Napa', areaCode: '707', type: 'city' },
  { name: 'American Canyon', lat: 38.1749, lon: -122.2608, county: 'Napa', areaCode: '707', type: 'city' },
  { name: 'St. Helena', lat: 38.5052, lon: -122.4702, county: 'Napa', areaCode: '707', type: 'city' },
  { name: 'Yountville', lat: 38.4016, lon: -122.3608, county: 'Napa', areaCode: '707', type: 'city' },
  { name: 'Calistoga', lat: 38.5788, lon: -122.5797, county: 'Napa', areaCode: '707', type: 'city' },
  
  // === SONOMA COUNTY (707) ===
  { name: 'Santa Rosa', lat: 38.4404, lon: -122.7141, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Petaluma', lat: 38.2324, lon: -122.6367, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Rohnert Park', lat: 38.3396, lon: -122.7011, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Cotati', lat: 38.3277, lon: -122.7086, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Healdsburg', lat: 38.6105, lon: -122.8686, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Windsor', lat: 38.5469, lon: -122.8164, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Sebastopol', lat: 38.4022, lon: -122.8239, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Sonoma', lat: 38.2919, lon: -122.4580, county: 'Sonoma', areaCode: '707', type: 'city' },
  { name: 'Cloverdale', lat: 38.8055, lon: -123.0169, county: 'Sonoma', areaCode: '707', type: 'city' },
  
  // === SAN BENITO COUNTY (831) ===
  { name: 'Hollister', lat: 36.8525, lon: -121.4016, county: 'San Benito', areaCode: '831', type: 'city' },
  { name: 'San Juan Bautista', lat: 36.8455, lon: -121.5372, county: 'San Benito', areaCode: '831', type: 'city' },
  
  // === NOTABLE LANDMARKS ===
  { name: 'The Geysers', lat: 38.8, lon: -122.8, county: 'Sonoma/Lake', areaCode: '707', type: 'landmark' },
  { name: 'Mt. Diablo', lat: 37.8816, lon: -121.9142, county: 'Contra Costa', areaCode: '925', type: 'landmark' },
  { name: 'Mt. Hamilton', lat: 37.3414, lon: -121.6425, county: 'Santa Clara', areaCode: '408', type: 'landmark' },
  { name: 'Mt. Tamalpais', lat: 37.9236, lon: -122.5964, county: 'Marin', areaCode: '415', type: 'landmark' },
  { name: 'Point Reyes', lat: 38.0694, lon: -122.8781, county: 'Marin', areaCode: '415', type: 'landmark' },
  { name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, county: 'San Francisco/Marin', areaCode: '415', type: 'landmark' },
  { name: 'Bay Bridge', lat: 37.7983, lon: -122.3778, county: 'San Francisco/Alameda', areaCode: '415', type: 'landmark' },
  { name: 'Lick Observatory', lat: 37.3414, lon: -121.6430, county: 'Santa Clara', areaCode: '408', type: 'landmark' },
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

