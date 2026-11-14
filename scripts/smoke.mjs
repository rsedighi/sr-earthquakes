// Post-deploy smoke test: node scripts/smoke.mjs https://baytremor.com
const base = (process.argv[2] ?? 'https://baytremor.com').replace(/\/$/, '');
const pages = ['/', '/today', '/history', '/ios', '/city/oakland'];
const failures = [];

async function check(label, promise, expect) {
  try {
    const res = await promise;
    const ok = expect(res);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} -> ${res.status}`);
    if (!ok) failures.push(label);
    return res;
  } catch (err) {
    console.log(`FAIL ${label} -> ${err.message}`);
    failures.push(label);
    return null;
  }
}

const assets = new Set();
for (const path of pages) {
  const res = await check(`GET ${path}`, fetch(base + path), (r) => r.status === 200);
  if (!res) continue;
  const html = await res.text();
  const cacheControl = res.headers.get('cache-control') ?? '';
  if (/max-age=[1-9]/.test(cacheControl)) {
    console.log(`FAIL ${path} browser-cacheable HTML (${cacheControl})`);
    failures.push(`${path} cache-control`);
  }
  if (!/<meta name="app-version" content="[^"]+"/.test(html)) {
    console.log(`FAIL ${path} missing app-version meta`);
    failures.push(`${path} app-version`);
  }
  for (const match of html.matchAll(/\/_astro\/[A-Za-z0-9_.@\-]+\.(?:js|css)/g)) assets.add(match[0]);
}

for (const asset of assets) {
  await check(`asset ${asset}`, fetch(base + asset, { method: 'HEAD' }), (r) => r.status === 200);
}

// Basemap: a Bay Area vector tile from R2, plus self-hosted glyphs.
await check('basemap tile', fetch(`${base}/basemap/tiles/10/164/396.mvt`),
  (r) => r.status === 200 && r.headers.get('content-type') === 'application/x-protobuf');
await check('basemap glyphs', fetch(`${base}/basemap/fonts/Noto%20Sans%20Regular/0-255.pbf`, { method: 'HEAD' }),
  (r) => r.status === 200);

await check('GET /api/ios-waitlist', fetch(`${base}/api/ios-waitlist`), (r) => r.status === 200);
await check('POST /api/events', fetch(`${base}/api/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain', Origin: base, 'User-Agent': 'baytremor-smoke-test' },
  body: JSON.stringify({ v: 'smoke', path: '/', internal: true, events: [] }),
}), (r) => r.status === 204);

const wwwUrl = base.replace('://', '://www.');
if (wwwUrl !== base && !base.includes('localhost')) {
  await check('www -> apex redirect', fetch(`${wwwUrl}/today`, { redirect: 'manual' }),
    (r) => r.status === 301 && (r.headers.get('location') ?? '').startsWith(`${base}/today`));
}

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
