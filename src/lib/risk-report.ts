/**
 * Home Seismic Risk Report engine — server-side, built on authoritative state
 * and federal data instead of the retired client-side point score.
 *
 * Sources queried live (all public, no API key):
 *  • CGS Earthquake Zones of Required Investigation — liquefaction, earthquake-
 *    induced landslide, and Alquist-Priolo fault rupture zones. These are the
 *    exact regulatory zones sellers must disclose in CA real-estate deals.
 *  • CGS "unevaluated areas" layer — distinguishes "not in a zone" from
 *    "the state has not mapped this quadrangle yet".
 *  • USGS Quaternary Fault database (CA subset) — precise fault traces with
 *    activity age and slip rate, for nearest-fault distance.
 *  • CA tsunami hazard areas (coastal addresses).
 *
 * Every fact in the report carries a source so the UI can cite it. The band is
 * a transparent rule stack over those facts, not a synthetic 0-100 number.
 */
import type { Earthquake } from './types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskBand = 'Moderate' | 'High' | 'Very High';

export type ZoneStatus = 'in-zone' | 'not-in-zone' | 'not-evaluated' | 'unavailable';

export interface ZoneFinding {
  status: ZoneStatus;
  /** CGS 7.5' quadrangle the parcel falls in, when known. */
  quadName?: string;
  /** Official CGS zone map (PDF) covering this location. */
  mapUrl?: string;
  /** Official CGS seismic hazard / fault evaluation report. */
  reportUrl?: string;
  /** Zone map release date (YYYY-MM-DD). */
  released?: string;
}

export interface NearestFaultFinding {
  status: 'found' | 'none-within-radius' | 'unavailable';
  name?: string;
  section?: string;
  distanceKm?: number;
  /** USGS activity age class, e.g. "historic", "latest Quaternary". */
  age?: string;
  slipRate?: string;
  faultUrl?: string;
}

export interface QuakeHistoryFinding {
  status: 'found' | 'unavailable';
  radiusKm: number;
  totalCount?: number;
  feltCount?: number;
  largest?: { magnitude: number; place: string; timestamp: number; felt: number | null };
  mostFelt?: { magnitude: number; place: string; timestamp: number; felt: number };
  /** Earliest year covered by the dataset near this point. */
  sinceYear?: number;
}

export interface RiskReport {
  band: RiskBand;
  /** Machine-readable reasons that produced the band, in display order. */
  reasons: string[];
  nearestFault: NearestFaultFinding;
  faultRuptureZone: ZoneFinding;
  liquefactionZone: ZoneFinding;
  landslideZone: ZoneFinding;
  tsunamiZone: ZoneFinding;
  quakeHistory: QuakeHistoryFinding;
  /** Rounded coordinates the report was computed for. */
  location: { lat: number; lon: number };
  generatedAt: number;
}

// ── Data sources ──────────────────────────────────────────────────────────────

const AGOL_BASE = 'https://services2.arcgis.com/zr3KAIbsRSUyARHG/ArcGIS/rest/services';

const SERVICES = {
  liquefaction: `${AGOL_BASE}/CGS_Liquefaction_Zones/FeatureServer/0`,
  landslide: `${AGOL_BASE}/CGS_Landslide_Zones/FeatureServer/0`,
  apZones: `${AGOL_BASE}/CGS_Alquist_Priolo_Fault_Zones/FeatureServer/0`,
  unevaluated: `${AGOL_BASE}/CGS_SHZ_Unevaluated_Areas/FeatureServer/0`,
  qfaults: `${AGOL_BASE}/QFaults_CA/FeatureServer/0`,
  tsunami: `${AGOL_BASE}/CA_Tsunami_Hazard_Area/FeatureServer/0`,
} as const;

/** Radius used both for the fault search and the quake-history summary. */
export const FAULT_SEARCH_RADIUS_KM = 30;
export const HISTORY_RADIUS_KM = 25;

