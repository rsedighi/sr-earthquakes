# 🚀 Bay Tremor Sprint Plan

> Based on comprehensive analysis from `feedback.md`  
> Created: December 20, 2025

---

## 📊 Sprint Overview

| Sprint | Focus | Duration | Priority |
|--------|-------|----------|----------|
| **Sprint 1** | Critical Performance & P0 Fixes | 2 weeks | 🔴 Critical |
| **Sprint 2** | UX Foundation & Mobile | 2 weeks | 🔴 Critical |
| **Sprint 3** | Core Features & Notifications | 2 weeks | 🟠 High |
| **Sprint 4** | Code Quality & Architecture | 2 weeks | 🟡 Medium |
| **Sprint 5** | Design Polish & Branding | 2 weeks | 🟡 Medium |
| **Sprint 6** | SEO & Growth | 2 weeks | 🟢 Low |

---

## 🔴 Sprint 1: Critical Performance & P0 Fixes
**Duration:** 2 weeks  
**Theme:** Fix performance bottlenecks and critical issues

### Goals
- [ ] Resolve Discussions page slow load times
- [ ] Optimize polling strategy
- [ ] Fix Leaflet CSS loading
- [ ] Begin dashboard decomposition

---

### 1.1 — Fix Discussions Page Performance (P0)
**Issue:** First load after idle takes many seconds  
**Priority:** 🔴 Critical  
**Estimate:** 3 points

**Tasks:**
- [ ] Profile Discussions page to identify bottleneck
- [ ] Implement data prefetching/caching strategy
- [ ] Add loading skeleton for perceived performance
- [ ] Consider SSR for initial forum data

**Acceptance Criteria:**
- First load completes in < 2 seconds
- Subsequent loads feel instant
- Loading state provides visual feedback

---

### 1.2 — Optimize Earthquake Polling Strategy
**Issue:** 10-second polling is wasteful and drains battery  
**File:** `hooks/use-realtime-earthquakes.ts`  
**Priority:** 🔴 Critical  
**Estimate:** 5 points

**Tasks:**
- [ ] Implement exponential backoff (start at 30s, max 5min)
- [ ] Add visibility-based polling (pause when tab hidden)
- [ ] Investigate Pusher push notifications for true real-time
- [ ] Add user preference for refresh frequency

**Proposed Implementation:**
```typescript
// Smart polling intervals
const POLLING_CONFIG = {
  ACTIVE_INTERVAL: 30_000,      // 30 seconds when active
  IDLE_INTERVAL: 120_000,       // 2 minutes when idle
  BACKGROUND_INTERVAL: 300_000, // 5 minutes when hidden
  AFTER_EARTHQUAKE: 10_000,     // 10 seconds after new quake detected
};
```

**Acceptance Criteria:**
- Polling adapts to user activity
- Battery usage reduced by 50%+
- No perceptible delay in earthquake updates

---

### 1.3 — Fix Leaflet CSS Loading
**Issue:** Runtime CSS injection causes FOUC  
**File:** `components/leaflet-map.tsx`  
**Priority:** 🟠 High  
**Estimate:** 2 points

**Tasks:**
- [ ] Install leaflet CSS as npm dependency
- [ ] Import in `globals.css` or component
- [ ] Remove runtime `<link>` injection code
- [ ] Test map rendering without flash

**Acceptance Criteria:**
- No layout shift when map loads
- Map styles available immediately
- No external CDN dependency

---

### 1.4 — Begin Dashboard Decomposition
**Issue:** 2100+ line monolithic component  
**File:** `components/dashboard.tsx`  
**Priority:** 🟠 High  
**Estimate:** 8 points

**Tasks:**
- [ ] Extract `LiveTab` component
- [ ] Extract `HistoryTab` component  
- [ ] Extract `MyAreaTab` component
- [ ] Extract `DiscussionsTab` component
- [ ] Extract `CompareTab` component
- [ ] Extract `LearnTab` component
- [ ] Implement lazy loading for non-active tabs
- [ ] Move shared state to context or Zustand

