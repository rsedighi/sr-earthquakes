/**
 * Home Seismic Risk Score engine.
 *
 * Pure, dependency-free scoring used by the "My Area" experience to turn a
 * geocoded address into a personalized, shareable risk profile. The score is
 * the value-exchange hook that justifies capturing a qualified lead.
 *
 * The model is intentionally transparent and explainable — every point is
 * attributable to a named factor so the UI (and the user) can see *why* a home
 * scored the way it did. It is a relative-exposure indicator for the Bay Area,
 * not a probabilistic USGS hazard forecast.
 */
import faultData from './bay-area-faults.json';
import type { Earthquake } from './types';

export type RiskBand = 'Low' | 'Moderate' | 'High' | 'Very High';

export interface NearestFault {
  id: string;
  name: string;
  distanceKm: number;
  risk: 'Very High' | 'High' | 'Moderate';
  lastMajor: { year: number; magnitude: number; location: string };
}

export interface RiskFactor {
  /** Stable key for analytics / UI. */
  key: 'fault-proximity' | 'historical-felt' | 'max-magnitude' | 'recency';
  label: string;
  /** Points this factor contributed to the 0-100 score. */
  points: number;
  /** Max points this factor can contribute (for weighting bars). */
  maxPoints: number;
  detail: string;
}

export interface RiskScore {
  /** 0-100 relative seismic exposure score. */
  score: number;
  band: RiskBand;
  nearestFault: NearestFault | null;
  factors: RiskFactor[];
  /** Short headline suitable for a card, e.g. "High Exposure". */
  headline: string;
  /** One-sentence plain-language summary. */
  summary: string;
  /** Supporting stats surfaced alongside the score. */
  stats: {
    feltNearbyCount: number;
    maxMagnitudeNearby: number;
    quakesWithinRadius: number;
  };
}

interface FaultFeature {
  properties: {
    name: string;
    id: string;
    risk: 'Very High' | 'High' | 'Moderate';
    lastMajor: { year: number; magnitude: number; location: string };
  };
  geometry: { type: string; coordinates: [number, number][] };
}

// ── Weighting ─────────────────────────────────────────────────────────────────
// Points sum to 100. Fault proximity dominates because distance-to-fault is the
// strongest driver of ground shaking; historical felt activity and recency add
// lived-experience signal.
const WEIGHTS = {
  faultProximity: 45,
  historicalFelt: 25,
  maxMagnitude: 20,
  recency: 10,
} as const;

// Radius (km) used to gather "nearby" historical quakes for the personal score.
const NEARBY_RADIUS_KM = 40;

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine great-circle distance in km. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Shortest distance (km) from a point to a poly-line segment on the sphere.
 * Uses an equirectangular projection local to the point — accurate at Bay Area
 * scale where segment lengths are small relative to Earth's radius.
 */
function distanceToSegmentKm(
  lat: number,
  lon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
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

  const closestX = t * bx;
  const closestY = t * by;
  return Math.hypot(px - closestX, py - closestY);
}

/** Distance (km) from a point to the closest point on a fault poly-line. */
function distanceToFaultKm(lat: number, lon: number, fault: FaultFeature): number {
  const coords = fault.geometry.coordinates;
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [aLon, aLat] = coords[i];
    const [bLon, bLat] = coords[i + 1];
    const d = distanceToSegmentKm(lat, lon, aLat, aLon, bLat, bLon);
    if (d < min) min = d;
  }
  return min;
}

export function findNearestFault(lat: number, lon: number): NearestFault | null {
  const features = (faultData as unknown as { features: FaultFeature[] }).features;
  let best: NearestFault | null = null;
  for (const f of features) {
    if (f.geometry?.type !== 'LineString') continue;
    const d = distanceToFaultKm(lat, lon, f);
    if (!best || d < best.distanceKm) {
      best = {
        id: f.properties.id,
        name: f.properties.name,
        distanceKm: d,
        risk: f.properties.risk,
        lastMajor: f.properties.lastMajor,
      };
    }
  }
  return best;
}

function bandFromScore(score: number): RiskBand {
  if (score >= 75) return 'Very High';
  if (score >= 55) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Low';
}

function headlineFromBand(band: RiskBand): string {
  switch (band) {
    case 'Very High':
      return 'Very High Exposure';
    case 'High':
      return 'High Exposure';
    case 'Moderate':
      return 'Moderate Exposure';
    case 'Low':
      return 'Lower Exposure';
  }
}

/**
 * Compute the Home Seismic Risk Score for a location.
 *
 * @param lat            Home latitude.
 * @param lon            Home longitude.
 * @param nearbyQuakes   Historical earthquakes to consider (any set; they are
 *                       filtered to NEARBY_RADIUS_KM internally). Pass the same
 *                       dataset the map uses so the score matches what users see.
 */
