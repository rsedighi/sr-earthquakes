import { Region } from './types';

// Define the regions of Northern California
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
    color: '#ef5344',
    faultLine: 'Calaveras Fault',
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
    color: '#f59e0b',
    faultLine: 'Hayward Fault',
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
    color: '#8b5cf6',
    faultLine: 'San Andreas Fault',
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
    color: '#10b981',
    faultLine: 'Calaveras Fault',
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
    color: '#06b6d4',
    faultLine: 'Calaveras/San Andreas',
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
    color: '#ec4899',
    faultLine: 'Rodgers Creek Fault',
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

