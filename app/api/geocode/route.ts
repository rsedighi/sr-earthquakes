import { NextRequest, NextResponse } from 'next/server';

// Bay Area bounding box
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -123.0,
  maxLon: -121.0,
};

// Center of Bay Area for proximity bias
const BAY_AREA_CENTER = {
  lat: 37.7749,
  lon: -122.4194,
};

interface GeocodingResult {
  display_name: string;
  short_name: string;
  lat: number;
  lon: number;
  type: string;
}

/**
 * Fast geocoding API that supports multiple providers.
 * Priorities: Mapbox > Photon > Nominatim (fallback)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }
  
  try {
    // Try Mapbox first if API key is configured
    const mapboxKey = process.env.MAPBOX_ACCESS_TOKEN;
    if (mapboxKey) {
      const results = await searchWithMapbox(query, mapboxKey);
      if (results.length > 0) {
        return NextResponse.json({ results, provider: 'mapbox' });
      }
    }
    
    // Fallback to Photon (fast, free, OSM-based)
    const photonResults = await searchWithPhoton(query);
    if (photonResults.length > 0) {
      return NextResponse.json({ results: photonResults, provider: 'photon' });
    }
    
    // Last resort: Nominatim
    const nominatimResults = await searchWithNominatim(query);
    return NextResponse.json({ results: nominatimResults, provider: 'nominatim' });
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ results: [], error: 'Geocoding failed' }, { status: 500 });
  }
}

/**
 * Mapbox Search API - Fast, reliable, great autocomplete
 * Free tier: 100,000 requests/month
 */
async function searchWithMapbox(query: string, accessToken: string): Promise<GeocodingResult[]> {
  const bbox = `${BAY_AREA_BOUNDS.minLon},${BAY_AREA_BOUNDS.minLat},${BAY_AREA_BOUNDS.maxLon},${BAY_AREA_BOUNDS.maxLat}`;
  const proximity = `${BAY_AREA_CENTER.lon},${BAY_AREA_CENTER.lat}`;
  
  const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('proximity', proximity);
  url.searchParams.set('types', 'address,poi,neighborhood,locality,place');
  url.searchParams.set('country', 'US');
  url.searchParams.set('limit', '8');
  url.searchParams.set('autocomplete', 'true');
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.features
    .filter((feature: { center: number[] }) => isInBayArea(feature.center[1], feature.center[0]))
    .map((feature: { place_name: string; text: string; center: number[]; place_type: string[] }) => ({
      display_name: feature.place_name,
      short_name: feature.text,
      lat: feature.center[1],
      lon: feature.center[0],
      type: feature.place_type[0] || 'place',
    }));
}

/**
 * Photon API - Fast, free, OSM-based (by Komoot)
 * Much faster than Nominatim, great for autocomplete
 */
async function searchWithPhoton(query: string): Promise<GeocodingResult[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query + ' California');
  url.searchParams.set('lat', BAY_AREA_CENTER.lat.toString());
  url.searchParams.set('lon', BAY_AREA_CENTER.lon.toString());
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'en');
  // Restrict to addresses, streets, cities
  url.searchParams.set('osm_tag', 'place');
  
  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Photon API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.features
    .filter((feature: { geometry: { coordinates: number[] } }) => 
      isInBayArea(feature.geometry.coordinates[1], feature.geometry.coordinates[0])
    )
    .map((feature: { 
      geometry: { coordinates: number[] }; 
      properties: { 
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        county?: string;
        state?: string;
        osm_key?: string;
      } 
    }) => {
      const props = feature.properties;
      const parts = [];
      
      // Build readable address
      if (props.housenumber && props.street) {
        parts.push(`${props.housenumber} ${props.street}`);
      } else if (props.street) {
        parts.push(props.street);
      } else if (props.name) {
        parts.push(props.name);
      }
      
      if (props.city) parts.push(props.city);
      if (props.county && !props.city) parts.push(props.county);
      if (props.state) parts.push(props.state);
      
      const displayName = parts.join(', ') || props.name || 'Unknown location';
      const shortName = props.name || props.street || props.city || 'Unknown';
      
      return {
        display_name: displayName,
        short_name: shortName,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        type: props.osm_key || 'place',
      };
    })
    .slice(0, 8);
}

/**
 * Nominatim API - Free, but slow and rate-limited
 * Use as last resort fallback only
 */
async function searchWithNominatim(query: string): Promise<GeocodingResult[]> {
  const viewbox = `${BAY_AREA_BOUNDS.minLon},${BAY_AREA_BOUNDS.maxLat},${BAY_AREA_BOUNDS.maxLon},${BAY_AREA_BOUNDS.minLat}`;
  
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query + ', California');
  url.searchParams.set('viewbox', viewbox);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('addressdetails', '1');
  
  const response = await fetch(url.toString(), {
    headers: { 
      'Accept-Language': 'en',
      'User-Agent': 'BayTremor/1.0 (earthquake tracker)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data
    .filter((result: { lat: string; lon: string }) => 
      isInBayArea(parseFloat(result.lat), parseFloat(result.lon))
    )
    .map((result: { 
      display_name: string; 
      lat: string; 
      lon: string; 
      type: string;
      address?: { city?: string; town?: string; village?: string; road?: string };
    }) => ({
      display_name: result.display_name,
      short_name: result.address?.city || result.address?.town || result.address?.village || result.address?.road || result.display_name.split(',')[0],
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      type: result.type || 'place',
    }));
}

function isInBayArea(lat: number, lon: number): boolean {
  return (
    lat >= BAY_AREA_BOUNDS.minLat &&
    lat <= BAY_AREA_BOUNDS.maxLat &&
    lon >= BAY_AREA_BOUNDS.minLon &&
    lon <= BAY_AREA_BOUNDS.maxLon
  );
}