**Target Structure:**
```
components/
├── dashboard/
│   ├── index.tsx           # Main shell (< 200 lines)
│   ├── live-tab.tsx
│   ├── history-tab.tsx
│   ├── my-area-tab.tsx
│   ├── discussions-tab.tsx
│   ├── compare-tab.tsx
│   ├── learn-tab.tsx
│   └── dashboard-context.tsx
```

**Acceptance Criteria:**
- No single file > 500 lines
- Tabs lazy load (verify in network tab)
- No regression in functionality

---

### 1.5 — Fix Double Data Fetching
**Issue:** Historical data fetched even on Live tab  
**File:** `components/dashboard.tsx`  
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Make `useHistoricalEarthquakes` conditional on tab
- [ ] Only fetch when History tab is active or preloading
- [ ] Add data staleness check before refetch

**Acceptance Criteria:**
- Network requests reduced on initial load
- Historical data only fetched when needed

---

### Sprint 1 Definition of Done
- [ ] All P0 issues resolved
- [ ] Performance improvements measurable
- [ ] No regressions in core functionality
- [ ] Code reviewed and merged

---

## 🔴 Sprint 2: UX Foundation & Mobile
**Duration:** 2 weeks  
**Theme:** Reduce cognitive load, improve mobile experience

### Goals
- [ ] Implement progressive disclosure on homepage
- [ ] Fix mobile navigation
- [ ] Add clear value proposition
- [ ] Simplify first-time experience

---

### 2.1 — Progressive Disclosure on Homepage
**Issue:** Information overload with 9+ sections competing for attention  
**Priority:** 🔴 Critical  
**Estimate:** 5 points

**Tasks:**
- [ ] Redesign homepage hierarchy
- [ ] Map + Recent earthquakes as primary focus
- [ ] Collapsible/expandable secondary sections
- [ ] "Show more" pattern for feed items
- [ ] Remove or relocate redundant elements

**New Hierarchy:**
```
1. [Primary] Clear headline with current status
2. [Primary] Interactive map
3. [Primary] Recent earthquakes (3-5 items)
4. [Secondary - Expandable] Full earthquake feed
5. [Secondary - Expandable] AI Summary
6. [Tertiary] Stats, discussions, etc.
```

**Acceptance Criteria:**
- Above-the-fold content is focused
- Users can find detailed info when needed
- Page feels less overwhelming

---

### 2.2 — Add Value Proposition Above the Fold
**Issue:** No clear headline explaining what the site does  
**Priority:** 🔴 Critical  
**Estimate:** 2 points

**Tasks:**
- [ ] Create dynamic headline component
- [ ] Show count + context (e.g., "65 earthquakes this week")
- [ ] Add brief explanation for new users
- [ ] Make it dismissible for returning users

**Example:**
```
🌊 65 earthquakes in the Bay Area this week
The largest was a M3.2 near Fremont. No damage reported.
```

**Acceptance Criteria:**
- New visitors understand site purpose in < 3 seconds
- Headline updates with real data
- Returning users can dismiss

---

### 2.3 — Fix Mobile Tab Navigation
**Issue:** 6 tabs cramped.
**Priority:** 🔴 Critical  
**Estimate:** 3 points

**Tasks:**
- [ ] Implement hamburger menu navigation on mobile
- [ ] Use icons + short labels
- [ ] Add harmburger scroll if needed
- [ ] Ensure touch targets are 44px+

**Options to evaluate:**
1. Bottom tab bar (iOS/Android pattern)
2. Hamburger menu for secondary tabs
3. Scrollable pill tabs
4. Reduce to 4 primary tabs, nest others

**Acceptance Criteria:**
- All tabs accessible on mobile
- Touch-friendly (44px+ targets)

---

