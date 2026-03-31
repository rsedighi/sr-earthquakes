# Bay Tremor Performance Optimizations

This branch implements a comprehensive suite of performance optimizations for Bay Tremor, focusing on reducing RSC payload sizes, eliminating layout shifts, and maximizing caching efficiency with Next.js 16.

## Key Optimizations

### 1. RSC Payload Reduction (Prefetch Optimization)
**Issue:** The homepage would often download 7MB-10MB of React Server Component (RSC) payload data because `<Link>` components in the footer and sidebars were aggressively prefetching heavy data pages like `/blog` and `/history`.
**Solution:** Added `prefetch={false}` to over 180 `<Link>` tags across shared navigation components:
- `components/dashboard.tsx` (Footer & navigation)
- `components/bay-tremor-community.tsx` (Sidebar links)
- `components/earthquake-share-content.tsx`
- `components/quick-report-modal.tsx`

### 2. Elimination of Layout Shifts (Core Web Vitals)
**Dynamic Map Skeletons:** Improved the loading states for dynamic Leaflet and Fault maps in `components/dashboard.tsx`. Instead of a simple spinner, they now use a themed skeleton that matches the final UI layout, preventing the page from "jumping" when the map mounts.
**Earthquake List Skeletons:** Refined the list loading skeletons to match the exact 104px height of the earthquake cards, ensuring a stable scroll position during initial load.
**History & Dashboard Tab Skeletons:** Replaced simple spinners with robust, layout-matching skeletons for heavy dynamic tabs (`HistoricalSwarms`, `RegionComparison`, `MyNeighborhood`) and client-side history data fetches in `components/dashboard.tsx`. This eliminates the massive layout shift previously seen on the History page.

### 3. Image Optimization
**Next.js Image Migration:** Replaced various raw `<img>` tags with the Next.js `Image` component to benefit from automatic resizing, lazy loading, and modern format support (WebP/AVIF).
- **Amazon CDN Support:** Configured `<Image unoptimized />` for Amazon Affiliate images in `components/affiliate-recommendations.tsx` to maintain compatibility with their tracking requirements while silencing console warnings and providing better layout stability.
- **Blog & Guides:** Migrated hero images in `app/blog/page.tsx` and product images in `app/learn/earthquake-kit-guide/page.tsx`.

### 4. Next.js 16 Caching Strategy
This branch fully embraces the Next.js 16 `cacheComponents` feature. We transitioned from deprecated route segment configs (`export const revalidate`) to the native `'use cache'` directive:
- **`lib/server-data.ts`**: Uses `cacheLife('hours')` for core earthquake data.
- **Static Pages**: Informational pages like `/history`, `/learn`, and fault pages now benefit from native caching, reducing server load and improving TTFB.

## How to Verify
Run the production build to see the optimized payload sizes:
```bash
npm run build
```

## Reference
- [Next.js `cacheComponents` docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Next.js `'use cache'` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
