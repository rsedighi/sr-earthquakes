# Getting Started — Local Setup for New Developers

This guide walks a new developer through getting **sr-earthquakes** (BayTremor) running
on a fresh machine. The app is an [Astro](https://astro.build) 5 + React 19 site that
deploys to **Cloudflare Workers** and uses D1, KV, R2, Durable Objects, Queues, Cron
Triggers, and Analytics Engine.

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20 LTS or newer | Astro 5 / Wrangler 4 require Node 18+. Use `nvm` if you juggle versions. |
| **npm** | 10+ | Ships with Node 20. |
| **Git** | any recent | To clone and push. |
| **Cloudflare account** | — | Needed for deploys and to bind D1/KV/R2/Queues. |
| **Wrangler** | v4 | Installed as a dev dependency; run via `npx wrangler`. |

Optional but useful:
- A [Datadog](https://www.datadoghq.com/) RUM application (for real-user monitoring).
- A [Mapbox](https://www.mapbox.com/) access token (for address autocomplete).

---

## 2. Clone & install

```bash
git clone <repo-url> sr-earthquakes
cd sr-earthquakes
npm install
```

---

## 3. Environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Key variables (see `.env.example` for the full annotated list):

- `PUBLIC_DD_APPLICATION_ID`, `PUBLIC_DD_CLIENT_TOKEN`, `PUBLIC_DD_SITE`, `PUBLIC_DD_ENV`,
  `PUBLIC_DD_VERSION` — Datadog RUM (from Datadog → UX Monitoring → RUM Applications).
- `PUBLIC_BASE_URL` — canonical/OG base URL (e.g. `https://baytremor.com`).
- `PUBLIC_GA_ID` — Google Analytics (optional).
- `MAPBOX_ACCESS_TOKEN` — server-side only, for `/api/geocode` autocomplete (optional;
  falls back to free Photon → Nominatim providers when unset).

> **Note:** `PUBLIC_`-prefixed vars are inlined at **build time** and exposed to the
> client. Rebuild after changing them. Never prefix secrets (like `MAPBOX_ACCESS_TOKEN`)
> with `PUBLIC_`.

For local Cloudflare bindings, secrets are read from `.dev.vars` by Wrangler. Add
server-side secrets there (same key names, no `PUBLIC_` prefix) if you need them during
`wrangler`-backed local runs.

---

## 4. Cloudflare authentication

Log in so Wrangler can talk to your account:

```bash
npx wrangler login
```

Generate the TypeScript types for your bindings (from `wrangler.toml`):

```bash
npm run types
```

---

## 5. Cloudflare resources

The app binds to several Cloudflare services declared in `wrangler.toml`. The IDs there
point at the shared project resources. If you are setting up your **own** environment,
create them once and update the IDs:

```bash
# D1 database (binding: DB)
npx wrangler d1 create earthquake-tracker

# KV namespaces (bindings: EARTHQUAKE_KV, FEATURE_FLAGS_KV)
npx wrangler kv namespace create EARTHQUAKE_KV
npx wrangler kv namespace create FEATURE_FLAGS_KV

# R2 buckets (bindings: MEDIA_R2, HISTORICAL_R2)
npx wrangler r2 bucket create earthquake-media
npx wrangler r2 bucket create earthquake-historical

# Queue (binding: NOTIFICATION_QUEUE)
npx wrangler queues create earthquake-notifications
```

### Apply D1 migrations

Migrations live in `migrations/`.

```bash
# Local (uses a local SQLite file)
npx wrangler d1 migrations apply earthquake-tracker --local

# Remote (the real D1 database)
npx wrangler d1 migrations apply earthquake-tracker --remote
```

### (Optional) Upload the historical dataset

```bash
npm run upload:historical
```

---

## 6. Run locally

Start the Astro dev server:

```bash
npm run dev
```

The dev server prints a local URL (typically `http://localhost:4321`).

To exercise the full Cloudflare runtime (D1/KV/R2/DO/Queues/Cron) locally, build and
preview through Wrangler:

```bash
npm run build
npm run preview
```

---

## 7. Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Astro dev server with HMR. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Preview the built worker locally (Wrangler runtime). |
| `npm run deploy` | Build, then `wrangler deploy` to Cloudflare. |
| `npm run check` | `astro check` — type/diagnostic check. |
| `npm run types` | Regenerate binding types from `wrangler.toml`. |
| `npm run upload:historical` | Upload the historical USGS dataset to R2. |

---

## 8. Deploy

```bash
npm run deploy
```

This runs `astro build` and then `wrangler deploy`, publishing the worker (name
`sr-earthquakes`) plus the Cron trigger (USGS polling every 60s) and all bindings.

---

## 9. Project layout (quick map)

- `src/` — Astro pages, layouts, React islands, API routes, and server logic.
- `migrations/` — D1 SQL migrations (`0001_init.sql`, `0002_earthquakes.sql`, `0003_leads.sql`).
- `data/` — seed/reference data.
- `scripts/` — helper scripts (e.g. historical upload).
- `docs/` — architecture, design, and implementation docs.
- `astro.config.ts` — Astro + Cloudflare adapter config.
- `wrangler.toml` — Cloudflare bindings, triggers, and worker config.
- `tailwind.config.ts` — Tailwind + fonts (Geist Sans / Geist Mono).

---

## 10. Troubleshooting

- **Type errors after editing `wrangler.toml`** — run `npm run types`.
- **Env changes not reflected** — `PUBLIC_` vars are baked at build time; re-run
  `npm run build` / restart `npm run dev`.
- **`wrangler` auth failures** — re-run `npx wrangler login` and confirm you selected the
  correct Cloudflare account.
- **D1 queries failing locally** — make sure you ran migrations with `--local`.
