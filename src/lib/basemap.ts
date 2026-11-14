import { PMTiles, ResolvedValueCache, type RangeResponse, type Source } from 'pmtiles';

// Bay Area extract of the Protomaps daily build, cut with:
//   pmtiles extract https://build.protomaps.com/20261112.pmtiles bayarea.pmtiles \
//     --bbox=-123.2,36.7,-120.9,38.6 --maxzoom=15
// Upload a new extract under a new key and bump this constant to roll the basemap.
export const BASEMAP_KEY = 'basemap/bayarea-20261112.pmtiles';
export const BASEMAP_MAX_ZOOM = 15;
export const BASEMAP_TILE_PATH = '/basemap/tiles/';

const BROWSER_TTL = 7 * 24 * 60 * 60;
const EDGE_TTL = 30 * 24 * 60 * 60;
const TILE_PATTERN = /^\/basemap\/tiles\/(\d{1,2})\/(\d{1,6})\/(\d{1,6})\.mvt$/;

class R2Source implements Source {
  constructor(private bucket: R2Bucket, private key: string) {}

  getKey() {
    return this.key;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const object = await this.bucket.get(this.key, { range: { offset, length } });
    if (!object) throw new Error(`Basemap archive missing: ${this.key}`);
    return { data: await object.arrayBuffer(), etag: object.etag };
  }
}

// Header and directories are cached per isolate so most tiles need a single R2 read.
const directoryCache = new ResolvedValueCache(25, false);
let archive: { bucket: R2Bucket; pmtiles: PMTiles } | null = null;

function getArchive(bucket: R2Bucket): PMTiles {
  if (archive?.bucket !== bucket) {
    archive = { bucket, pmtiles: new PMTiles(new R2Source(bucket, BASEMAP_KEY), directoryCache) };
  }
  return archive.pmtiles;
}

export async function handleBasemapTile(
  request: Request,
  env: { MEDIA_R2?: R2Bucket },
  ctx: ExecutionContext,
): Promise<Response> {
  const match = new URL(request.url).pathname.match(TILE_PATTERN);
  const [z, x, y] = match ? match.slice(1).map(Number) : [];
  if (!match || z > BASEMAP_MAX_ZOOM || x >= 2 ** z || y >= 2 ** z) {
    return new Response('Invalid tile coordinates', { status: 400 });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!env.MEDIA_R2) return new Response('Basemap is not configured', { status: 503 });

  const cache = (caches as CacheStorage & { default: Cache }).default;
  const cacheKey = new Request(new URL(`${BASEMAP_TILE_PATH}${z}/${x}/${y}.mvt?v=${BASEMAP_KEY}`, request.url));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let tile: RangeResponse | undefined;
  try {
    tile = await getArchive(env.MEDIA_R2).getZxy(z, x, y);
  } catch (err) {
    console.error('[basemap] tile read failed', { z, x, y, error: err instanceof Error ? err.message : String(err) });
    return new Response('Basemap tile unavailable', { status: 502 });
  }

  // Tiles outside the extract are legitimately empty; cache those too.
  const response = new Response(tile?.data ?? null, {
    status: tile ? 200 : 204,
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Cache-Control': `public, max-age=${BROWSER_TTL}, s-maxage=${EDGE_TTL}`,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
