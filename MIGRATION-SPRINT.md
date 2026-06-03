# Astro + Cloudflare Migration — Sprint Schedule

**Branch:** `feat/astro-cloudflare-migration`
**Start:** Week of Jun 3, 2026
**Goal:** Full rewrite of BayTremor from Next.js + OpenNext → Astro + native Cloudflare primitives

---

## Sprint 1 — Foundation (Jun 3–6) ✦ Days 1–2

### Objectives
- Bootstrap new Astro project with Cloudflare adapter
- Declare all CF bindings in `wrangler.toml`
- Port shared utilities and all 26 components unchanged

### Tasks
- [ ] `npm create cloudflare@latest` → Astro SSR template
- [ ] Add `@astrojs/react`, `@astrojs/tailwind`, `@astrojs/cloudflare`
- [ ] Write full `wrangler.toml` (D1, KV ×2, R2, DO ×2, Queue, Cron, Analytics Engine, Rate Limiting)
- [ ] Run `wrangler types` → generate `worker-configuration.d.ts`
- [ ] Copy verbatim: `lib/types.ts`, `lib/regions.ts`, `lib/analysis.ts`, `lib/units.ts`, `lib/seo.ts`, `lib/affiliate-products.ts`, `lib/news-sources.ts`, `lib/logger.ts`
- [ ] Copy verbatim: all 26 `components/` files (they are plain React — no changes needed)
- [ ] Copy `hooks/use-historical-earthquakes.ts`, `hooks/use-my-city.ts`
- [ ] Copy `public/` assets, `globals.css`, tailwind/postcss configs
- [ ] Configure TypeScript paths (`@/` alias)
- [ ] Remove: `next.config.js`, `open-next.config.ts`, `next-env.d.ts`, `vercel.json`
- [ ] Verify `npx wrangler dev` boots with no type errors

### Definition of Done
`wrangler dev` runs, Astro homepage renders, all imports resolve.

---

## Sprint 2 — Data Layer (Jun 7–10) ✦ Days 3–4

### Objectives
- Replace MongoDB with D1
- Set up KV namespaces
- Scaffold Durable Objects

### Tasks

#### D1
- [ ] Write `migrations/0001_init.sql`:
  - `comments` (id, earthquake_id, parent_id, author, content, created_at, updated_at, likes, location, felt_it)
  - `forum_posts` (id, title, content, author, created_at, updated_at, likes, category)
  - `forum_replies` (id, post_id, parent_id, author, content, created_at, likes)
  - `community_reactions` (id, earthquake_id, author, reaction_type, created_at)
  - `devices` (token, city, min_magnitude, created_at)
  - `ios_waitlist` (email, created_at)
  - `feedback` (id, content, rating, created_at)
  - Add indexes on foreign keys
- [ ] `wrangler d1 create earthquake-tracker` → paste ID into `wrangler.toml`
- [ ] `wrangler d1 migrations apply earthquake-tracker --local`
- [ ] Write `lib/d1.ts` — typed query helpers replacing `lib/mongodb.ts`
  - `getComments(earthquakeId)`, `createComment()`, `likeComment()`
  - `getForumPosts()`, `createForumPost()`, `createForumReply()`
  - `registerDevice()`, `getDevicesForNotification(magnitude, lat, lon)`
  - `addToWaitlist()`, `saveFeedback()`

#### KV
- [ ] `wrangler kv namespace create EARTHQUAKE_KV` → paste ID
- [ ] `wrangler kv namespace create FEATURE_FLAGS_KV` → paste ID
- [ ] Write `lib/kv.ts` — typed KV helpers:
  - `getEarthquakeFeed(binding, feed)` / `setEarthquakeFeed(binding, feed, data, ttl)`
  - `getCityCache(binding, slug)` / `setCityCache()`
  - `getAISummary(binding, quakeId)` / `setAISummary()`
  - `getFeatureFlag(binding, key)` / `setFeatureFlag()`

#### Durable Objects
- [ ] Write `src/durable-objects/EarthquakeRoom.ts`:
  - `fetch()`: handle WebSocket upgrade, store session
  - `broadcast(data)`: fan-out to all connected sessions
  - `alarm()`: not used here; kept for future
- [ ] Write `src/durable-objects/CommentRoom.ts`:
  - Per-earthquake-id room (name = quakeId)
  - Broadcast new/updated/deleted comment events
- [ ] Add both classes to `wrangler.toml` DO bindings + migrations
- [ ] Stub WebSocket endpoint `src/pages/api/ws/earthquakes.ts`
- [ ] Stub WebSocket endpoint `src/pages/api/ws/comments/[id].ts`

### Definition of Done
D1 schema applied locally. KV namespaces exist. DO classes compile. `wrangler d1 execute` queries work.

---

## Sprint 3 — API Endpoints (Jun 11–15) ✦ Days 5–7

