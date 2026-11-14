# BayTremor 10x Improvement Plan

> A measurable, checkable roadmap derived from production Datadog RUM, a
> production endpoint audit, a cold mobile Lighthouse run, and the current
> Astro/Cloudflare codebase.
>
> Created: November 13, 2026  
> Baseline window: October 15-November 13, 2026 (Datadog export)  
> Measurement platform: Cloudflare Analytics Engine dataset `earthquake_events`
> via `POST /api/events` and Worker page views

> **Datadog is being decommissioned (all products) on November 14, 2026.**
> Baseline numbers below come from the final Datadog export and cannot be
> re-queried. All new measurement is first-party on Cloudflare; see
> [Measurement Platform](#measurement-platform). Session Replay, frustration
> signals (dead/rage clicks), and Datadog monitors/Synthetics are gone.

---

## How To Use This Plan

This file is the source of truth for the 10x initiative. Update it in the same
pull request as the work it tracks.

### Status convention

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and verified in production
- `[!]` Blocked; add the blocker and owner beside the task

A task is not complete when code is merged. Mark it complete only after its
acceptance criteria pass in production and the relevant metric is visible in
Analytics Engine (or Workers Logs for server-side errors).

### Update header

When progress changes, update this block:

| Field | Value |
| --- | --- |
| Last updated | November 13, 2026 |
| Current phase | Phase 0 - Measurement foundation (Cloudflare) + Phase 1 quick wins |
| Current owner | TBD |
| Next review | TBD |
| Overall status | In progress - first batch code-complete, awaiting deploy |

### Weekly review checklist

- [ ] Review the north-star scorecard using `traffic = 'human'` only.
- [ ] Review new `js_error` and `asset_load_failed` events by version.
- [ ] Review feed, map, and alert delivery reliability.
- [ ] Review the top five landing route families and their activation rates.
- [ ] Review `welcome_dismissed`/city-selector drop-off (replaces Session Replay review).
- [ ] Record experiment decisions and update completed tasks here.
- [ ] Confirm bot/automation share of page views is stable and excluded from product metrics.

---

## Executive Decision

BayTremor should become the personalized local earthquake utility for Bay Area
households, not merely a broad earthquake dashboard.

The 10x loop is:

```text
Organic city/event visit
  -> immediate local answer
  -> save a city or address
  -> choose alert preferences
  -> receive a useful earthquake alert or digest
  -> return to BayTremor
  -> contribute a felt report or request a home risk report
```

The primary growth constraint is activation and retention, not a shortage of
SEO pages. The primary technical constraints are noisy analytics, fragile
client-side hydration, stale asset failures, and oversized historical data.

### North-star event

`area_activated`: a likely-human visitor saves a city/address and chooses at
least one useful recurring channel or preference.

An activation should include:

- A normalized city or geocoded location.
- An alert radius.
- A minimum magnitude.
- An alert channel: browser push, email, or a future native app.
- A stable anonymous or authenticated visitor ID.

### Supporting outcomes

1. Visitors get an immediate, trustworthy answer.
2. Visitors personalize the product without a forced tour.
3. Activated visitors receive relevant alerts, not generic noise.
4. Significant events create sharing and community-report loops.
5. Risk reports monetize high-intent users without degrading the core product.

---

## Baseline Findings

These measurements are directional and come from Datadog before its
shutdown. Datadog included substantial automation in traffic labeled as
`session.type:user`, so product baselines must be rebuilt from the new
Cloudflare pipeline after Phase 0. Treat these as the "before" values for
the first batch of fixes.

### Traffic and acquisition

- The identified external referral mix is overwhelmingly organic:
  - Google: 219 grouped events
  - DuckDuckGo: 41
  - Yahoo: 23
  - Bing: 16
- In a recent 100-session cohort, 57 sessions were obvious HeadlessChrome or
  crawler traffic.
- In that cohort, the remaining 43 likely-human sessions were:
  - 67% mobile/tablet
  - 72% single-view sessions
  - 42% without a recorded action
  - 11 seconds median duration
  - 12% with at least one frustration signal
- The sample is a bounded cohort, not a randomized population estimate.

### Product behavior

- `dashboard_ready`: 192 grouped events
- `feed_ready`: 182
- `feed_failed`: 13
- `map_ready`: 190
- `map_failed`: 4
- `risk_report_viewed`: 7
- No meaningful observed volume for `lead_submitted`, city activation, alert
  enrollment, waitlist conversion, or retained-user funnels.
- The forced welcome flow generated 38 `Skip tour` actions.
- Its "Welcome to Bay Tremor" container was the largest identifiable dead-click
  target, with 47 grouped events.

### Reliability

- Most RUM errors are telemetry noise:
  - CSP/report source: 385 grouped errors
  - Console/custom/source combined: 27
- Material non-report errors include:
  - Dynamic module import and Astro island hydration failures.
  - Missing dashboard, navigation, neighborhood, community, and history chunks.
  - `Failed to load full earthquake data`: 20 grouped errors.
  - Empty or non-JSON API responses.
  - Feed/API 403 and 499 errors.
- The existing p75 LCP monitor includes Synthetic/headless traffic and can
  produce misleading alerts.

### Performance

Datadog field averages:

| Metric | Broad RUM average | Homepage RUM average | Interpretation |
| --- | ---: | ---: | --- |
| Loading time | 1.49s | 1.77s | Good average, long tail exists |
| FCP | 0.69s | 0.37s | Good field average |
| LCP | 1.01s | 1.91s | Homepage is the main risk |
| CLS | 0.006 | 0.041 | Good average |
| INP | 60ms | 111ms | Good average |

Cold mobile Lighthouse:

| Category/metric | Baseline |
| --- | ---: |
| Performance score | 65 |
| Accessibility | 96 |
| Best practices | 73 |
| SEO | 100 |
| FCP | 3.5s |
| LCP | 5.7s |
| Speed Index | 7.2s |
| Total Blocking Time | 3ms |
| CLS | 0 |
| Total transfer | 1,080KiB |
| Estimated unused JavaScript | 178KiB |
| Estimated image savings | 168KiB |

The cold-load problem is primarily network discovery, third-party code, and
hydration/render delay rather than main-thread blocking.

### Payload and endpoint findings

- `/api/earthquakes/list?all=true` returned:
  - 9.4MB decoded JSON
  - About 1.27MB compressed transfer in RUM
  - Roughly 1.1-1.8s response duration before parsing/rendering
- The history page starts this full download about 150ms after mount.
- `/api/ios-waitlist` GET returns 404 because the route only implements POST,
  while the iOS page calls GET to retrieve a count.
- The homepage HTML bypasses edge HTML caching.
- HTML cache invalidation relies on manually changing `CACHE_VERSION`.
- Both apex and `www` hosts currently serve application HTML instead of using
  one canonical redirect.

---

## Target Scorecard

All product metrics must use likely-human production traffic: Analytics
Engine rows where `blob2 = 'human'` (client events) or `blob4 = 'human'`
(Worker page views). Classification happens server-side in
`src/lib/telemetry-shared.ts` (`classifyTraffic`) and excludes:

```text
cf.verifiedBotCategory (verified crawlers)
crawler user agents (bot, crawl, spider, preview, ...)
automation user agents (HeadlessChrome, Lighthouse, Playwright, curl, ...)
navigator.webdriver = true
internal/test traffic (localStorage bt-internal = 1)
```

| Metric | Current trustworthy baseline | 30-day target | 90-day target |
| --- | ---: | ---: | ---: |
| Human organic sessions | Rebuild in Phase 0 | Baseline + 20% | Baseline + 100% |
| Organic visit -> `area_activated` | Unknown | 5% | 8-12% |
| Activation -> alerts enabled | Unknown | 25% | 40%+ |
| Human single-view rate | About 72% sample | <65% | <55% |
| Human sessions with frustration | About 12% sample (Datadog, final) | Dropped - no replacement for dead/rage clicks | - |
| D7 activated-user return rate | Unknown | 10% | 15%+ |
| Feed successful initial loads | About 93% event ratio | >99% | >99.5% |
| Map successful loads | About 98% event ratio | >99% | >99.5% |
| JavaScript asset failures | Non-zero | <0.1% views | 0 sustained |
| Mobile p75 LCP | Rebuild in Phase 0 | <2.5s | <2.0s |
| Mobile p75 INP | Rebuild in Phase 0 | <200ms | <150ms |
| Initial history payload | 9.4MB decoded | <500KB | <250KB |
| Waitlist submit success | Unknown | >98% | >99% |
| Alert delivery success | Not measured | >99% | >99.5% |

Guardrails:

- Accessibility score remains at least 95.
- SEO score remains 100.
- No alerting feature implies official early warning.
- No monetization experiment worsens mobile p75 LCP by more than 100ms.
- No product funnel stores a raw address, email, or precise coordinates in
  analytics (enforced by `sanitizeProps`).

---

## Delivery Overview

| Phase | Theme | Target duration | Exit condition |
| --- | --- | ---: | --- |
| 0 | Measurement foundation | 1 week | Human funnel and trustworthy baselines exist |
| 1 | Reliability and correctness | 1-2 weeks | Core journeys work without chunk/API failures |
| 2 | Performance and architecture | 2 weeks | Mobile p75 and payload targets pass |
| 3 | Activation | 2-3 weeks | `area_activated` funnel is live |
| 4 | Retention and alerts | 3-4 weeks | Useful recurring alert loop is live |
| 5 | Organic growth and event loops | Ongoing | Landing pages consistently activate users |
| 6 | Monetization | After activation | Risk funnel converts without harming trust |

Dependencies:

```text
Phase 0 -> every other phase
Phase 1 -> Phase 3 and Phase 4
Phase 2 history work -> rich My Area/history experiences
Phase 3 -> Phase 4 and Phase 6
Phase 4 -> meaningful D7/D30 retention measurement
```

---

# Phase 0 - Measurement Foundation

**Goal:** Replace Datadog with a first-party Cloudflare pipeline trustworthy
enough to drive product decisions.

## 0.0 Export the Datadog baseline

**Priority:** P0 (deadline: November 14, 2026)  
**Owner:** Ramin (handled separately)

- [ ] Likely-human sessions, mobile share, single-view rate, median duration.
- [ ] Mobile p75 LCP/INP for the homepage and top five landing pages.
- [ ] JavaScript chunk/import failures grouped by URL and route.
- [ ] Feed/map failures by status (403, 499, non-JSON).
- [ ] Top landing pages and referrers.
- [ ] Weekly counts for existing product actions.
- [ ] Record the numbers in Baseline Findings.

## 0.1 Remove Datadog and add deployment versioning

**Priority:** P0  
**Primary files:** `src/layouts/BaseLayout.astro`, `src/lib/telemetry.ts`,
`wrangler.toml`

- [~] Remove `@datadog/browser-rum`, the RUM init script, and `datadog-rum.tsx`.
- [~] Remove Datadog origins from the CSP.
- [~] Add `version_metadata` binding (`CF_VERSION_METADATA`).
- [~] Emit `<meta name="app-version">` and tag every event with the page version.
- [ ] Delete Datadog monitors/Synthetics/dashboards before the account closes (or let them lapse).
- [ ] Remove `PUBLIC_DD_*`/`DD_*` values from local `.env` files and any CI/Workers settings.

Acceptance criteria:

- [ ] No request to `*.datadoghq.com` from any page.
- [ ] A production deployment is distinguishable from the previous deployment
  via `blob6` (version) in Analytics Engine.
- [ ] Product actions arrive in Analytics Engine after the change.

Result: the homepage no longer ships the 177KB (61KB gzip) RUM bundle; it is
replaced by a 16KB (5.9KB gzip) web-vitals script plus a ~4KB inline transport.

## 0.2 Separate humans, bots, and automation

**Priority:** P0

- [~] Classify traffic server-side (`classifyTraffic`) for client events.
- [~] Tag Worker page views with traffic class (`blob4`) and route family (`blob5`).
- [~] Support an internal-traffic flag (`localStorage.setItem('bt-internal', '1')`).
- [ ] Set the internal flag on all team devices.
- [ ] Build a saved query for human vs. bot vs. automation page views side by side.

Acceptance criteria:

- [ ] Human and automation totals are visible side by side.
- [ ] A Googlebot/HeadlessChrome request is classified as `bot`/`automation`.
- [ ] SEO crawler volume remains observable separately.

## 0.3 CSP report noise

**Status:** Descoped. The noise came from Datadog RUM capturing
`securitypolicyviolation` events; it disappears with RUM. Revisit only if the
CSP moves from report-only to enforced.

## 0.4 Define the product event taxonomy

**Priority:** P0  
**Primary files:** `src/lib/telemetry-shared.ts`, `src/lib/telemetry.ts`

The canonical event list lives in `PRODUCT_EVENTS` and `OPERATIONAL_EVENTS`.
Unknown event names are a TypeScript error on the client and are dropped by
the server.

- [~] Create a typed central event helper (`trackAction`, `trackError`).
- [~] Add `route_family`, `landing_route_family`, and `device_class` (server-derived).
- [~] Strip email/address/lat/lon/query/name keys (`sanitizeProps`).
- [~] Define stable route families (`routeFamily`).
- [~] Instrument `city_selector_opened`, `city_selected`, waitlist events.
- [ ] Instrument the remaining funnel events as their features ship (Phase 3+).
- [ ] Document event ownership and intended funnel use.

## 0.5 Build the product dashboard

**Priority:** P0

Analytics Engine has no built-in dashboard. Use the SQL API (saved queries
below) or a small Grafana/admin page.

- [ ] Likely-human sessions and unique anonymous visitors.
- [ ] Landing route families and referral source.
- [ ] City-selection and activation funnel.
- [ ] Core Web Vitals p75 by device and route family.
- [ ] `js_error` / `asset_load_failed` by version.
- [~] Scheduled check (cron + `EMAIL` binding) for asset failures and feed health,
  replacing Datadog monitors (see 1.5).
- [~] Weekly scorecard email covering the items above.

Phase 0 exit checklist:

- [ ] Datadog baseline exported and recorded.
- [ ] Human baseline rebuilt from Analytics Engine after one week of data.
- [ ] Bot and automation traffic are excluded from product decisions.
- [ ] A release can be compared against its predecessor.

## Measurement Platform

All rows go to Analytics Engine dataset `earthquake_events`.

Client events (`POST /api/events`, sent with `navigator.sendBeacon`):

| Column | Meaning |
| --- | --- |
| `index1`, `blob1` | Event name |
| `blob2` | Traffic class: `human`, `bot`, `automation`, `internal` |
| `blob3` | Route family of the current page |
| `blob4` | Landing route family for the session |
| `blob5` | Device class |
| `blob6` | Page version (`CF_VERSION_METADATA.id` of the HTML) |
| `blob7` | Country |
| `blob8` | Referral source (`google`, `bing`, `direct`, host, ...) |
| `blob9` | Session ID (sessionStorage) |
| `blob10` | Anonymous visitor ID (localStorage) |
| `blob11` | Sanitized JSON properties |
| `blob12` | Metric label for `web_vital` rows (`LCP`, `INP`, `CLS`, `FCP`, `TTFB`) |
| `double1` | Value (web-vital value, duration, ...) |

Browser page views use `blob1 = 'client_page_view'`. Worker HTML requests: `blob1 = 'page_view'`, `blob2` country, `blob3` cache
hit/miss, `blob4` traffic class, `blob5` route family, `double1` status,
`double2` duration ms.

Example queries:

```sql
-- Human landing sessions by route family, last 7 days
SELECT blob4 AS landing, count(DISTINCT blob9) AS sessions
FROM earthquake_events
WHERE blob1 = 'client_page_view' AND blob2 = 'human' AND timestamp > NOW() - INTERVAL '7' DAY
GROUP BY landing ORDER BY sessions DESC;

-- Mobile p75 LCP by route family
SELECT blob3 AS route, quantileExactWeighted(0.75)(double1, _sample_interval) AS p75_lcp_ms
FROM earthquake_events
WHERE blob1 = 'web_vital' AND blob12 = 'LCP' AND blob2 = 'human' AND blob5 = 'mobile'
  AND timestamp > NOW() - INTERVAL '7' DAY
GROUP BY route;

-- Asset failures by page version
SELECT blob6 AS version, sum(_sample_interval) AS failures
FROM earthquake_events
WHERE blob1 = 'asset_load_failed' AND timestamp > NOW() - INTERVAL '1' DAY
GROUP BY version;
```

---

# Phase 1 - Reliability and Correctness

**Goal:** Eliminate failures that break trust or make the app appear blank.

## 1.1 Eliminate stale JavaScript chunks

**Priority:** P0  
**Estimate:** 2-3 days  
**Primary files:** `src/middleware.ts`, deployment configuration

- [~] Correlate import failures with release versions (`asset_load_failed` carries page version).
- [~] Replace manually maintained `CACHE_VERSION` with `CF_VERSION_METADATA.id`.
- [~] Ensure HTML cache keys change automatically on deployment.
- [~] Serve HTML to browsers with `max-age=0, must-revalidate` (edge copy keeps 10 min TTL).
- [x] Retaining old hashed assets: not possible with Workers Static Assets; covered by the two items above.
- [~] Add canonical 301 redirect from `www.baytremor.com` to `baytremor.com`.
- [~] Add a reload-once recovery path for failed dynamic imports (`vite:preloadError`, chunk errors).
- [x] Verify service worker caches are not retaining obsolete HTML (no service worker exists).
- [~] Add a deployment smoke test for current HTML asset references (`npm run smoke -- <url>`).

Acceptance criteria:

- [ ] Deploy twice in succession without any missing current/previous chunks.
- [ ] JavaScript asset failure monitor remains at zero for seven days.
- [ ] Apex is the only indexable/rendering host.
- [ ] Browser refresh recovers safely after an intentionally simulated stale page.

## 1.2 Reduce the client-only failure domain

**Priority:** P0  
**Estimate:** 3-5 days  
**Primary files:** `src/pages/index.astro`,
`src/components/dashboard-with-providers.tsx`,
`src/components/dashboard/*`

- [ ] Render the headline, current status, latest quake, and primary CTA in Astro.
- [ ] Preserve useful content without JavaScript.
- [ ] Hydrate map, filters, city selector, and live updates as separate islands.
- [ ] Give each major island a local error boundary and fallback.
- [ ] Ensure a map failure cannot remove the feed or activation CTA.
- [ ] Ensure a community/history failure cannot remove the live dashboard.
- [ ] Keep server and hydrated content semantically consistent.
- [ ] Add stable data-state selectors for Synthetic assertions.

Acceptance criteria:

- [ ] With JavaScript disabled, the latest earthquake and safety links are useful.
- [ ] Blocking the map chunk leaves the feed and CTA usable.
- [ ] Blocking a secondary island does not trigger a full-dashboard fallback.
- [ ] No hydration mismatch appears in Chrome or Safari.

## 1.3 Fix the iOS waitlist contract

**Priority:** P0  
**Estimate:** 0.5 day  
**Primary files:** `src/components/ios-coming-soon.tsx`,
`src/pages/api/ios-waitlist/index.ts`

- [~] Add a safe GET count response.
- [~] Align POST response fields with the component contract (`message`, `isNew`).
- [~] Handle duplicate signups explicitly (`ON CONFLICT DO NOTHING`, 200 + `isNew: false`).
- [~] Add submit started/success/failure events.
- [ ] Add rate limiting and bot protection (Turnstile).
- [~] Add an API check (covered by `npm run smoke`).

Acceptance criteria:

- [ ] GET no longer returns 404 during a normal iOS page visit.
- [ ] A valid submission returns the expected success message.
- [ ] Duplicate submission behavior is clear and idempotent.
- [ ] No raw email is sent to RUM.

## 1.4 Harden feed and map reliability

**Priority:** P0  
**Estimate:** 2-3 days

- [ ] Break down `feed_failed` by status, source, and operation.
- [ ] Investigate observed 403 and 499 responses.
- [ ] Distinguish fresh cache, stale cache, upstream, and unavailable states.
- [ ] Pause or slow polling when the page is hidden.
- [ ] Avoid full-rate fallback polling while WebSocket delivery is healthy.
- [ ] Add jitter/backoff to retries.
- [ ] Track WebSocket connected, reconnecting, and fallback states.
- [ ] Track map module failures separately from individual tile failures.
- [ ] Verify delayed data is labeled rather than presented as live.

Acceptance criteria:

- [ ] Feed and map success exceed 99% over seven days.
- [ ] No hidden tab polls every minute indefinitely.
- [ ] A USGS outage serves last-known data with an accurate delayed label.
- [ ] A map tile outage leaves earthquake facts usable.

## 1.5 Correct monitoring gaps

**Priority:** P1  
**Estimate:** 1 day

Datadog monitors and Synthetics are gone. Replacements run in the Worker cron
(`src/lib/monitor.ts`), every 15 minutes, emailing via the `EMAIL` binding from
`alerts@baytremor.com`. Each check alerts at most once per 3 hours.

Setup (one time):

```bash
# Token: Account > Account Analytics > Read
npx wrangler secret put CF_ANALYTICS_TOKEN
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put OPS_ALERT_EMAIL
```

Without `CF_ANALYTICS_TOKEN`/`CF_ACCOUNT_ID` only the feed check runs. Without
`OPS_ALERT_EMAIL` findings are only logged to Workers Logs.

- [~] Feed freshness: last-known `all_hour` USGS feed older than 10 minutes.
- [~] Asset failures: 5+ human `asset_load_failed` in 15 minutes.
- [~] JavaScript errors: 25+ human `js_error` in 15 minutes.
- [~] Feed/map failure rate above 5% (minimum 20 loads in 15 minutes).
- [~] Waitlist: 3+ `waitlist_failed` in 15 minutes.
- [~] Telemetry silent: zero human `client_page_view` in 6 hours.
- [~] Weekly scorecard email (Mondays after 16:00 UTC) replacing the Datadog dashboard.
- [~] Enable `observability.traces` (10% head sampling).
- [ ] External uptime check for `/` and `/api/earthquakes` (the cron cannot detect a Worker-wide outage).
- [ ] History endpoint payload/latency (Workers Logs or `Server-Timing`).
- [ ] Alert pipeline freshness after Phase 4.
- [ ] Tune thresholds after two weeks of real data.

Runbooks:

| Check | First steps |
| --- | --- |
| `feed_stale` / `feed_missing` | Workers Logs for `[cron]` errors; check USGS status; confirm cron trigger is active in the dashboard. |
| `asset_failures` | Run `npm run smoke -- https://baytremor.com`; group `asset_load_failed` by `blob6` version. A previous version means stale HTML; the current version means a broken deploy, so roll back with `wrangler rollback`. |
| `js_errors` | Group `js_error` by message (`blob11`) and version (`blob6`); roll back if it started with a deploy. |
| `feed_failures` / `map_failures` | Check `/api/earthquakes` and `/api/map-tiles` in Workers Logs; check KV and upstream (USGS, CARTO). |
| `waitlist_failures` | Workers Logs for `[api/ios-waitlist POST]`; check D1 status. |
| `telemetry_silent` | Load the site; check `/api/events` returns 204 with a same-origin `Origin` header. |

## 1.6 Map quality and self-hosted basemap

**Priority:** P1  
**Estimate:** 0.5 day (layout) + 3-4 days (vector basemap)

The live map rendered at 400px inside a 500px card (`h-full` under a
`min-h` parent), leaving a dead strip under the map with the legend in it.
Blur comes from CARTO raster tiles being upscaled during zoom/`flyTo`, not
from tile-proxy load (proxy serves @2x tiles from edge cache in ~0.2-0.3s).

- [~] Give the live map a definite height so Leaflet fills the card.
- [~] Bundle `leaflet.css` with the map chunks instead of loading it from unpkg
  (and drop unpkg from the CSP).
- [~] Hide the mouse-click focus ring on the map container.
- [ ] Cut a Bay Area Protomaps PMTiles extract (bbox `-123,36.8,-121,38.5`) and
  upload it to R2.
- [ ] Serve tiles from R2 through the Worker with edge caching.
- [ ] Port `leaflet-map`, `earthquake-detail-map`, and `fault-map` to MapLibre GL
  with a dark Protomaps style; render faults as a vector layer.
- [ ] Remove the CARTO tile proxy and `CARTO_API` secret.

Acceptance criteria:

- [ ] Map fills its card with the legend overlaid at all breakpoints.
- [ ] Labels and roads stay sharp at every zoom level on retina displays.
- [ ] Basemap has no third-party per-tile cost or commercial-license dependency.
- [ ] `map_ready` / `map_failed` ratio does not regress after the MapLibre switch.

Phase 1 exit checklist:

- [ ] Zero sustained current-release asset failures.
- [ ] Core content survives individual island failures.
- [ ] Feed/map initial-load success exceeds 99%.
- [ ] Waitlist endpoint contract is correct.
- [ ] Critical monitors have actionable runbooks.

---

# Phase 2 - Performance and Architecture

**Goal:** Make cold mobile loads fast and prevent data size from scaling with
the full earthquake archive.

## 2.1 Redesign historical data delivery

**Priority:** P0  
**Estimate:** 4-6 days  
**Primary files:** `src/pages/api/earthquakes/list.ts`,
`src/components/history-feed.tsx`,
`src/hooks/use-historical-earthquakes.ts`

- [ ] Define separate endpoints for recent rows, summaries, and map aggregates.
- [ ] Add cursor pagination.
- [ ] Add server-side date range, magnitude, region, and bounds filters.
- [ ] Return only fields required by each surface.
- [ ] Precompute yearly/monthly/region aggregates during ingestion.
- [~] Do not load the full archive 150ms after history mount.
- [~] Load detailed rows only after explicit user intent ("Load Swarm Analysis" button).
- [ ] Stop the `/history` page server render from loading the full archive on every request.
- [ ] Add request cancellation and deduplication.
- [ ] Add cache validators and a documented cache policy.
- [ ] Measure response size, Worker CPU, D1/R2 reads, and client parse time.

Acceptance criteria:

- [ ] Initial history response is below 500KB at Phase 2 launch.
- [ ] 90-day target design supports below 250KB.
- [ ] No default client request returns the full 9.4MB document.
- [ ] Filters operate server-side.
- [ ] History remains usable on a throttled mobile connection.

## 2.2 Improve homepage LCP

**Priority:** P0  
**Estimate:** 2-4 days

- [ ] Identify p75 LCP elements by mobile route/version.
- [ ] Keep the initial LCP candidate server-rendered through hydration.
- [ ] Avoid replacing above-the-fold fallback content unnecessarily.
- [ ] Split the dashboard bundle by immediately visible functionality.
- [ ] Defer Leaflet until the map approaches the viewport or idle time.
- [ ] Confirm fonts do not delay text rendering.
- [ ] Keep layout dimensions stable.
- [ ] Compare production p75 before and after release.

Acceptance criteria:

- [ ] Mobile p75 LCP is below 2.5s for seven days.
- [ ] Cold mobile Lighthouse LCP is below 3.0s.
- [ ] CLS remains below 0.1.
- [ ] No regression in feed or map readiness.

## 2.3 Control third-party cost

**Priority:** P1  
**Estimate:** 2 days

- [ ] Measure AdSense revenue against LCP and engagement impact.
- [ ] Load ads after LCP or near an approaching ad slot.
- [ ] Remove ad code from routes without an actual slot.
- [ ] Lazy-load affiliate recommendations below the fold.
- [ ] Resize/proxy eligible affiliate images.
- [ ] Prefer modern image formats where partner terms permit.
- [ ] Remove unused preconnects and third-party origins.
- [ ] Track third-party bytes by release.

Acceptance criteria:

- [ ] At least 150KiB estimated unused cold-load JavaScript is removed/deferred.
- [ ] At least 150KiB image savings is realized on the audited mobile page.
- [ ] Monetization revenue is measured before and after the change.
- [ ] Ads do not move mobile p75 LCP by more than 100ms.

## 2.4 Improve edge response behavior

**Priority:** P1  
**Estimate:** 2 days

- [ ] Decide which homepage data can be edge-cached for 30-60 seconds.
- [ ] Separate a cacheable shell from live client refresh if needed.
- [ ] Add `Server-Timing` for Worker render, KV, D1, R2, and upstream calls.
- [ ] Verify Brotli/gzip behavior for JSON and JavaScript.
- [ ] Use stale-while-revalidate where correctness permits.
- [ ] Prevent per-user data from entering shared HTML caches.
- [ ] Track cache hit ratio by route family.

Phase 2 exit checklist:

- [ ] Cold mobile Lighthouse performance is at least 85.
- [ ] Mobile p75 LCP is below 2.5s.
- [ ] Initial historical payload is below 500KB.
- [ ] Third-party code is deferred until it creates user or business value.
- [ ] Performance results are recorded in this document.

---

# Phase 3 - Activation

**Goal:** Turn one-off organic visits into personalized local users.

## 3.1 Replace the forced welcome tour

**Priority:** P0  
**Estimate:** 1-2 days  
**Primary files:** `src/components/dashboard/prompts.tsx`,
`src/components/dashboard/index.tsx`

- [~] Remove the automatic full-screen modal after three seconds.
- [ ] Preserve an optional help/explainer entry point.
- [ ] Add a compact inline "Monitor my area" card after initial value
  (the hero "Set Your City" card exists and is now instrumented).
- [ ] Make dismissal non-blocking and persistent.
- [ ] Track viewed, dismissed, started, and completed states explicitly.
- [ ] Run an A/B comparison if traffic supports it.

Acceptance criteria:

- [ ] No first-time visitor is blocked by a modal.
- [~] Welcome-flow dead clicks fall by at least 80% (modal removed; no dead-click telemetry after Datadog).
- [ ] City/address activation does not decrease.
- [ ] Help remains discoverable.

## 3.2 Build the `Monitor my area` flow

**Priority:** P0  
**Estimate:** 4-6 days

Shipped as `src/components/monitor-area.tsx` (homepage card under the hero),
`/api/alerts`, and D1 table `push_subscriptions` (migration 0004).

- [~] Support city selection without requesting precise location (city-only by decision).
- [ ] Support address search as an optional higher-precision path (deferred).
- [~] Explain the permission prompt and storage before asking.
- [~] Defaults: M3.0+ within 25 mi; options 10/25/50 mi and M2.5/3.0/3.5/4.0.
- [~] Let users edit preferences before saving.
- [~] Persist preferences server-side (push subscription) and locally (`bt-alert-prefs`).
- [~] Emit `area_activated` only after the subscription is stored.
- [~] Privacy copy: city only, never precise location; not an official early warning.
- [~] Turn-off control (unsubscribes in the browser and deletes the D1 row).

Acceptance criteria:

- [ ] Activation can be completed on mobile in under 60 seconds.
- [ ] City-only activation requires no geolocation permission.
- [ ] Saved preferences survive a return visit.
- [ ] Raw address is absent from Datadog.
- [ ] Funnel drop-off is visible at every step.

## 3.3 Create intent-specific landing CTAs

**Priority:** P0  
**Estimate:** 3-5 days

Route-specific intent:

| Route family | Primary visitor question | Primary CTA |
| --- | --- | --- |
| `/earthquake/:id` | What just happened? | Monitor quakes near me |
| `/:city-earthquake-today` | Was there a quake near my city? | Alert me about this city |
| `/city/:city` | What is local seismic activity? | Save this city |
| `/risk/:city` | How exposed is my home? | Check my address |
| `/` | What is happening now? | Monitor my area |
| `/history` | What patterns exist? | Save a region |

Shipped as `MonitorAreaIsland` (`client:visible`, 4KB gzip) on `/:city-earthquake-today`,
`/:city-earthquakes-:year`, `/city/:city`, `/region/:id`, `/earthquake/:id`, and `/today`,
placed directly after each page's immediate answer.

- [~] Add one dominant CTA per route family (route-specific headline; `source` tags each surface).
- [~] Pre-fill known city context (URL city, or nearest city within 30 mi for events).
- [~] Keep the immediate answer above the CTA.
- [ ] Remove competing above-the-fold promotions.
- [~] Track CTA impression (`alert_offer_viewed`) and completion (`area_activated`) by `source` and route family.
- [ ] Add internal links from SEO pages to the relevant local action.
- [ ] `/risk/:city` CTA ("Check my address") still points at the risk report only.

Acceptance criteria:

- [ ] Every top landing route has one measurable primary action.
- [ ] Activation rate is reportable by route family.
- [ ] No CTA requires users to re-enter city context already known from the URL.

## 3.4 Improve My Area as the activated home

**Priority:** P1  
**Estimate:** 3-5 days

- [ ] Make saved area/activity the default return experience.
- [ ] Show latest nearby quake, distance, and freshness first.
- [ ] Show alert preferences and status clearly.
- [ ] Show nearest mapped fault/risk context without alarmist language.
- [ ] Offer the home risk report after local value is established.
- [ ] Add a useful empty/calm state.
- [ ] Keep the initial payload bounded.

Phase 3 exit checklist:

- [ ] Human organic -> `area_activated` reaches at least 5%.
- [ ] The forced tour is removed.
- [ ] Top landing pages have intent-specific CTAs.
- [ ] Activated users have a useful My Area return surface.

---

# Phase 4 - Retention and Alerts

**Goal:** Give activated users a reason to return without creating alert fatigue.

## 4.1 Launch browser and email alerts

**Priority:** P0  
**Estimate:** 5-8 days

- [x] Choose browser push, email, or both for the first release (browser push first).
- [~] Ask for browser notification permission only after user intent (button in the sheet).
- [~] Support radius and minimum-magnitude thresholds.
- [~] Deduplicate alerts by earthquake ID and subscription (`push_deliveries`).
- [ ] Respect quiet hours where appropriate.
- [~] Provide unsubscribe/disable controls (Turn off in the sheet).
- [~] Record delivered/failed/expired states (`alert_delivery` rows in Analytics Engine).
- [ ] Record notification opens (`utm_source=push` landing is tracked; add an explicit event).
- [~] Retry transient failures up to 3 queue attempts; delete 404/410 or 10 consecutive failures.
- [ ] Add a delivery canary (internal subscription + monitor check).
- [~] Clearly state that BayTremor is not official early warning.
- [ ] iOS: alerts require Add to Home Screen; the card shows instructions. Measure how many iOS visitors complete it.
- [ ] Email channel as a fallback for iOS visitors who will not install.

Implementation notes:

- Encryption must be RFC 8291 `aes128gcm`; Apple's push service rejects
  legacy `aesgcm`. Uses `@block65/webcrypto-web-push`.
- VAPID public key is `VAPID_PUBLIC_KEY` in `wrangler.toml`; the private key
  is the `VAPID_PRIVATE_JWK` secret. Rotating keys invalidates all subscriptions.
- The cron enqueues Bay Area M2.5+ quakes; APNs still applies its M3.0 floor
  and sends only on the first queue attempt.
- `/api/alerts` accepts only FCM, Mozilla, Windows, and Apple push endpoints (SSRF guard).

Acceptance criteria:

- [ ] Activation -> alerts enabled reaches at least 25%.
- [ ] Delivery success exceeds 99%.
- [ ] Duplicate alert rate is zero in normal operation.
- [ ] Unsubscribe works immediately.
- [ ] Alert facts match the canonical earthquake event.

## 4.2 Add a weekly local activity digest

**Priority:** P1  
**Estimate:** 3-5 days

- [ ] Generate a concise saved-area summary.
- [ ] Include meaningful changes, not a generic zero-value email.
- [ ] Link to My Area and notable events.
- [ ] Track delivery, opens, clicks, and unsubscribes.
- [ ] Suppress the digest when there is no useful content.
- [ ] Add frequency controls.

## 4.3 Build significant-event return loops

**Priority:** P1  
**Estimate:** 3-5 days

- [ ] Define significant-event thresholds by location and magnitude.
- [ ] Prioritize "Did you feel it?" after relevant events.
- [ ] Make event pages easily shareable with accurate metadata.
- [ ] Show community reports without overstating anecdotal data.
- [ ] Invite users to save the affected area after reporting.
- [ ] Track alert -> event view -> felt report -> activation.

## 4.4 Measure retention

- [ ] Define anonymous user identity behavior across devices/sessions.
- [ ] Add D1, D7, D30 cohorts for activated users.
- [ ] Compare alert-enabled and non-alert cohorts.
- [ ] Compare city-only and address users.
- [ ] Track churn/unsubscribe reasons.
- [ ] Review alert thresholds based on retention and unsubscribe data.

Phase 4 exit checklist:

- [ ] Alert delivery is production-ready and monitored.
- [ ] Activation -> alerts enabled reaches 25% or more.
- [ ] D7 activated-user return rate reaches 10% or more.
- [ ] Alert fatigue and unsubscribe metrics are visible.

---

# Phase 5 - Organic Growth and Event Loops

**Goal:** Convert existing search visibility into durable user growth.

## 5.1 Establish SEO-to-activation reporting

- [ ] Group landing pages by city, today, event, risk, fault, and history.
- [ ] Report impressions/clicks from Search Console alongside RUM activation.
- [ ] Identify pages with traffic but weak activation.
- [ ] Identify pages with strong activation but low search visibility.
- [ ] Prioritize improvements using activated users, not page views alone.
- [ ] Track apex versus `www` canonical consolidation.

## 5.2 Improve top organic templates

- [ ] Answer the query in the first viewport.
- [ ] Display freshness/source timestamps.
- [ ] Add useful city-specific facts rather than repeated template copy.
- [ ] Add relevant internal links to event, risk, fault, and My Area surfaces.
- [ ] Add one route-specific activation CTA.
- [ ] Avoid doorway-page duplication.
- [ ] Validate structured data and canonicals.
- [ ] Monitor index coverage and crawl errors.

## 5.3 Create event-driven distribution

- [ ] Generate accurate event share cards.
- [ ] Add copy-link and native-share actions.
- [ ] Add embeddable or social-ready local summaries where appropriate.
- [ ] Track share completion and referred activation.
- [ ] Prepare a significant-event operating checklist.
- [ ] Avoid sensational or predictive wording.

## 5.4 Build community value carefully

- [ ] Improve felt-report completion and moderation.
- [ ] Show report count and intensity summaries with appropriate caveats.
- [ ] Add anti-spam/rate limiting.
- [ ] Link contributors back to saved-area activation.
- [ ] Measure whether community features increase retention.

Phase 5 exit checklist:

- [ ] Organic activation is visible by route template.
- [ ] Human organic sessions grow at least 20% from the clean baseline.
- [ ] SEO pages answer intent and lead to a relevant recurring use case.
- [ ] Share/referral loops are measurable.

---

# Phase 6 - Monetization Without Trust Loss

**Start condition:** Phase 3 activation metrics are trustworthy and the core
experience meets reliability/performance guardrails.

## 6.1 Complete the risk-report funnel

- [ ] Track report start, completion, CTA click, form start, and lead submit.
- [ ] Report conversion by risk band and route family.
- [ ] Ensure claims are sourced and non-alarmist.
- [ ] Keep raw address and contact details out of RUM.
- [ ] Add explicit consent and privacy handling.
- [ ] Validate lead delivery and failure recovery.
- [ ] Define partner quality standards.

## 6.2 Test intent-aligned offers

- [ ] Retrofit for structurally relevant/high-risk contexts.
- [ ] Insurance education where standard coverage exclusions are relevant.
- [ ] Preparedness plans/products for broader audiences.
- [ ] Show one dominant offer based on context.
- [ ] Measure revenue per human session and per activated user.
- [ ] Track downstream quality, not only clicks.

## 6.3 Rationalize ads and affiliate modules

- [ ] Remove or defer placements that do not earn meaningful revenue.
- [ ] Prevent ads from competing with safety information or activation.
- [ ] Keep affiliate disclosure visible.
- [ ] Enforce performance guardrails per experiment.
- [ ] Compare revenue against retention and Core Web Vitals.

Phase 6 exit checklist:

- [ ] Revenue is attributable to a documented funnel.
- [ ] Lead submit success exceeds 99%.
- [ ] No monetization experiment violates performance guardrails.
- [ ] No misleading fear-based copy is used.

---

## Experiment Backlog

Run only after Phase 0 supplies trustworthy cohorts.

| ID | Hypothesis | Primary metric | Guardrail | Status |
| --- | --- | --- | --- | --- |
| EXP-01 | Inline activation beats the forced tour | `area_activated` rate | Frustration rate | [ ] |
| EXP-02 | "Monitor my area" beats "Set my city" | Activation rate | Bounce rate | [ ] |
| EXP-03 | Pre-filled city CTAs improve SEO landing activation | Activation by route | Search engagement | [ ] |
| EXP-04 | Delaying AdSense until after LCP improves engagement | Engaged/activated sessions | Revenue/session | [ ] |
| EXP-05 | Browser alerts outperform iOS waitlist promotion | Alert enable rate | Permission denial | [ ] |
| EXP-06 | A weekly digest increases D7/D30 return | Retention | Unsubscribe rate | [ ] |
| EXP-07 | Local risk context increases report completion | Report completion | Frustration/trust | [ ] |
| EXP-08 | Event share cards increase referred activation | Referred activations | Accuracy | [ ] |

Experiment rules:

- [ ] Define one primary metric before launch.
- [ ] Define at least one user-experience guardrail.
- [ ] Record sample size and date range.
- [ ] Segment bots and Synthetics out.
- [ ] Do not call a result from tiny or highly event-driven samples.
- [ ] Record keep/iterate/stop decisions in this file.

---

## Production Verification Matrix

Run this matrix for every release touching the associated surface.

| Journey | Desktop | Mobile | No JS/degraded | Synthetic | RUM event |
| --- | --- | --- | --- | --- | --- |
| Homepage answer visible | [ ] | [ ] | [ ] | [ ] | [ ] |
| Live feed loads | [ ] | [ ] | N/A | [ ] | [ ] |
| Map loads/fails locally | [ ] | [ ] | N/A | [ ] | [ ] |
| City selection | [ ] | [ ] | [ ] | [ ] | [ ] |
| Area activation | [ ] | [ ] | [ ] | [ ] | [ ] |
| Alert enrollment | [ ] | [ ] | N/A | [ ] | [ ] |
| History first page/filter | [ ] | [ ] | [ ] | [ ] | [ ] |
| Risk report | [ ] | [ ] | [ ] | [ ] | [ ] |
| iOS waitlist | [ ] | [ ] | [ ] | [ ] | [ ] |
| Felt report | [ ] | [ ] | [ ] | [ ] | [ ] |

Required release checks:

- [ ] `npm run check` (CI)
- [ ] `npm run build` (CI)
- [ ] `wrangler deploy --dry-run` (CI)
- [ ] `npm run smoke -- https://baytremor.com` after deploy
- [ ] Homepage cold mobile Lighthouse
- [ ] New version appears in Analytics Engine `blob6`
- [ ] No new `js_error`/`asset_load_failed` spike after deployment
- [ ] Core funnel events arrive without PII

---

## Decision Log

Record material scope or metric decisions here.

| Date | Decision | Reason | Owner |
| --- | --- | --- | --- |
| 2026-11-13 | Use `area_activated` as the north-star event | Converts one-off search traffic into a recurring local utility | TBD |
| 2026-11-13 | Fix analytics hygiene before experiments | Current RUM cohorts include substantial bots/Synthetics and CSP noise | TBD |
| 2026-11-13 | Prioritize activation/retention over more page templates | Organic discovery exists; recurring value and conversion are weakly measured | TBD |
| 2026-11-13 | Treat cold mobile and tail latency as the performance problem | Field averages are good, but homepage p75/cold Lighthouse are weak | TBD |
| 2026-11-13 | Replace Datadog with Cloudflare Analytics Engine + Workers Logs | Datadog is decommissioned November 14, 2026 | Ramin |
| 2026-11-13 | Store `area_activated` and alert state in D1, not analytics | Activation is a durable record; D7/D30 retention can be computed from it exactly | Ramin |
| 2026-11-13 | Drop frustration-rate target; descope CSP noise task | No replacement for Session Replay/dead clicks; CSP noise came from RUM | Ramin |
| 2026-11-13 | Prefer before/after comparisons over A/B tests | Human traffic volume is too low for significance in most experiments | Ramin |

---

## Completed Work Log

Add one row only after production verification.

| Date | Task ID | Result | Evidence/release |
| --- | --- | --- | --- |
| - | - | No 10x-plan tasks completed yet | - |

---

## Immediate Next 10 Tasks

This is the recommended execution order after the Datadog shutdown.

1. [ ] `0.0` Export the Datadog baseline before November 14 (owner: Ramin).
2. [~] `1.1` Deploy-versioned cache keys, `max-age=0` HTML, chunk-failure reload, `www` redirect.
3. [~] `0.1`/`0.2`/`0.4` Remove RUM; ship `/api/events` with server-side bot classification and typed events.
4. [~] Web-vitals and JavaScript error beacons.
5. [~] `3.1` Remove the forced first-visit modal; instrument city selection.
6. [~] `1.3` Fix the iOS waitlist GET/POST contract.
7. [~] `2.1` Stop the automatic full-history download.
8. [~] CI (`astro check`, build, dry-run deploy) and `npm run smoke`.
9. [~] `0.5`/`1.5` Cron health checks with email alerts + weekly scorecard email (needs secrets; see 1.5).
10. [~] `3.2`/`4.1` "Monitor my area" with browser push alerts (city-only, M3.0+/25 mi defaults).

Also fixed while getting `astro check` to zero errors (verify after deploy):

- `/api/ai-summary` threw `ReferenceError: trackAiSummary is not defined` on every call.
- Comment replies posted as top-level comments (UI used Mongo-era `_id`; D1 returns `id`),
  and newly posted comments never appeared (UI waited for a removed Pusher event).
- `/region/:unknown` called `Astro.redirect` with status 404; now returns a 404 response.

---

## Related Documents

- `docs/datadog-monitoring.md` (historical; Datadog decommissioned November 14, 2026)
- `docs/ARCHITECTURE-BEFORE-AFTER.md`
- `docs/MONETIZATION-IMPLEMENTATION.md`
- `docs/DESIGN-SYSTEM-LEADGEN.md`
- `docs/AI-INTELLIGENCE-ROADMAP.md`
- `SPRINT-PLAN-DETAILED.md`

This plan supersedes older traffic counts, performance assumptions, and task
status where production data or the current Astro/Cloudflare architecture
conflicts with legacy Next.js-era documentation.
