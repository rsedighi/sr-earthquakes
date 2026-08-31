# BayTremor Datadog Reliability Monitoring

This document describes the production monitoring implemented for [baytremor.com](https://baytremor.com), how the monitors work, and the remaining reliability work.

## Current status

Phase 1 monitoring was implemented and deployed on August 30, 2026.

- Datadog RUM application: `BayTremor.com`
- RUM application ID: `47574ad1-d09e-4701-bc66-7b08bac0486f`
- Service: `BayTremor` (normalized by Datadog as `baytremor`)
- Environment: `prod`
- Reliability dashboard: [BayTremor Reliability](https://app.datadoghq.com/dashboard/zzv-xkz-xku/baytremor-reliability)
- Dashboard ID: `zzv-xkz-xku`
- Initial production deployment: `eb60c6fd-8ae5-4fe0-9980-e0bdfbabe0c9`
- Cache-invalidation deployment: `d195d967-d906-476d-b91e-53cf5b3dff26`

At completion, all four Synthetic tests passed in N. California and Oregon. Ten monitors were `OK`; the JavaScript asset-failure monitor was `No Data` because no matching failures had occurred. It does not notify on missing data.

## Credentials and security

Datadog credentials are stored in the ignored local `.env` file and must not be committed.

Browser RUM uses only public browser credentials:

```env
PUBLIC_DD_APPLICATION_ID=<rum-application-id>
PUBLIC_DD_CLIENT_TOKEN=<rum-client-token>
PUBLIC_DD_SITE=datadoghq.com
PUBLIC_DD_ENV=prod
PUBLIC_DD_VERSION=<release-version>
```

Datadog API automation uses server-side credentials:

```env
DD_API_KEY=<datadog-api-key>
DD_APP_KEY=<scoped-datadog-application-key>
```

The application key should be scoped to:

- `monitors_read`, `monitors_write`
- `dashboards_read`, `dashboards_write`
- `synthetics_read`, `synthetics_write`

Never expose `DD_API_KEY` or `DD_APP_KEY` in browser code, Wrangler configuration, logs, documentation values, or committed files.

## Why HTTP uptime is insufficient

The homepage dashboard is a client-only React island. A visitor can receive HTTP `200` and valid HTML while the dashboard remains blank because of a missing JavaScript chunk, stale cached HTML, hydration failure, or runtime crash.

The monitoring stack therefore checks multiple layers:

1. HTTP and edge availability.
2. Browser rendering and React hydration.
3. Earthquake feed availability and freshness.
4. Map module and tile availability.
5. Real-user JavaScript errors and performance.
6. Product actions and explicit application readiness signals.

## Application instrumentation

### Dashboard readiness

The dashboard renders a stable `#baytremor-dashboard` element with:

- `data-monitor-state="ready"`
- `data-feed-state="loading|ready|error"`

It emits `dashboard_ready` after the initial feed request completes.

Implementation: `src/components/dashboard/index.tsx`

### Server-rendered fallback

The homepage includes a server-rendered fallback with `data-monitor-state="loading"`. This prevents a completely empty body while the React island loads and gives Synthetic tests a stable intermediate state.

Implementation: `src/pages/index.astro`

### Feed telemetry

The realtime earthquake hook emits:

- `feed_ready` on a successful initial load
- `feed_failed` when loading or refreshing fails
- A RUM error containing the feed and operation

`feed_ready` includes earthquake count, request latency, and source age when USGS metadata is available.

Implementation: `src/hooks/use-realtime-earthquakes.ts`

### Map telemetry

The primary map exposes `data-map-state="loading|ready|error"` and emits:

- `map_ready` after Leaflet tiles load
- `map_failed` when the Leaflet module or a tile fails
- A RUM error with module-load or tile-load context

A module-loading failure displays `Map temporarily unavailable` rather than leaving an indefinite spinner.

Implementation: `src/components/leaflet-map.tsx`

### React crash telemetry

The dashboard error boundary now sends rendering errors to Datadog with the React component stack and emits `error_boundary_rendered`. Its fallback has `data-monitor-state="error"` so the browser test can detect it.

Implementation: `src/components/error-boundary.tsx`

### Safe RUM helpers

RUM helpers now verify that Datadog has initialized before recording actions, errors, users, views, or feature flags. Calls safely no-op if RUM is unavailable.

The initialized SDK is exposed as both `window.__ddRum` and `window.DD_RUM` to support existing product-event instrumentation.

Implementations:

- `src/components/datadog-rum.tsx`
- `src/layouts/BaseLayout.astro`

### Scheduled ingestion fix

The scheduled USGS ingestion path previously called `trackNewQuake` without importing it and used an incomplete environment type. This could throw when a new earthquake was detected before WebSocket broadcast and push notification delivery.

The import and generated `Env`-based binding type are now correct.

Implementation: `src/lib/cron.ts`

### HTML cache invalidation

The first post-deployment Synthetic checks detected that Cloudflare was still serving cached homepage HTML from the previous deployment. The cache generation was advanced from `v6` to `v7`, forcing the edge to render HTML with the new asset references and readiness markers.

Implementation: `src/middleware.ts`

## Synthetic tests

Synthetic tests notify `rsedighi@gmail.com` only for a sustained critical alert. They require failures in both configured locations, two fast retries, and do not send warning, recovery, or repeat emails.

### Homepage HTTP availability

- Public ID: `uy2-94h-qr6`
- Monitor ID: `317751010`
- Frequency: 60 seconds
- Alert delay: both locations must fail continuously for 5 minutes
- Locations: N. California and Oregon
- Priority: P1

Assertions:

- Status is `200`
- Response time is below 5 seconds
- `Content-Type` contains `text/html`
- Response contains `data-monitor-state`

This test identifies edge, Worker, deployment, and invalid cached-HTML failures.

### Earthquake feed availability and freshness

- Public ID: `6ff-mdq-sns`
- Monitor ID: `317751023`
- Frequency: 120 seconds
- Alert delay: both locations must fail continuously for 5 minutes
- Locations: N. California and Oregon
- Priority: P1

Endpoint:

```text
https://baytremor.com/api/earthquakes?feed=all_week
```

Assertions:

- Status is `200`
- Response time is below 5 seconds
- `Content-Type` contains `application/json`
- Body contains `features` and `metadata`
- `metadata.generated` is a number less than 15 minutes old

The freshness assertion catches stalled scheduled ingestion even when the endpoint continues returning HTTP `200`.

### Map tile availability

- Public ID: `nbc-edq-nhx`
- Monitor ID: `317751026`
- Frequency: 300 seconds
- Alert delay: both locations must fail continuously for 10 minutes
- Locations: N. California and Oregon
- Priority: P1

Canary endpoint:

```text
https://baytremor.com/api/map-tiles/9/82/197@2x.png
```

Assertions:

- Status is `200`
- Response time is below 3 seconds
- `Content-Type` contains `image/png`

Failure interpretation:

- `503`: `CARTO_API` is missing
- `502`: CARTO rejected or failed the upstream request
- Other 5xx or timeout: Worker, network, or unhandled upstream failure

### Homepage renders and map loads

- Public ID: `4x3-9k3-try`
- Monitor ID: `317751031`
- Frequency: 300 seconds
- Alert delay: both locations must fail continuously for 5 minutes
- Locations: N. California and Oregon
- Device: large laptop
- Priority: P1

The browser assertion requires:

- `#baytremor-dashboard[data-monitor-state="ready"]`
- `data-feed-state="ready"`
- An element with `data-map-state="ready"`
- No element with `data-monitor-state="error"`

This is the primary blank-page detector. It catches successful HTTP responses followed by failed JavaScript loading, React hydration, feed loading, map initialization, or tile loading.

## RUM monitors

All queries target application ID `47574ad1-d09e-4701-bc66-7b08bac0486f`.

### Elevated real frontend errors

- Monitor ID: `317751064`
- Critical email: more than 10 errors in 15 minutes
- No warning or recovery email
- Excludes `error.source:report`

CSP report-only events must remain excluded because Cloudflare-generated CSP reports otherwise dominate the error stream and create false alerts.

### React error boundary rendered

- Monitor ID: `317751066`
- Critical email: more than 2 `error_boundary_rendered` actions in 15 minutes
- No notification for an isolated user failure

### JavaScript asset failures

- Monitor ID: `317751067`
- Critical email: more than 5 failed `/_astro/*` resources with status 400 or greater in 10 minutes
- Missing-data and isolated-failure notifications: disabled

This detects sustained stale-HTML or asset-delivery incidents without emailing for one transient chunk request.

### Client feed failures

- Monitor ID: `317751069`
- Critical email: more than 5 `feed_failed` actions in 10 minutes
- No warning or isolated-failure email

### Client map failures

- Monitor ID: `317751088`
- Critical email: more than 5 `map_failed` actions in 10 minutes
- No warning or isolated-failure email

### RUM telemetry stopped

- Monitor ID: `317751089`
- Dashboard only: fewer than one RUM view in 30 minutes
- Email disabled
- Priority: P3

This can indicate broken RUM initialization, client-token regressions, CSP blocking, or a broader application outage. Synthetic tests are the authoritative availability signal because real traffic varies.

### Slow p75 Largest Contentful Paint

- Monitor ID: `317751091`
- Dashboard only: p75 LCP above 2.5 seconds for 15 minutes
- Email disabled
- Priority: P3

## Reliability dashboard

Dashboard: [BayTremor Reliability](https://app.datadoghq.com/dashboard/zzv-xkz-xku/baytremor-reliability)

Widgets include:

- BayTremor monitor status
- RUM view count
- Real frontend errors excluding CSP reports
- React error-boundary crashes
- Client feed failures
- Client map failures
- Failed JavaScript assets
- Views with LCP above 2.5 seconds
- User frustration events

## Alert routing

Current routing is email-only and critical-only.

- Recipient: `rsedighi@gmail.com`
- Email is included only inside Datadog's `is_alert` notification block
- Warnings, no-data states, isolated failures, and recoveries do not send email
- Synthetic alerts require both locations, two retries, and 5–10 minutes of sustained failure
- RUM alerts require repeated failures across users or requests
- Repeat notifications are disabled
- Performance and RUM-telemetry monitors remain dashboard-only

## Completed checklist

### RUM and Product Analytics

- [x] Confirm the `BayTremor.com` RUM application is active
- [x] Confirm Product Analytics retention is enabled
- [x] Confirm Session Replay is available
- [x] Restore `window.DD_RUM` for existing custom events
- [x] Make RUM helper calls safe before initialization
- [x] Track dashboard readiness
- [x] Track feed readiness and failures
- [x] Track map readiness and failures
- [x] Send React error-boundary crashes to Datadog
- [x] Exclude CSP report-only noise from frontend error alerts

### Proactive Synthetics

- [x] Create homepage HTTP test
- [x] Create browser-render and map-readiness test
- [x] Create earthquake-feed availability test
- [x] Add a 15-minute feed freshness assertion
- [x] Create CARTO map-tile test
- [x] Run tests from two US locations
- [x] Configure critical-only email routing
- [x] Require sustained multi-location failure before notification
- [x] Disable warning, recovery, no-data, and repeat emails
- [x] Manually trigger and verify passing test runs

### Worker reliability

- [x] Fix the scheduled `trackNewQuake` runtime failure
- [x] Use generated `Env` bindings for the cron handler type
- [x] Add a nonblank server fallback for the client-only homepage
- [x] Add map module failure handling
- [x] Invalidate stale edge HTML with cache generation `v7`
- [x] Build and deploy the production Worker
- [x] Confirm homepage, feed, and tile endpoints return `200`

### Datadog operations

- [x] Create the BayTremor Reliability dashboard
- [x] Create RUM error and performance monitors
- [x] Create map/feed custom-action monitors
- [x] Create a RUM no-traffic monitor
- [x] Validate all four Synthetic tests are `OK`

## Remaining Phase 2 work

### Realtime delivery

- [ ] Add WebSocket connect, close, retry, and retry-exhausted RUM actions
- [ ] Add a WebSocket ping/pong Synthetic test
- [ ] Track broadcast attempts, connected sockets, successful sends, and failures
- [ ] Restore Durable Object WebSocket state after hibernation using `ctx.getWebSockets()`

### Scheduled and backend telemetry

- [ ] Send a dedicated cron-started/completed/failed heartbeat to Datadog
- [ ] Track USGS fetch status and latency by feed
- [ ] Track KV and D1 write outcomes
- [ ] Track notification queue and APNs delivery outcomes
- [ ] Add structured Worker logs or a Cloudflare-to-Datadog log pipeline
- [ ] Instrument generic API 5xx rates and latency

The feed freshness Synthetic currently provides external coverage for a stalled cron until a dedicated heartbeat exists.

### Secondary journeys

- [ ] Test `/today` rendering and source freshness
- [ ] Test current earthquake-detail pages
- [ ] Test `/history` archive depth and availability
- [ ] Test geocoding and provider fallback
- [ ] Test risk-report generation
- [ ] Monitor AI summary availability separately from core reliability
- [ ] Add controlled comments and lead-submission journey tests

### Product Analytics

- [ ] Standardize custom action names and attributes
- [ ] Track earthquake selection and detail opens
- [ ] Track address-search start, success, and failure
- [ ] Track risk-report start, success, failure, and lead conversion
- [ ] Create conversion funnels and detect abnormal completion-rate drops

### Reliability maturity

- [ ] Replace manual cache-generation bumps with deployment-derived cache keys
- [ ] Add deployment markers and source-map upload to Datadog CI
- [ ] Add Synthetic tests to CI/CD before and after deployment
- [ ] Define 30-day availability and feed-freshness SLOs
- [ ] Add error-budget and burn-rate alerts after sufficient baseline data exists
- [ ] Add mobile browser coverage after desktop thresholds stabilize
- [ ] Retire or replace the old `baytremor.com` APM latency monitor that remains `No Data`

## Incident triage

### Homepage HTTP and browser tests both fail

Likely causes:

- Cloudflare Worker or route outage
- Deployment failure
- DNS/TLS problem
- Broad asset outage

Check the Synthetic HTTP response, Cloudflare Worker deployment, and recent changes first.

### Homepage HTTP passes but browser test fails

Likely causes:

- Stale HTML referencing old asset hashes
- JavaScript chunk failure
- React hydration or render crash
- Feed request failure
- Map module or tile failure

Check the failed browser step, screenshot, console, network resources, RUM errors, and Session Replay.

### Map tile test fails

- `503`: verify the production `CARTO_API` Worker secret
- `502`: verify CARTO upstream access and key validity
- Timeout: inspect Worker and upstream latency

### Feed test fails

Check:

1. `/api/earthquakes?feed=all_week`
2. `EARTHQUAKE_KV` binding
3. USGS upstream availability
4. Scheduled trigger execution
5. `metadata.generated` freshness
6. Recent Worker logs and deployments

### Frontend error monitor fires

Open the matching RUM issue and inspect:

- Affected views and users
- Browser and device distribution
- Release version
- Component stack
- Failed resources
- Session Replay

Do not reintroduce CSP report-only events into the primary frontend error monitor.

## Verification commands

```bash
npm run build
curl -sS -o /dev/null -w '%{http_code}\n' https://baytremor.com/
curl -sS -o /dev/null -w '%{http_code}\n' 'https://baytremor.com/api/earthquakes?feed=all_week'
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' 'https://baytremor.com/api/map-tiles/9/82/197@2x.png'
```

`npm run check` currently requires `@astrojs/check`, which is not installed. Direct TypeScript checking also reports pre-existing errors outside this monitoring work; these should be handled separately.