### Objectives
- All 13 API route groups rewritten as Astro endpoints
- Real-time WebSocket endpoints wired to Durable Objects
- OpenAI routed through AI Gateway

### Tasks

#### Earthquake data endpoints
- [ ] `src/pages/api/earthquakes/index.ts` — read from `EARTHQUAKE_KV`, fallback fetch USGS, write back
- [ ] `src/pages/api/earthquakes/[feed].ts` — parameterized feed (all_hour / all_day / all_week)
- [ ] `src/pages/api/earthquakes/city/[slug].ts` — city-filtered, KV-cached
- [ ] `src/pages/api/earthquakes/region/[id].ts` — region-filtered, KV-cached
- [ ] `src/pages/api/earthquake/[id].ts` — single quake detail, USGS fetch + KV cache

#### Community / User-generated content
- [ ] `src/pages/api/comments/[earthquakeId].ts` — GET/POST/DELETE via D1
- [ ] `src/pages/api/comments/[earthquakeId]/like/[commentId].ts` — D1 increment
- [ ] `src/pages/api/forum/index.ts` — GET posts, POST new post → D1
- [ ] `src/pages/api/forum/[postId].ts` — GET post + replies → D1
- [ ] `src/pages/api/forum/[postId]/reply.ts` — POST reply → D1
- [ ] `src/pages/api/community/index.ts` — reactions → D1
- [ ] `src/pages/api/feedback/index.ts` → D1

#### AI
- [ ] Update `lib/openai.ts`: set `baseURL` to `https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/baytremor/openai`
- [ ] `src/pages/api/ai-summary/[id].ts` — check KV first, else call OpenAI via gateway, store in KV (1hr TTL)

#### Devices / iOS
- [ ] `src/pages/api/devices/register.ts` → D1 insert
- [ ] `src/pages/api/devices/unregister.ts` → D1 delete
- [ ] `src/pages/api/devices/preferences.ts` → D1 update
- [ ] `src/pages/api/ios-waitlist/index.ts` → D1 insert

#### Utilities
- [ ] `src/pages/api/geocode/index.ts` — native `fetch` to geocoding API
- [ ] `src/pages/api/addresses/index.ts` — CF geo headers (`request.cf.city`, `.region`, `.country`) first, fallback to geocode
- [ ] `src/pages/api/feature-flags/index.ts` → KV read

#### Real-time WebSocket
- [ ] `src/pages/api/ws/earthquakes.ts` — upgrade to WS, proxy to `EARTHQUAKE_ROOM` DO
- [ ] `src/pages/api/ws/comments/[id].ts` — upgrade to WS, proxy to `COMMENT_ROOM` DO
- [ ] Update `hooks/use-realtime-earthquakes.ts` — replace Pusher client with native `WebSocket` to `/api/ws/earthquakes`
- [ ] Update `components/comment-thread.tsx` — replace Pusher client with native `WebSocket`

#### Admin
- [ ] Replace `lib/admin-auth.ts` (jsonwebtoken) with `@tsndr/cloudflare-worker-jwt`
- [ ] Replace `lib/revalidation-auth.ts` similarly
- [ ] Add Rate Limiting check (`RATE_LIMITER.limit()`) to comments, forum, feedback endpoints

### Definition of Done
All API endpoints return correct data locally via `wrangler dev`. WebSocket connections reach DO. D1 reads/writes verified.

---

## Sprint 4 — Cron Trigger + Queue (Jun 16–17) ✦ Day 8

### Objectives
- Eliminate client-side polling; move all USGS fetching server-side
- Async APNs dispatch via Queue

### Tasks

#### Cron Worker
- [ ] Write `src/scheduled/usgs-poll.ts` (exported `scheduled` handler):
  1. Fetch `https://earthquake.usgs.gov/.../all_hour.geojson`
  2. Read `EARTHQUAKE_KV.get('feed:all_hour')` → parse known IDs
  3. Diff: find new earthquakes not in current cache
  4. Write updated feed to `EARTHQUAKE_KV` (TTL 65s)
  5. For each new quake: send message to `EARTHQUAKE_ROOM` DO stub → triggers broadcast
  6. For each new quake M ≥ 2.5: enqueue to `NOTIFICATION_QUEUE` with quake payload
- [ ] Wire into `wrangler.toml` `[triggers] crons`
- [ ] Test locally: `wrangler dev` → trigger manually via `wrangler dev --test-scheduled`

#### Queue Consumer
- [ ] Write `src/queue/apns-consumer.ts` (exported `queue` handler):
  1. Batch consume messages from `NOTIFICATION_QUEUE`
  2. For each quake: query `D1` `devices` table for tokens matching magnitude + rough bbox
  3. Port `lib/apns.ts` JWT logic → `@tsndr/cloudflare-worker-jwt` (no `jsonwebtoken`)
  4. Send APNs HTTPS/2 push (note: Workers support HTTP/2 natively)
  5. On 410 Gone response: delete stale token from D1
