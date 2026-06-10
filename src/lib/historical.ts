/**
 * Historical earthquake data loader — reads 15+ years of USGS data
 * from the HISTORICAL_R2 bucket and aggregates summary stats.
 *
 * Bucket layout:
 *   historical/manifest.json       { files: ["historical/data1.json", ...] }
 *   historical/data1.json          USGS GeoJSON FeatureCollection
 *   historical/dataN.json          ...
 *
 * Upload with: npm run upload:historical
 */
import type { Earthquake, USGSFeature } from './types';
import { getRegionForCoordinates, REGIONS } from './regions';
import { detectSwarms } from './analysis';

const BAY_AREA_BOUNDS = {
  minLat: 36.9, maxLat: 38.35,
  minLon: -123.0, maxLon: -121.4,
};

const MANIFEST_KEY = 'historical/manifest.json';
const KV_SUMMARY_KEY = 'historical:summary:v1';
const KV_QUAKES_META_KEY = 'historical:quakes-etag:v1';
const SUMMARY_TTL = 60 * 60 * 6; // 6 hours

interface Manifest {
  files: string[];
}

function parseFeature(f: USGSFeature): Earthquake | null {
  if (!f.properties?.time || f.properties?.mag == null) return null;
  if (!f.geometry?.coordinates) return null;
  const [lon, lat, depth] = f.geometry.coordinates;
  if (
    lat < BAY_AREA_BOUNDS.minLat || lat > BAY_AREA_BOUNDS.maxLat ||
    lon < BAY_AREA_BOUNDS.minLon || lon > BAY_AREA_BOUNDS.maxLon
  ) return null;
  return {
    id: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: new Date(f.properties.time),
    timestamp: f.properties.time,
    latitude: lat,
    longitude: lon,
    depth,
    felt: f.properties.felt,
    significance: f.properties.sig,
    url: f.properties.url,
    region: getRegionForCoordinates(lat, lon),
  };
}

async function readManifest(bucket: R2Bucket): Promise<Manifest | null> {
  const obj = await bucket.get(MANIFEST_KEY);
  if (!obj) return null;
  try {
    return await obj.json<Manifest>();
  } catch {
    return null;
  }
}

/**
 * Load all historical Bay Area earthquakes from R2.
 * Returns empty array if HISTORICAL_R2 not configured or manifest missing.
 */
export async function loadHistoricalEarthquakes(
  bucket: R2Bucket | undefined,
): Promise<Earthquake[]> {
  if (!bucket) return [];

  const manifest = await readManifest(bucket);
  if (!manifest || !manifest.files?.length) return [];

  const fileResults = await Promise.all(
    manifest.files.map(async (key) => {
      try {
        const obj = await bucket.get(key);
        if (!obj) return [] as Earthquake[];
        const data = await obj.json<{ features?: USGSFeature[] }>();
        const quakes: Earthquake[] = [];
        for (const f of data.features ?? []) {
          const q = parseFeature(f);
          if (q) quakes.push(q);
        }
        return quakes;
      } catch (err) {
        console.error(`[historical] failed to load ${key}:`, err);
        return [] as Earthquake[];
      }
    }),
  );

  const seen = new Set<string>();
  const merged: Earthquake[] = [];
  for (const quakes of fileResults) {
    for (const q of quakes) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        merged.push(q);
      }
    }
  }
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
}

// ─── Summary (small, KV-cached) ─────────────────────────────────────────────

export interface HistoricalSummary {
  totalCount: number;
  dateRange: { start: string; end: string };
  magnitudeRange: { min: number; max: number; avg: number };
  byRegion: Record<string, number>;
  biggestQuake: {
    id: string;
    magnitude: number;
    place: string;
    timestamp: number;
    region: string;
  } | null;
  regionStats: Array<{
    regionId: string;
    totalCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
  }>;
  swarmSummaries: Array<{
    id: string;
    startTime: string;
    endTime: string;
    peakMagnitude: number;
    totalCount: number;
    region: string;
  }>;
  sanRamonCount: number;
  santaClaraCount: number;
  sanRamonSwarmCount: number;
  santaClaraSwarmCount: number;
  avgWeeklyRate: number;
}