### 2.4 — Improve City Selector Widget
**Issue:** Area codes confuse non-locals, unclear benefit  but has huge value add for locals.
**Priority:** 🟠 High  
**Estimate:** 2 points

**Tasks:**
- [ ] Add city names prominently
- [ ] Explain benefit: "Get earthquakes near you"
- [ ] Add location auto-detect option

**Acceptance Criteria:**
- Widget purpose is immediately clear
- Works for new Bay Area residents
- Encourages interaction

---

### 2.5 — First-Time User Onboarding
**Issue:** No guidance for new visitors  
**Priority:** 🟠 High  
**Estimate:** 3 points

**Tasks:**
- [ ] Create simple 3-step onboarding tooltip tour
- [ ] Highlight key features (map, alerts, my area)
- [ ] Store completion in localStorage
- [ ] Add "Skip" option

**Acceptance Criteria:**
- New users guided to key features
- Onboarding completes in < 30 seconds
- Can be skipped or dismissed

---

### 2.6 — Fix AI Summary Loading State
**Issue:** 2-3 second delay with no visual placeholder. Also the information is a blob of text.   
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Add better visual to the notice. Right now it's a blob of text. You can't tell when new messages are appearing, and you will prob skip over it. 
- [ ] Add skeleton loader for AI summary area
- [ ] Reserve space to prevent layout shift
- [ ] Consider streaming response for progressive display

**Acceptance Criteria:**
- No jarring content jump when summary loads
- User knows something is loading

---

### Sprint 2 Definition of Done
- [ ] Homepage is visually cleaner
- [ ] Mobile navigation works well
- [ ] New users have clear path
- [ ] No regressions

---

## 🟠 Sprint 3: Core Features & Notifications
**Duration:** 2 weeks  
**Theme:** Add the most requested missing features

### Goals
- [ ] Implement push notification system
- [ ] Add earthquake alerts
- [ ] Improve community features
- [ ] Make AI summary more accessible

---

### 3.1 — Push Notification System
**Issue:** #1 missing feature for earthquake tracker  
**Priority:** 🔴 Critical  
**Estimate:** 8 points

**Tasks:**
- [ ] Implement Web Push API
- [ ] Create notification preferences UI
- [ ] Add magnitude threshold setting
- [ ] Add location-based filtering
- [ ] Set up service worker for background delivery
- [ ] Integrate with Pusher for server-side triggers

**User Flow:**
```
1. User clicks "Enable Alerts"
2. Browser permission prompt
3. User sets preferences (magnitude, location)
4. Server sends push when matching earthquake occurs
```

**Acceptance Criteria:**
- Users can opt-in to notifications
- Notifications fire within 1 min of earthquake
- Works on mobile and desktop
- Preferences persist

---

### 3.2 — Location-Based Alerts
**Issue:** Users want alerts for earthquakes near them  
**Priority:** 🔴 Critical  
**Estimate:** 5 points

**Tasks:**
- [ ] Store user's preferred location
- [ ] Calculate distance server-side
- [ ] Allow radius customization (10/25/50 miles)
- [ ] Create alert preferences UI

**Acceptance Criteria:**
- User can set "alert me for M3+ within 25 miles"
- Alerts are accurate to location
- Settings sync (if accounts exist)

---

### 3.3 — Make AI Summary Always Available
**Issue:** Summary only shows during "elevated activity"  
**Priority:** 🟠 High  
**Estimate:** 3 points

**Tasks:**
- [ ] Add "Get AI Summary" button
- [ ] Cache summaries for 1 hour
- [ ] Make summary shareable (link/image)
- [ ] Add to earthquake detail pages

**Acceptance Criteria:**
- Summary available on-demand
- Can share via social/link
- Doesn't spam OpenAI API

---

### 3.4 — Improve Swarm Detection UX
**Issue:** "Swarm" is jargon, detection exists but UX is poor  
**Priority:** 🟡 Medium  
**Estimate:** 3 points

