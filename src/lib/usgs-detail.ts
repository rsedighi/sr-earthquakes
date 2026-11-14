import { getRegionForCoordinates } from '@/lib/regions';

export interface EarthquakeDetail {
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
  url?: string;
  region: string;
}

export async function fetchEarthquakeDetail(id: string, timeoutMs = 5000): Promise<EarthquakeDetail | null> {
  try {
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${encodeURIComponent(id)}.geojson`,
      { signal: AbortSignal.timeout(timeoutMs) }
    );
    if (!response.ok) return null;
    const feature = await response.json() as {
      id: string;
      geometry: { coordinates: [number, number, number] };
      properties: { mag: number; place: string; time: number; felt: number | null; sig: number; url?: string };
    };
    const [longitude, latitude, depth] = feature.geometry.coordinates;
    return {
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
  } catch {
    return null;
  }
}