const FETCH_TIMEOUT_MS = 8_000;

// ── ArcGIS helpers ────────────────────────────────────────────────────────────

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: { paths?: [number, number][][] };
}

async function arcgisQuery(
  layerUrl: string,
  lat: number,
  lon: number,
  params: Record<string, string>,
): Promise<ArcGisFeature[]> {
  const u = new URL(`${layerUrl}/query`);
  u.searchParams.set('geometry', `${lon},${lat}`);
  u.searchParams.set('geometryType', 'esriGeometryPoint');
  u.searchParams.set('inSR', '4326');
  u.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  u.searchParams.set('f', 'json');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  const res = await fetch(u.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ArcGIS ${res.status} for ${layerUrl}`);
  const data = (await res.json()) as { features?: ArcGisFeature[]; error?: { message?: string } };
  if (data.error) throw new Error(`ArcGIS error: ${data.error.message ?? 'unknown'}`);
  return data.features ?? [];
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

/** Intersect-a-polygon-layer query → ZoneFinding. */
async function queryZone(layerUrl: string, lat: number, lon: number): Promise<ZoneFinding> {
  // Field names differ per layer (e.g. RELEASED vs ZN_RELEASED on the
  // Alquist-Priolo layer, and the tsunami layer has none of them), and ArcGIS
  // errors on unknown outFields — request everything and map defensively.
  const features = await arcgisQuery(layerUrl, lat, lon, {
    outFields: '*',
    returnGeometry: 'false',
  });
  if (features.length === 0) return { status: 'not-in-zone' };
  const a = features[0].attributes;
  return {
    status: 'in-zone',
    quadName: str(a.QUAD_NAME),
    mapUrl: str(a.GEOPDFLINK),
    reportUrl: str(a.REPORTLINK),
    released: str(a.RELEASED) ?? str(a.ZN_RELEASED),
  };
}

/**
 * The tsunami layer tiles whole counties with an `Evacuate` attribute — every
 * point intersects a polygon, so zone membership comes from the attribute, not
 * the intersection itself.
 */
async function queryTsunamiZone(lat: number, lon: number): Promise<ZoneFinding> {
  const features = await arcgisQuery(SERVICES.tsunami, lat, lon, {
    outFields: 'Evacuate,Map_Link',
    returnGeometry: 'false',
  });
  if (features.length === 0) return { status: 'not-evaluated' };
  const a = features[0].attributes;
  const inZone = (str(a.Evacuate) ?? '').toLowerCase().startsWith('yes');
  return {
    status: inZone ? 'in-zone' : 'not-in-zone',
    mapUrl: str(a.Map_Link),
  };
}

// ── Geometry ──────────────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Shortest distance (km) from a point to a segment, using an equirectangular
 * projection local to the point — accurate at Bay Area scale.
 */
function distanceToSegmentKm(
  lat: number, lon: number,
  aLat: number, aLon: number,
  bLat: number, bLon: number,
): number {
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos(toRad(lat));

  const px = (lon - aLon) * kmPerDegLon;
  const py = (lat - aLat) * kmPerDegLat;
  const bx = (bLon - aLon) * kmPerDegLon;
  const by = (bLat - aLat) * kmPerDegLat;

  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) return Math.hypot(px, py);

  let t = (px * bx + py * by) / segLenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - t * bx, py - t * by);
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Nearest fault ─────────────────────────────────────────────────────────────

/**
 * USGS Quaternary fault sections within FAULT_SEARCH_RADIUS_KM, reduced to the
 * single nearest fault (by name). Geometry is server-simplified (~100m offset)
 * which keeps payloads small; distance error from simplification is well under
 * the honesty threshold of a rounded 0.1 km figure at these scales.
 */
async function queryNearestFault(lat: number, lon: number): Promise<NearestFaultFinding> {
  const features = await arcgisQuery(SERVICES.qfaults, lat, lon, {
    distance: String(FAULT_SEARCH_RADIUS_KM),
    units: 'esriSRUnit_Kilometer',
    outFields: 'fault_name,sec_name,age,slip_rate,fault_url',
    returnGeometry: 'true',
    outSR: '4326',
    maxAllowableOffset: '0.001',
    resultRecordCount: '2000',
  });

  if (features.length === 0) return { status: 'none-within-radius' };

  let best: NearestFaultFinding & { distanceKm: number } | null = null;
  for (const f of features) {
    const paths = f.geometry?.paths ?? [];
    let min = Infinity;
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const [aLon, aLat] = path[i];
        const [bLon, bLat] = path[i + 1];
        const d = distanceToSegmentKm(lat, lon, aLat, aLon, bLat, bLon);
        if (d < min) min = d;
      }
      // Single-vertex path degenerates to a point.
      if (path.length === 1) {
        const [pLon, pLat] = path[0];
        min = Math.min(min, distanceKm(lat, lon, pLat, pLon));
      }
    }
    if (!Number.isFinite(min)) continue;
    if (!best || min < best.distanceKm) {
      const a = f.attributes;
      best = {
        status: 'found',
        name: str(a.fault_name),
        section: str(a.sec_name),
        distanceKm: min,
        age: str(a.age),
        slipRate: str(a.slip_rate),
        faultUrl: str(a.fault_url),
      };
    }
  }

  return best ?? { status: 'none-within-radius' };
}

/** Activity ages that count as "active" for the risk band. */
function isActiveFault(age: string | undefined): boolean {
  if (!age) return false;
  const a = age.toLowerCase();
  return a.includes('historic') || a.includes('latest quaternary');
}

// ── Quake history summary ─────────────────────────────────────────────────────

export function summarizeQuakeHistory(
  lat: number,
  lon: number,
  earthquakes: Earthquake[],
): QuakeHistoryFinding {
  const within = earthquakes.filter(
    eq => distanceKm(lat, lon, eq.latitude, eq.longitude) <= HISTORY_RADIUS_KM,
  );
  if (within.length === 0) {
    return { status: 'found', radiusKm: HISTORY_RADIUS_KM, totalCount: 0, feltCount: 0 };
  }

  const felt = within.filter(eq => (eq.felt ?? 0) > 0);
  const largest = within.reduce((m, eq) => (eq.magnitude > m.magnitude ? eq : m));
  const mostFelt = felt.length > 0
    ? felt.reduce((m, eq) => ((eq.felt ?? 0) > (m.felt ?? 0) ? eq : m))
    : null;
  const earliest = within.reduce((m, eq) => Math.min(m, eq.timestamp), Infinity);

  return {
    status: 'found',
    radiusKm: HISTORY_RADIUS_KM,
    totalCount: within.length,
    feltCount: felt.length,
    largest: {
      magnitude: largest.magnitude,
      place: largest.place,
      timestamp: largest.timestamp,
      felt: largest.felt,
    },
    mostFelt: mostFelt
      ? {
          magnitude: mostFelt.magnitude,
          place: mostFelt.place,
          timestamp: mostFelt.timestamp,
          felt: mostFelt.felt ?? 0,
        }
      : undefined,
    sinceYear: new Date(earliest).getFullYear(),
  };
}

// ── Band derivation ───────────────────────────────────────────────────────────

/**
 * Transparent rule stack. The Bay Area baseline is Moderate — USGS puts the
 * regional odds of a M6.7+ quake by 2043 at ~72%, so no Bay Area address is
 * "Low". Site-specific state findings escalate from there:
 *   • Alquist-Priolo zone, or an active fault within 1 km   → Very High
 *   • active fault within 8 km, or 2+ CGS ground-failure zones → High (+1 each)
 *   • liquefaction or landslide zone                          → +1 step
 */
function deriveBand(
  nearestFault: NearestFaultFinding,
  apZone: ZoneFinding,
  liquefaction: ZoneFinding,
  landslide: ZoneFinding,
): { band: RiskBand; reasons: string[] } {
  const reasons: string[] = [];
  let level = 0; // 0 = Moderate, 1 = High, 2+ = Very High

  const activeNearby =
    nearestFault.status === 'found' && isActiveFault(nearestFault.age);

  if (apZone.status === 'in-zone') {
    level += 2;
    reasons.push('Inside a state Alquist-Priolo fault rupture zone');
  } else if (activeNearby && nearestFault.distanceKm! <= 1) {
    level += 2;
    reasons.push(`Active fault (${nearestFault.name}) within 1 km`);
  } else if (activeNearby && nearestFault.distanceKm! <= 8) {
    level += 1;
    reasons.push(`Active fault (${nearestFault.name}) within 8 km`);
  }

  if (liquefaction.status === 'in-zone') {
    level += 1;
    reasons.push('Inside a state-designated liquefaction zone');
  }
  if (landslide.status === 'in-zone') {
    level += 1;
    reasons.push('Inside a state-designated earthquake-induced landslide zone');
  }

  if (reasons.length === 0) {
    reasons.push('Regional Bay Area shaking hazard applies to every address');
  }

  const band: RiskBand = level >= 2 ? 'Very High' : level === 1 ? 'High' : 'Moderate';
  return { band, reasons };
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Compute the full risk report for a coordinate. External layers are queried in
 * parallel; any single source failing degrades that section to 'unavailable'
 * instead of failing the report.
 *
 * @param historicalEarthquakes  Pass the merged R2+D1 dataset when available;
 *                               an empty array marks history 'unavailable'.
 */
export async function computeRiskReport(
  lat: number,
  lon: number,
  historicalEarthquakes: Earthquake[],
): Promise<RiskReport> {
  const [fault, ap, liq, land, uneval, tsu] = await Promise.allSettled([
    queryNearestFault(lat, lon),
    queryZone(SERVICES.apZones, lat, lon),
    queryZone(SERVICES.liquefaction, lat, lon),
    queryZone(SERVICES.landslide, lat, lon),
    queryZone(SERVICES.unevaluated, lat, lon),
    queryTsunamiZone(lat, lon),
  ]);

  const nearestFault: NearestFaultFinding =
    fault.status === 'fulfilled' ? fault.value : { status: 'unavailable' };
  const apZone: ZoneFinding =
    ap.status === 'fulfilled' ? ap.value : { status: 'unavailable' };
  let liquefactionZone: ZoneFinding =
    liq.status === 'fulfilled' ? liq.value : { status: 'unavailable' };
  let landslideZone: ZoneFinding =
    land.status === 'fulfilled' ? land.value : { status: 'unavailable' };
  const tsunamiZone: ZoneFinding =
    tsu.status === 'fulfilled' ? tsu.value : { status: 'unavailable' };

  // If the quad hasn't been evaluated by CGS, "not in zone" is misleading —
  // downgrade those findings to 'not-evaluated'.
  if (uneval.status === 'fulfilled' && uneval.value.status === 'in-zone') {
    if (liquefactionZone.status === 'not-in-zone') {
      liquefactionZone = { status: 'not-evaluated', quadName: uneval.value.quadName };
    }
    if (landslideZone.status === 'not-in-zone') {
      landslideZone = { status: 'not-evaluated', quadName: uneval.value.quadName };
    }
  }

  const quakeHistory: QuakeHistoryFinding =
    historicalEarthquakes.length > 0
      ? summarizeQuakeHistory(lat, lon, historicalEarthquakes)
      : { status: 'unavailable', radiusKm: HISTORY_RADIUS_KM };

  const { band, reasons } = deriveBand(nearestFault, apZone, liquefactionZone, landslideZone);

  return {
    band,
    reasons,
    nearestFault,
    faultRuptureZone: apZone,
    liquefactionZone,
    landslideZone,
    tsunamiZone,
    quakeHistory,
    location: { lat, lon },
    generatedAt: Date.now(),
  };
}
