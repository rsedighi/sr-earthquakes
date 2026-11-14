// satori is pinned to 0.32.x: 0.33+ pulls in HarfBuzz WASM that is compiled at
// module load, which Workers forbid. Upgrade only after verifying on workerd.
import satori, { init as initSatori, type Font } from 'satori/standalone';
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm';
import yogaWasm from 'satori/yoga.wasm?module';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm?module';
import type { ReactNode } from 'react';

// Rendered PNGs are cached at the edge; social crawlers re-fetch rarely.
export const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400';

const FONT_WEIGHTS = [500, 700, 800] as const;

let ready: Promise<Font[]> | null = null;

function setup(origin: string, assets?: Fetcher): Promise<Font[]> {
  ready ??= (async () => {
    const load = async (weight: number): Promise<Font> => {
      const url = new URL(`/og/fonts/inter-${weight}.woff`, origin);
      const res = await (assets ? assets.fetch(url) : fetch(url));
      if (!res.ok) throw new Error(`font ${weight} ${res.status}`);
      return { name: 'Inter', data: await res.arrayBuffer(), weight: weight as Font['weight'], style: 'normal' };
    };
    const [fonts] = await Promise.all([
      Promise.all(FONT_WEIGHTS.map(load)),
      initSatori(yogaWasm),
      initResvg(resvgWasm),
    ]);
    return fonts;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export async function renderPng(
  node: ReactNode,
  size: { width: number; height: number },
  ctx: { origin: string; assets?: Fetcher }
): Promise<Uint8Array<ArrayBuffer>> {
  const fonts = await setup(ctx.origin, ctx.assets);
  const svg = await satori(node, { ...size, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size.width } });
  const png = resvg.render();
  const bytes = png.asPng() as Uint8Array<ArrayBuffer>;
  png.free();
  resvg.free();
  return bytes;
}

/** Serve a rendered image through the Cache API, keyed by `cacheKey`. */
export async function cachedImage(
  cacheKey: string,
  ctx: { waitUntil?: (p: Promise<unknown>) => void } | undefined,
  render: () => Promise<Uint8Array<ArrayBuffer>>
): Promise<Response> {
  // @ts-expect-error caches.default exists on Cloudflare Workers runtime
  const cache: Cache | null = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(cacheKey);
  const hit = await cache?.match(key);
  // Cached responses have immutable headers; middleware still needs to add security headers.
  if (hit) return new Response(hit.body, hit);

  const response = new Response(await render(), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': OG_CACHE_CONTROL },
  });
  if (cache) ctx?.waitUntil?.(cache.put(key, response.clone()));
  return response;
}