function emptySummary(): HistoricalSummary {
  const now = new Date().toISOString();
  return {
    totalCount: 0,
    dateRange: { start: now, end: now },
    magnitudeRange: { min: 0, max: 0, avg: 0 },
    byRegion: {},
    biggestQuake: null,
    regionStats: [],
    swarmSummaries: [],
    sanRamonCount: 0,
    santaClaraCount: 0,
    sanRamonSwarmCount: 0,
    santaClaraSwarmCount: 0,
    avgWeeklyRate: 0,
  };
}

function computeSummary(earthquakes: Earthquake[]): HistoricalSummary {
  if (earthquakes.length === 0) return emptySummary();

  const magnitudes = earthquakes.map((eq) => eq.magnitude);
  const timestamps = earthquakes.map((eq) => eq.timestamp);

  const byRegion: Record<string, number> = {};
  for (const eq of earthquakes) byRegion[eq.region] = (byRegion[eq.region] || 0) + 1;

  const biggestQuake = earthquakes.reduce(
    (max, eq) => (eq.magnitude > max.magnitude ? eq : max),
    earthquakes[0],
  );

  const regionStats = REGIONS.map((region) => {
    const regionEqs = earthquakes.filter((eq) => eq.region === region.id);
    const mags = regionEqs.map((eq) => eq.magnitude);
    return {
      regionId: region.id,
      totalCount: regionEqs.length,
      avgMagnitude: mags.length > 0 ? mags.reduce((a, b) => a + b, 0) / mags.length : 0,
      maxMagnitude: mags.length > 0 ? Math.max(...mags) : 0,
    };
  });

  const allSwarms = detectSwarms(earthquakes);
  const swarmSummaries = allSwarms.slice(0, 50).map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    peakMagnitude: s.peakMagnitude,
    totalCount: s.totalCount,
    region: s.region,
  }));

  const sanRamonQuakes = earthquakes.filter((eq) => eq.region === 'san-ramon');
  const santaClaraQuakes = earthquakes.filter((eq) => eq.region === 'santa-clara');
  const sanRamonSwarms = detectSwarms(sanRamonQuakes);
  const santaClaraSwarms = detectSwarms(santaClaraQuakes);

  const startMs = Math.min(...timestamps);
  const endMs = Math.max(...timestamps);
  const spanWeeks = Math.max(1, (endMs - startMs) / (7 * 24 * 60 * 60 * 1000));
  const avgWeeklyRate = Math.round(sanRamonQuakes.length / spanWeeks);

  return {
    totalCount: earthquakes.length,
    dateRange: {
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
    },
    magnitudeRange: {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      avg: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    },
    byRegion,
    biggestQuake: {
      id: biggestQuake.id,
      magnitude: biggestQuake.magnitude,
      place: biggestQuake.place,
      timestamp: biggestQuake.timestamp,
      region: biggestQuake.region,
    },
    regionStats,
    swarmSummaries,
    sanRamonCount: sanRamonQuakes.length,
    santaClaraCount: santaClaraQuakes.length,
    sanRamonSwarmCount: sanRamonSwarms.length,
    santaClaraSwarmCount: santaClaraSwarms.length,
    avgWeeklyRate,
  };
}

/**
 * Return the historical summary, served from KV cache when available.
 * Cache is invalidated by uploading a new manifest (the etag changes).
 */
export async function getHistoricalSummary(
  bucket: R2Bucket | undefined,
  kv: KVNamespace,
): Promise<HistoricalSummary> {
  if (!bucket) return emptySummary();

  const manifestHead = await bucket.head(MANIFEST_KEY);
  const etag = manifestHead?.etag ?? 'none';

  const cachedEtag = await kv.get(KV_QUAKES_META_KEY, 'text');
  if (cachedEtag === etag) {
    const cached = await kv.get(KV_SUMMARY_KEY, 'json');
    if (cached) return cached as HistoricalSummary;
  }

  const earthquakes = await loadHistoricalEarthquakes(bucket);
  const summary = computeSummary(earthquakes);

  await Promise.all([
    kv.put(KV_SUMMARY_KEY, JSON.stringify(summary), { expirationTtl: SUMMARY_TTL }),
    kv.put(KV_QUAKES_META_KEY, etag, { expirationTtl: SUMMARY_TTL }),
  ]);

  return summary;
}
