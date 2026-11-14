# BayTremor (sr-earthquakes)

Astro 5 + React islands on Cloudflare Workers (`@astrojs/cloudflare`, `wrangler.toml`).

## Commands

- `npm run check` — `astro check` (must be 0 errors; CI enforces it)
- `npm run build` — build to `dist/`
- `npx wrangler deploy --dry-run --outdir dist-dry-run` — validate config/bundle
- `npx wrangler dev --port 8788 --local` — serve the built Worker locally (run `npm run build` first)
- `npm run smoke -- <base-url>` — post-deploy smoke test (pages, `/_astro` assets, APIs, www redirect)
- `npm run types` — regenerate `worker-configuration.d.ts` after changing `wrangler.toml`

## Conventions

- Datadog was decommissioned on 2026-11-14. Do not add Datadog code.
- Telemetry: use `trackAction`/`trackError` from `src/lib/telemetry.ts`. Event names must be
  added to `PRODUCT_EVENTS`/`OPERATIONAL_EVENTS` in `src/lib/telemetry-shared.ts`.
  Events go to Analytics Engine via `POST /api/events`. Never send email, address,
  coordinates, or free-form input.
- HTML edge cache is keyed by `CF_VERSION_METADATA.id`; do not reintroduce a manual cache version.
- `docs/10X-IMPROVEMENT-PLAN.md` is the roadmap; update it in the same change as the work.
- Maps use MapLibre GL with a self-hosted Protomaps basemap: tiles come from the PMTiles
  archive in `MEDIA_R2` (`BASEMAP_KEY` in `src/lib/basemap.ts`) via `/basemap/tiles/*`,
  glyphs/sprites from `public/basemap/`. Do not reintroduce third-party tile providers.
  To refresh: `pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles out.pmtiles
  --bbox=-123.2,36.7,-120.9,38.6 --maxzoom=15`, upload under a new key with
  `wrangler r2 object put earthquake-media/basemap/<key> --file out.pmtiles --remote`, bump `BASEMAP_KEY`.