- [ ] Handle batch retry on partial failure

#### Cleanup
- [ ] Remove Pusher trigger from old API routes
- [ ] Remove client-side 60s polling interval from `useRealtimeEarthquakes`

### Definition of Done
`wrangler dev --test-scheduled` runs cron, KV is updated, new quake appears in WS broadcast without any client polling.

---

## Sprint 5 — Page Migration (Jun 18–24) ✦ Days 9–12

### Objectives
- All ~35 Next.js pages rewritten as Astro `.astro` files
- Server data fetching uses CF bindings directly via `Astro.locals.runtime.env`
- Interactive components rendered as React islands

### Tasks

#### Core pages
- [ ] `src/pages/index.astro` — fetch from KV, pass to `<Dashboard client:load />`
- [ ] `src/pages/today/index.astro`
- [ ] `src/pages/latest/index.astro`

#### Earthquake detail
- [ ] `src/pages/earthquake/[id].astro` — SSR quake detail + `<EarthquakeDetailModal client:load />`
- [ ] `src/pages/earthquake/[id]/felt.astro`
- [ ] `src/pages/felt-earthquake/index.astro`

#### City / region pages
- [ ] `src/pages/[city]-earthquake-today.astro` — SSR, KV city cache, `<EarthquakeMap client:idle />`
- [ ] `src/pages/city/[slug].astro`
- [ ] `src/pages/[city]/[year].astro` — historical year page
- [ ] `src/pages/region/[id].astro`
- [ ] `src/pages/compare/index.astro` — `<RegionComparison client:idle />`

#### Fault pages (SSR, minimal interactivity)
- [ ] `src/pages/san-andreas-fault/index.astro` — `<FaultMap client:idle />`
- [ ] `src/pages/hayward-fault/index.astro`
- [ ] `src/pages/calaveras-fault/index.astro`

#### History
- [ ] `src/pages/history/index.astro` — `<HistoricalSwarms client:idle />`
- [ ] `src/pages/history/[year].astro`
- [ ] `src/pages/history/[year]/[month].astro`

#### Community / personal
- [ ] `src/pages/community/index.astro` — `<BayTremorCommunity client:load />`
- [ ] `src/pages/community/forum.astro`
- [ ] `src/pages/community/leaderboard.astro`
- [ ] `src/pages/community/badges.astro`
- [ ] `src/pages/my-area/index.astro` — `<MyNeighborhood client:load />` + CF geo headers
- [ ] `src/pages/my-area/settings.astro`

#### Content / static
- [ ] `src/pages/learn/index.astro`
- [ ] `src/pages/learn/[slug].astro`
- [ ] `src/pages/faq/index.astro`
- [ ] `src/pages/about/index.astro`
- [ ] `src/pages/privacy/index.astro`
- [ ] `src/pages/support/index.astro`
- [ ] `src/pages/earthquake-preparedness/index.astro`
- [ ] `src/pages/news/index.astro`
- [ ] `src/pages/ios/index.astro`

#### Feeds / SEO endpoints
- [ ] `src/pages/feed.xml.ts` — RSS Astro endpoint (port `app/feed.xml/route.ts`)
- [ ] `src/pages/sitemap.xml.ts` — Astro endpoint (port `app/sitemap.ts`)
- [ ] `src/pages/news-sitemap.xml.ts`
- [ ] `src/pages/robots.txt.ts`

#### Layout
- [ ] `src/layouts/BaseLayout.astro` — port `app/layout.tsx`: meta, OG, JSON-LD, GA, Datadog RUM, AdSense, NavBar
- [ ] `src/components/Head.astro` — all `<head>` tags, security headers
- [ ] Migrate `lib/unit-context.tsx` → wrap in `<UnitProvider client:load>` in layout
- [ ] Migrate `lib/feature-flag-context.tsx` → KV-backed, server-rendered flags passed as props

### Definition of Done
All routes accessible via `wrangler dev`. No broken links. SSR pages render with real data from KV/D1.

---

## Sprint 6 — Advanced Primitives + Optimization (Jun 25–26) ✦ Day 13

### Objectives
- Analytics Engine for custom metrics
- Cache API for HTML response caching
- Middleware for security headers + geo personalization
- R2 for media

### Tasks

#### Middleware (`src/middleware.ts`)
- [ ] Security headers (port from `next.config.js` headers config)
- [ ] Inject CF geo into `Astro.locals` (`city`, `region`, `country`, `colo`, `timezone`)
- [ ] Cache API: cache GET responses for public pages (10 min TTL), bypass for `/api/`, `/community/`, `/my-area/`

