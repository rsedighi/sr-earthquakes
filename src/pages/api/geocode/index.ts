import type { APIRoute } from 'astro';

// Bay Area bounding box
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -123.0,
  maxLon: -121.0,
};

const BAY_AREA_CENTER = { lat: 37.7749, lon: -122.4194 };

interface GeocodingResult {
  display_name: string;
  short_name: string;
  lat: number;
  lon: number;
  type: string;
}

function isInBayArea(lat: number, lon: number): boolean {
  return (
    lat >= BAY_AREA_BOUNDS.minLat &&
    lat <= BAY_AREA_BOUNDS.maxLat &&
    lon >= BAY_AREA_BOUNDS.minLon &&
    lon <= BAY_AREA_BOUNDS.maxLon
  );
}

/**
 * GET /api/geocode?q=...
 * Provider priority: Mapbox (if MAPBOX_ACCESS_TOKEN configured) → Photon → Nominatim.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q');
  if (!query || query.length < 2) {
    return Response.json({ results: [] });
  }

  // Pull token from CF env first, fall back to process.env for dev.
  const env = (locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env ?? {};
  const mapboxKey =
    env.MAPBOX_ACCESS_TOKEN ??
    (typeof process !== 'undefined' ? process.env?.MAPBOX_ACCESS_TOKEN : undefined);

  try {
    if (mapboxKey) {
      const results = await searchWithMapbox(query, mapboxKey);
      if (results.length > 0) {
        return Response.json({ results, provider: 'mapbox' });
      }
    }

    const photonResults = await searchWithPhoton(query);
    if (photonResults.length > 0) {
      return Response.json({ results: photonResults, provider: 'photon' });
    }

    const nominatimResults = await searchWithNominatim(query);
    return Response.json({ results: nominatimResults, provider: 'nominatim' });
  } catch (err) {
    console.error('[api/geocode GET]', err);
    return Response.json({ results: [], error: 'Geocoding failed' }, { status: 500 });
  }
};

async function searchWithMapbox(query: string, accessToken: string): Promise<GeocodingResult[]> {
  const bbox = `${BAY_AREA_BOUNDS.minLon},${BAY_AREA_BOUNDS.minLat},${BAY_AREA_BOUNDS.maxLon},${BAY_AREA_BOUNDS.maxLat}`;
  const proximity = `${BAY_AREA_CENTER.lon},${BAY_AREA_CENTER.lat}`;

  const u = new URL(
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json'
  );
  u.searchParams.set('access_token', accessToken);
  u.searchParams.set('bbox', bbox);
  u.searchParams.set('proximity', proximity);
  u.searchParams.set('types', 'address,poi,neighborhood,locality,place');
  u.searchParams.set('country', 'US');
  u.searchParams.set('limit', '8');
  u.searchParams.set('autocomplete', 'true');

  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`);
  const data = await res.json() as {
    features: { place_name: string; text: string; center: [number, number]; place_type: string[] }[];
  };

  return data.features
    .filter(f => isInBayArea(f.center[1], f.center[0]))
    .map(f => ({
      display_name: f.place_name,
      short_name: f.text,
      lat: f.center[1],
      lon: f.center[0],
      type: f.place_type[0] || 'place',
    }));
}

async function searchWithPhoton(query: string): Promise<GeocodingResult[]> {
  const u = new URL('https://photon.komoot.io/api/');
  u.searchParams.set('q', query + ' California');
  u.searchParams.set('lat', BAY_AREA_CENTER.lat.toString());
  u.searchParams.set('lon', BAY_AREA_CENTER.lon.toString());
  u.searchParams.set('limit', '10');
  u.searchParams.set('lang', 'en');

  const res = await fetch(u.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Photon API error: ${res.status}`);

  const data = await res.json() as {
    features: {
      geometry: { coordinates: [number, number] };
      properties: {
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        county?: string;
        state?: string;
        osm_key?: string;
      };
    }[];
  };

  return data.features
    .filter(f => isInBayArea(f.geometry.coordinates[1], f.geometry.coordinates[0]))
    .map(f => {
      const p = f.properties;
      const parts: string[] = [];
      if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
      else if (p.street) parts.push(p.street);
      else if (p.name) parts.push(p.name);
      if (p.city) parts.push(p.city);
      if (p.county && !p.city) parts.push(p.county);
      if (p.state) parts.push(p.state);

      return {
        display_name: parts.join(', ') || p.name || 'Unknown location',
        short_name: p.name || p.street || p.city || 'Unknown',
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        type: p.osm_key || 'place',
      };
    })
    .slice(0, 8);
}

async function searchWithNominatim(query: string): Promise<GeocodingResult[]> {
  const viewbox = `${BAY_AREA_BOUNDS.minLon},${BAY_AREA_BOUNDS.maxLat},${BAY_AREA_BOUNDS.maxLon},${BAY_AREA_BOUNDS.minLat}`;

  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('format', 'json');
  u.searchParams.set('q', query + ', California');
  u.searchParams.set('viewbox', viewbox);
  u.searchParams.set('bounded', '1');
  u.searchParams.set('limit', '8');
  u.searchParams.set('addressdetails', '1');

  const res = await fetch(u.toString(), {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'BayTremor/1.0 (earthquake tracker)',
    },
  });
  if (!res.ok) throw new Error(`Nominatim API error: ${res.status}`);

  const data = await res.json() as {
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: { city?: string; town?: string; village?: string; road?: string };
  }[];

  return data
    .filter(r => isInBayArea(parseFloat(r.lat), parseFloat(r.lon)))
    .map(r => ({
      display_name: r.display_name,
      short_name:
        r.address?.city ||
        r.address?.town ||
        r.address?.village ||
        r.address?.road ||
        r.display_name.split(',')[0],
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      type: r.type || 'place',
    }));
}