export function computeRiskScore(
  lat: number,
  lon: number,
  nearbyQuakes: Earthquake[]
): RiskScore {
  const nearestFault = findNearestFault(lat, lon);

  // Gather nearby historical quakes once.
  const within: { eq: Earthquake; dist: number }[] = [];
  for (const eq of nearbyQuakes) {
    const d = distanceKm(lat, lon, eq.latitude, eq.longitude);
    if (d <= NEARBY_RADIUS_KM) within.push({ eq, dist: d });
  }

  const feltNearby = within.filter(w => (w.eq.felt ?? 0) > 0);
  const maxMagNearby = within.reduce((m, w) => Math.max(m, w.eq.magnitude), 0);
  const mostRecentTs = within.reduce((m, w) => Math.max(m, w.eq.timestamp), 0);

  // ── Factor 1: fault proximity (0 → WEIGHTS.faultProximity) ──
  // Full points within 2km of a fault, decaying to 0 at 30km.
  let faultPoints = 0;
  let faultDetail = 'No mapped major fault nearby.';
  if (nearestFault) {
    const d = nearestFault.distanceKm;
    const proximity = Math.max(0, Math.min(1, (30 - d) / 28));
    // Amplify by the fault's own hazard rating.
    const riskMultiplier =
      nearestFault.risk === 'Very High' ? 1 : nearestFault.risk === 'High' ? 0.85 : 0.7;
    faultPoints = Math.round(WEIGHTS.faultProximity * proximity * riskMultiplier);
    faultDetail = `${nearestFault.name} is ${d.toFixed(1)} km away (${nearestFault.risk.toLowerCase()} hazard fault).`;
  }

  // ── Factor 2: historical felt density (0 → WEIGHTS.historicalFelt) ──
  // 30+ felt quakes within radius saturates the factor.
  const feltRatio = Math.min(1, feltNearby.length / 30);
  const feltPoints = Math.round(WEIGHTS.historicalFelt * feltRatio);
  const feltDetail =
    feltNearby.length > 0
      ? `${feltNearby.length} earthquakes were felt by people within ${NEARBY_RADIUS_KM} km.`
      : `No felt earthquakes recorded within ${NEARBY_RADIUS_KM} km in the dataset.`;

  // ── Factor 3: largest nearby magnitude (0 → WEIGHTS.maxMagnitude) ──
  // M3 → 0 pts, M6.5+ → full points.
  const magRatio = Math.max(0, Math.min(1, (maxMagNearby - 3) / 3.5));
  const magPoints = Math.round(WEIGHTS.maxMagnitude * magRatio);
  const magDetail =
    maxMagNearby > 0
      ? `Largest nearby quake on record was M${maxMagNearby.toFixed(1)}.`
      : 'No significant nearby quakes on record.';

  // ── Factor 4: recency (0 → WEIGHTS.recency) ──
  // Activity in the last 30 days → full points, decaying to 0 at ~2 years.
  let recencyPoints = 0;
  let recencyDetail = 'No recent nearby activity.';
  if (mostRecentTs > 0) {
    const daysAgo = (Date.now() - mostRecentTs) / 86_400_000;
    const recencyRatio = Math.max(0, Math.min(1, (730 - daysAgo) / 700));
    recencyPoints = Math.round(WEIGHTS.recency * recencyRatio);
    recencyDetail =
      daysAgo < 1
        ? 'A nearby earthquake occurred today.'
        : `Most recent nearby quake was ${Math.round(daysAgo)} days ago.`;
  }

  const rawScore = faultPoints + feltPoints + magPoints + recencyPoints;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const band = bandFromScore(score);

  const factors: RiskFactor[] = [
    {
      key: 'fault-proximity',
      label: 'Fault proximity',
      points: faultPoints,
      maxPoints: WEIGHTS.faultProximity,
      detail: faultDetail,
    },
    {
      key: 'historical-felt',
      label: 'Felt earthquake history',
      points: feltPoints,
      maxPoints: WEIGHTS.historicalFelt,
      detail: feltDetail,
    },
    {
      key: 'max-magnitude',
      label: 'Largest nearby quake',
      points: magPoints,
      maxPoints: WEIGHTS.maxMagnitude,
      detail: magDetail,
    },
    {
      key: 'recency',
      label: 'Recent activity',
      points: recencyPoints,
      maxPoints: WEIGHTS.recency,
      detail: recencyDetail,
    },
  ];

  const faultPhrase = nearestFault
    ? `${nearestFault.distanceKm.toFixed(1)} km from the ${nearestFault.name}`
    : 'in the Bay Area seismic zone';

  const summary =
    band === 'Very High' || band === 'High'
      ? `Your home is ${faultPhrase}, with ${feltNearby.length} felt earthquakes nearby on record. Homes in this zone face elevated shaking risk — retrofitting and earthquake insurance are strongly recommended.`
      : band === 'Moderate'
      ? `Your home is ${faultPhrase}. There is meaningful earthquake exposure here — it's worth reviewing your preparedness and insurance coverage.`
      : `Your home is ${faultPhrase}. Exposure is lower than much of the Bay Area, but no California home is risk-free — basic preparedness still matters.`;

  return {
    score,
    band,
    nearestFault,
    factors,
    headline: headlineFromBand(band),
    summary,
    stats: {
      feltNearbyCount: feltNearby.length,
      maxMagnitudeNearby: maxMagNearby,
      quakesWithinRadius: within.length,
    },
  };
}

/** Tailwind-friendly color tokens for a band, for consistent UI theming. */
export function bandColors(band: RiskBand): { text: string; bg: string; border: string; ring: string } {
  switch (band) {
    case 'Very High':
      return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', ring: 'stroke-red-500' };
    case 'High':
      return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', ring: 'stroke-orange-500' };
    case 'Moderate':
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: 'stroke-amber-500' };
    case 'Low':
      return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', ring: 'stroke-green-500' };
  }
}