#### Analytics Engine
- [ ] Write `lib/analytics.ts` — typed wrapper around `ANALYTICS.writeDataPoint()`
- [ ] Instrument: new earthquake events, page views by route, comment submissions, API errors
- [ ] Add `writeDataPoint` calls in Cron Worker (quake detected), API endpoints (errors)

#### Rate Limiting
- [ ] `wrangler.toml`: add `[unsafe.bindings]` rate limiting rules:
  - `/api/comments` — 20 req/min per IP
  - `/api/forum` — 10 req/min per IP
  - `/api/feedback` — 5 req/min per IP
  - `/api/ai-summary` — 5 req/min per IP
- [ ] Add `RATE_LIMITER.limit()` check at top of each restricted endpoint

#### R2 (optional — Cloudinary replacement)
- [ ] `wrangler r2 bucket create earthquake-media`
- [ ] Write `lib/r2.ts` — upload helper for OG images + "I felt it" photos
- [ ] Update `components/HeroImageGenerator.tsx` — write to R2, serve via `https://media.baytremor.com`
- [ ] Update `lib/cloudinary.ts` → `lib/r2.ts` call sites

#### CF Geo personalization
- [ ] In `src/pages/my-area/index.astro`: use `Astro.locals.cf.city` as default city (no geocode API call on first load)
- [ ] In earthquake list pages: use `Astro.locals.cf.region` to reorder relevant quakes

### Definition of Done
Middleware applies security headers. Cache API returns cached HTML on repeat GET. Analytics Engine receives events. Rate limiting returns 429 on exceeded limits.

---

## Sprint 7 — CI/CD + Production Deploy (Jun 27) ✦ Day 13

### Tasks
- [ ] `wrangler d1 migrations apply earthquake-tracker` (production)
- [ ] `wrangler kv namespace create EARTHQUAKE_KV --env production`
- [ ] `wrangler kv namespace create FEATURE_FLAGS_KV --env production`
- [ ] `wrangler r2 bucket create earthquake-media --env production`
- [ ] Set all secrets via `wrangler secret put`: `MONGODB_URI` (no longer needed — can remove), `OPENAI_API_KEY`, `APNS_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, admin JWT secret
- [ ] Set `NEXT_PUBLIC_*` → Astro uses `import.meta.env.PUBLIC_*` — update all references
- [ ] Configure GitHub Actions: `wrangler deploy` on merge to `main`
- [ ] Smoke test all routes in production
- [ ] DNS cutover: point `baytremor.com` to new Worker
- [ ] Monitor Workers Analytics dashboard + Logpush for 24h

---

## Dependency Changes Summary

```jsonc
// REMOVE
"next", "@opennextjs/cloudflare", "pusher", "pusher-js", "mongodb",
"server-only", "jsonwebtoken", "@types/jsonwebtoken", "geist"

// ADD
"astro", "@astrojs/cloudflare", "@astrojs/react", "@astrojs/tailwind",
"@tsndr/cloudflare-worker-jwt"

// KEEP (unchanged)
"leaflet", "react-leaflet", "@types/leaflet",
"lucide-react", "date-fns", "clsx",
"openai",                      // baseURL → AI Gateway
"@datadog/browser-rum",        // client-side only, unchanged
"cloudinary",                  // optional: replaced by R2 in Sprint 6
"react", "react-dom", "@types/react", "@types/react-dom",
"tailwindcss", "postcss", "autoprefixer", "typescript",
"wrangler"
```

---

## Environment Variable Mapping

| Old (`NEXT_PUBLIC_*` / server) | New (Astro) |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | `PUBLIC_BASE_URL` (`import.meta.env.PUBLIC_BASE_URL`) |
| `NEXT_PUBLIC_PUSHER_KEY` | *(removed — Pusher replaced by DO)* |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | *(removed)* |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | *(removed)* |
| `MONGODB_URI` | *(removed — D1 binding replaces MongoDB)* |
| `OPENAI_API_KEY` | `OPENAI_API_KEY` (via AI Gateway, same key) |
| `GOOGLE_SITE_VERIFICATION` | `GOOGLE_SITE_VERIFICATION` |
| `BING_SITE_VERIFICATION` | `BING_SITE_VERIFICATION` |
| All APNS vars | same names, stored as `wrangler secret` |

---

## Sprint Velocity Notes

- **Each Astro page** for a static/SSR-only route takes ~15–30 min (direct port)
- **Each API endpoint** rewrite averages ~45 min (swap Next.js `NextRequest`/`NextResponse` for `APIRoute`)
- **Durable Objects** are the highest-risk item — budget extra time for Sprint 2
- **Component changes are minimal** — React islands work as-is; only Pusher call sites need updating (2 files)
- Sprints 1–3 are **blocking** — must complete before pages can fetch real data
- Sprints 4–7 can be partially **parallelized** once Sprint 3 is done
