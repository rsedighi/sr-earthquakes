// Core earthquake data types
export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: Date;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  felt: number | null;
  significance: number;
  url: string;
  region: string;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  color: string;
  faultLine: string;
}

export interface SwarmEvent {
  id: string;
  startTime: Date;
  endTime: Date;
  earthquakes: Earthquake[];
  peakMagnitude: number;
  totalCount: number;
  region: string;
  centerLat: number;
  centerLon: number;
}

export interface TimeSeriesPoint {
  date: Date;
  timestamp: number;
  count: number;
  maxMagnitude: number;
  avgMagnitude: number;
  cumulativeEnergy: number;
}

export interface MagnitudeBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface RegionStats {
  regionId: string;
  totalCount: number;
  avgMagnitude: number;
  maxMagnitude: number;
  avgDepth: number;
  swarmCount: number;
  earthquakesPerYear: number;
  lastActivity: Date;
}

// USGS API types
export interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    felt: number | null;
    sig: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

export interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

