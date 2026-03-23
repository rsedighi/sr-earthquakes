# Next.js 16 `cacheComponents` Implementation

This PR migrates Bay Tremor from Next.js 15's page-level `revalidate` model to Next.js 16's function-level `'use cache'` directive with the `cacheComponents` flag enabled.

## What Changed

### 1. Next.js Upgrade & Configuration

- **`package.json`** — Upgraded `next` from `^15.5.7` to `^16.2.1`
- **`next.config.js`** — Added `cacheComponents: true` at the top of the config

Enabling `cacheComponents` activates **dynamicIO**, which changes the default caching behavior: data-fetching operations are excluded from prerenders unless explicitly cached with `'use cache'`, and dynamic operations like `Date.now()` / `new Date()` must occur within a cache boundary or after accessing request-specific data.

### 2. Core Data Layer — `lib/server-data.ts`

The most impactful change. The old manual in-memory TTL cache was replaced with Next.js's built-in cache layer:

| Function | Cache Strategy | Notes |
|---|---|---|
| `loadAllEarthquakes()` | `'use cache'` + `cacheLife('hours')` | Removed manual TTL cache. All downstream consumers inherit this. |
| `generateHistoricalSummary()` | `'use cache'` + `cacheLife('hours')` | Derives from `loadAllEarthquakes()` |
| `getEarthquakesPage()` | Made `async` | Calls `await loadAllEarthquakes()` |
| `getSwarmsForRegion()` | Made `async` | Calls `await loadAllEarthquakes()` |

### 3. Page-Level Caching — `'use cache'` on Server Components

Pages that use time-sensitive filtering (e.g., `Date.now()` for "last 7 days") needed the **entire page component** wrapped in a cache boundary because `dynamicIO` treats `Date.now()` as a dynamic operation:

| Page | Cache Duration | Why |
|---|---|---|
| `app/blog/page.tsx` | `cacheLife('hours')` | MongoDB `getBlogImagesBySlugs` uses `new Date()` internally |
| `app/today/page.tsx` | `cacheLife('minutes')` | Filters by last 7 days using `Date.now()` |
| `app/city/[slug]/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` for recency filtering |
| `app/region/[id]/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` for recency filtering |
| `app/[cityYear]/page.tsx` | `cacheLife('days')` | Uses `new Date().getFullYear()` |
| `app/[city]-earthquake-today/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` for filtering |
| `app/hayward-fault/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` in structured data |
| `app/san-andreas-fault/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` in structured data |
| `app/calaveras-fault/page.tsx` | `cacheLife('hours')` | Uses `Date.now()` in structured data |

### 4. Function-Level Caching — Cached Data Wrappers

Some pages needed a cached wrapper function around their data loading:

- **`app/blog/page.tsx`** — `getCachedBlogPosts()` with `cacheLife('hours')`
- **`app/blog/[slug]/page.tsx`** — `getCachedBlogPosts()` and `getCachedBlogPostBySlug()` wrappers
- **`app/today/page.tsx`** — `getRecentEarthquakes()` with `cacheLife('minutes')`
- **`app/earthquake/[id]/page.tsx`** — `getEarthquake(id)` with `cacheLife('minutes')`

### 5. Dynamic API Routes

API routes that rely on request-specific data (`nextUrl.searchParams`) cannot be prerendered under `dynamicIO`. These are marked as explicitly dynamic:

- **`app/api/feature-flags/route.ts`** — Added `export const dynamic = 'force-dynamic'` (uses `searchParams` for flag evaluation context)

### 6. Removed Incompatible Route Segment Configs

`cacheComponents` is incompatible with `export const revalidate` and `export const runtime`. All instances were removed:

**`revalidate` removed from:**
- `app/page.tsx`, `app/my-area/page.tsx`, `app/compare/page.tsx`, `app/learn/page.tsx`, `app/history/page.tsx`
- `app/today/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`
- `app/community/page.tsx`, `app/community/[category]/page.tsx`, `app/community/[category]/[thread]/page.tsx`
- `app/earthquake/[id]/opengraph-image.tsx`, `app/earthquake/[id]/twitter-image.tsx`

**`runtime` removed from:**
- `app/earthquake/[id]/opengraph-image.tsx`, `app/earthquake/[id]/twitter-image.tsx`
- `app/api/earthquake/[id]/share-image/route.tsx`
- `app/opengraph-image.tsx`

### 7. Dynamic Date Handling for Static Pages

Pages that were otherwise fully static but used `new Date()` for trivial purposes (like a copyright year) needed special treatment under `dynamicIO`:

- **`app/privacy/page.tsx`** and **`app/support/page.tsx`** — Replaced `new Date().getFullYear()` with a new `<CurrentYear />` client component (`components/current-year.tsx`)
- **`app/history/[event]/page.tsx`** — Replaced `new Date().toISOString()` in JSON-LD `dateModified` with a static date string

## Files to Review

### Start Here
1. **`next.config.js`** — The `cacheComponents: true` flag that enables everything
2. **`lib/server-data.ts`** — Core data layer with `'use cache'` directives

### Pages with `'use cache'` on the Component
3. **`app/today/page.tsx`** — Best example of full-page caching with time-sensitive data
4. **`app/city/[slug]/page.tsx`** — Example of page-level cache with `Date.now()`
5. **`app/earthquake/[id]/page.tsx`** — Per-item caching with `cacheLife('minutes')`

### Supporting Changes
6. **`components/current-year.tsx`** — New client component for dynamic year display
7. **`app/blog/page.tsx`** and **`app/blog/[slug]/page.tsx`** — Cached data wrapper pattern

## Cache Duration Strategy

| Duration | Used For |
|---|---|
| `cacheLife('minutes')` | Time-sensitive pages (today's earthquakes, individual earthquake detail) |
| `cacheLife('hours')` | Core data functions, city/region pages, fault pages, blog index |
| `cacheLife('days')` | Year-based pages that rarely change |

## Reference

- [Next.js `cacheComponents` docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Next.js `'use cache'` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Next.js `cacheLife` API](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