**Tasks:**
- [ ] Rename to "Earthquake Cluster" in UI
- [ ] Add visual timeline of cluster progression
- [ ] Create cluster detail view
- [ ] Add alert option for new clusters

**Acceptance Criteria:**
- Non-experts understand what a cluster is
- Visual timeline shows progression
- Clusters are alertable

---

### 3.5 — Community Feature Improvements
**Issue:** Forum lacks moderation, verification, rich formatting  
**Priority:** 🟡 Medium  
**Estimate:** 5 points

**Tasks:**
- [ ] Add basic moderation (report, hide)
- [ ] Add geographic tagging to "Did You Feel It?" reports
- [ ] Support markdown in comments
- [ ] Add user reputation/karma system (basic)

**Acceptance Criteria:**
- Inappropriate content can be reported
- Reports are tagged with location
- Comments support basic formatting

---

### Sprint 3 Definition of Done
- [ ] Users can receive earthquake alerts
- [ ] AI summary is more useful
- [ ] Community features improved
- [ ] All features tested on mobile

---

## 🟡 Sprint 4: Code Quality & Architecture
**Duration:** 2 weeks  
**Theme:** Pay down technical debt

### Goals
- [ ] Consolidate duplicated code
- [ ] Add configuration system
- [ ] Improve type safety
- [ ] Add test coverage

---

### 4.1 — Create Shared Geo Utilities
**Issue:** `getDistanceKm` duplicated in 3+ files  
**Priority:** 🟠 High  
**Estimate:** 2 points

**Tasks:**
- [ ] Create `lib/geo.ts`
- [ ] Move distance calculations
- [ ] Move coordinate helpers
- [ ] Update all imports

**Target file:**
```typescript
// lib/geo.ts
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number
export function isWithinRadius(point: Coordinates, center: Coordinates, radiusMiles: number): boolean
```

**Acceptance Criteria:**
- No duplicated geo functions
- All files use shared utility
- Tests for geo functions

---

### 4.2 — Centralize Configuration Constants
**Issue:** Magic numbers scattered throughout codebase  
**Priority:** 🟠 High  
**Estimate:** 2 points

**Tasks:**
- [ ] Create `lib/constants.ts`
- [ ] Move polling intervals
- [ ] Move radius defaults
- [ ] Move magnitude thresholds
- [ ] Move time calculations

**Target file:**
```typescript
// lib/constants.ts
export const POLLING = {
  ACTIVE_INTERVAL_MS: 30_000,
  IDLE_INTERVAL_MS: 120_000,
  BACKGROUND_INTERVAL_MS: 300_000,
} as const;

export const DEFAULTS = {
  SEARCH_RADIUS_MILES: 15,
  MIN_MAGNITUDE: 0.1,
  SIGNIFICANT_MAGNITUDE: 4.0,
} as const;

export const TIME = {
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
} as const;
```

**Acceptance Criteria:**
- No magic numbers in business logic
- Constants are documented
- Easy to adjust settings

---

### 4.3 — Consolidate Type Definitions
**Issue:** Some types inline, others in lib/types.ts  
**Priority:** 🟡 Medium  
**Estimate:** 3 points

**Tasks:**
- [ ] Audit all inline type definitions
- [ ] Move `TrendingEarthquake` to lib/types.ts
- [ ] Move `ForumThread` to lib/types.ts
- [ ] Create proper interfaces for API responses

**Acceptance Criteria:**
- All shared types in lib/types.ts
- No duplicate type definitions
- Types are exported consistently

---

### 4.4 — Add Test Coverage (Foundation)
**Issue:** Zero visible test files  
**Priority:** 🟡 Medium  
**Estimate:** 5 points

**Tasks:**
- [ ] Set up Jest/Vitest configuration
- [ ] Add tests for `lib/geo.ts`
- [ ] Add tests for `lib/analysis.ts`
- [ ] Add tests for critical API routes
- [ ] Set up CI to run tests

**Target coverage for Sprint 4:** 30% of lib/ folder

**Acceptance Criteria:**
- Test framework configured
- Critical utilities have tests
- CI runs tests on PR

---

### 4.5 — Add Basic Service Worker (Offline Foundation)
**Issue:** Site doesn't work offline  
**Priority:** 🟡 Medium  
**Estimate:** 3 points

**Tasks:**
- [ ] Create service worker for caching
- [ ] Cache static assets
- [ ] Cache last earthquake data
- [ ] Show offline indicator

**Acceptance Criteria:**
- Site loads when offline (with stale data)
- User knows they're offline
- Refreshes when back online

---

### Sprint 4 Definition of Done
- [ ] No duplicated utility code
- [ ] Magic numbers eliminated
- [ ] Type definitions centralized
- [ ] Basic test coverage exists
- [ ] Offline mode works

---

## 🟡 Sprint 5: Design Polish & Branding
**Duration:** 2 weeks  
**Theme:** Create memorable visual identity

### Goals
- [ ] Strengthen brand identity
- [ ] Fix visual hierarchy issues
- [ ] Reduce animation noise
- [ ] Improve map legend

---

### 5.1 — Brand Identity Upgrade
**Issue:** Generic text header, weak favicon, no memorable brand mark  
**Priority:** 🟠 High  
**Estimate:** 5 points

**Tasks:**
- [ ] Design distinctive logo/wordmark
- [ ] Update header with logo
- [ ] Create favicon set (16, 32, 192, 512)
- [ ] Update OpenGraph images with branding
- [ ] Choose distinctive color palette

**Acceptance Criteria:**
- Logo is memorable and unique
- Consistent across all touchpoints
- Works at small sizes (favicon)

---

### 5.2 — Differentiate Stats Cards
**Issue:** Stats cards visually undifferentiated  
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Add color coding by category
- [ ] Add subtle icons
- [ ] Improve typography hierarchy
- [ ] Add micro-interactions on hover

**Acceptance Criteria:**
- Stats cards have clear visual hierarchy
- At-a-glance understanding improved

---

### 5.3 — Tone Down Animations
**Issue:** animate-ping on markers is distracting  
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Replace `animate-ping` with gentler alternative
- [ ] Audit all animations
- [ ] Add `prefers-reduced-motion` support
- [ ] Keep `animate-pulse-gentle` on Live indicator

**Acceptance Criteria:**
- Animations enhance, not distract
- Respects user motion preferences
- Live indicator still visible

---

### 5.4 — Improve Map Legend
**Issue:** Legend has poor contrast, easily missed  
**Priority:** 🟡 Medium  
**Estimate:** 1 point

**Tasks:**
- [ ] Increase legend contrast
- [ ] Make legend more prominent
- [ ] Add collapse/expand option
- [ ] Ensure mobile visibility

**Acceptance Criteria:**
- Legend is easily readable
- Works on all background colors

---

### 5.5 — Simplify Earthquake Detail Modal
**Issue:** 819-line modal is overwhelming  
**Priority:** 🟡 Medium  
**Estimate:** 5 points

**Tasks:**
- [ ] Reduce to essential info in modal
- [ ] Move detailed content to full page
- [ ] Add "View full details" link
- [ ] Improve information hierarchy

**Options:**
1. Modal shows summary, links to full page
2. Tabbed modal (Overview, Details, History)
3. Scrollable modal with sections

**Acceptance Criteria:**
- Modal is digestible at a glance
- Full details available via click
- No loss of functionality

---

### Sprint 5 Definition of Done
- [ ] Brand identity is stronger
- [ ] Visual hierarchy is clear
- [ ] Animations are tasteful
- [ ] No accessibility regressions

---

## 🟢 Sprint 6: SEO & Growth
**Duration:** 2 weeks  
**Theme:** Improve discoverability and content

### Goals
- [ ] Add indexable content
- [ ] Improve region pages
- [ ] Fix ad implementation
- [ ] Add analytics for growth

---

### 6.1 — Content Strategy Foundation
**Issue:** No indexable content for SEO  
**Priority:** 🟡 Medium  
**Estimate:** 5 points

**Tasks:**
- [ ] Create content template for weekly roundups
- [ ] Build automation to generate roundup drafts
- [ ] Create educational content about Bay Area faults
- [ ] Add historical earthquake anniversary posts

**Content ideas:**
- "This Week in Bay Area Earthquakes" (automated)
- "Understanding the Hayward Fault" (evergreen)
- "On This Day: 1989 Loma Prieta" (anniversary)

**Acceptance Criteria:**
- Content generation pipeline exists
- At least 3 educational pages live
- Content is SEO-optimized

---

### 6.2 — Enrich Region/City Pages
**Issue:** Pages are data-driven with minimal unique content  
**Priority:** 🟡 Medium  
**Estimate:** 3 points

**Tasks:**
- [ ] Add unique descriptions per region
- [ ] Include fault line information
- [ ] Add historical earthquake context
- [ ] Improve internal linking

**Acceptance Criteria:**
- Each region page has unique content
- Pages rank for "[city] earthquakes"

---

### 6.3 — Fix Ad Implementation
**Issue:** Placeholder slot IDs, potential policy violations  
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Replace placeholder ad slot IDs
- [ ] Review AdSense policy compliance
- [ ] Audit ad placement
- [ ] Test ad loading performance

**Acceptance Criteria:**
- Real ad units configured
- Compliant with AdSense policies
- Ads don't harm performance

---

### 6.4 — Growth Analytics Setup
**Issue:** Need to track user engagement  
**Priority:** 🟡 Medium  
**Estimate:** 2 points

**Tasks:**
- [ ] Define key metrics (DAU, retention, shares)
- [ ] Set up funnel tracking
- [ ] Track notification opt-in rate
- [ ] Create dashboard for metrics

**Key Metrics:**
- Daily Active Users
- Notification opt-in rate
- Time to first "Did You Feel It?"
- Share rate per earthquake

**Acceptance Criteria:**
- Key metrics tracked
- Dashboard accessible to team

---

### Sprint 6 Definition of Done
- [ ] SEO content strategy in place
- [ ] Region pages enriched
- [ ] Ads configured properly
- [ ] Growth metrics tracked

---

## 📋 Backlog (Future Sprints)

### Not Prioritized Yet
- [ ] User accounts & cross-device sync
- [ ] ShakeAlert integration
- [ ] Premium ad-free tier
- [ ] Full offline support with sync
- [ ] Native mobile app (React Native)
- [ ] Email/SMS alert system
- [ ] API for third-party developers

---

## 📈 Success Metrics

| Metric | Current | Sprint 2 Target | Sprint 6 Target |
|--------|---------|-----------------|-----------------|
| Lighthouse Performance | ~70 | 85+ | 90+ |
| First Contentful Paint | ~2.5s | < 1.5s | < 1s |
| Time to Interactive | ~4s | < 2.5s | < 2s |
| Mobile Usability Score | ~80 | 95+ | 100 |
| Test Coverage | 0% | 20% | 40% |
| Notification Opt-in | N/A | 10% | 25% |

---

## 🗓️ Timeline

```
Week 1-2:   Sprint 1 (Performance)
Week 3-4:   Sprint 2 (UX/Mobile)
Week 5-6:   Sprint 3 (Features)
Week 7-8:   Sprint 4 (Code Quality)
Week 9-10:  Sprint 5 (Design)
Week 11-12: Sprint 6 (SEO/Growth)
```

**Total Duration:** ~12 weeks (3 months)

---

## 📝 Notes

- Sprints can overlap if team capacity allows
- P0 items from Sprint 1 should block all other work
- Consider shipping incrementally within sprints
- Revisit priorities after Sprint 2 based on user feedback

---

*Last updated: December 20, 2025*


