# Earthquake Explorer: Implementation Guide

## Quick Start

To integrate the Earthquake Explorer into the My Neighborhood page:

### Step 1: Install Dependencies (if needed)

```bash
# No additional dependencies required!
# Uses existing: React, TypeScript, Lucide icons
```

### Step 2: Integrate EarthquakeExplorer Component

```typescript
// In my-neighborhood.tsx or a new enhanced version

import { EarthquakeExplorer } from '@/components/earthquake-explorer';
import { getDistanceKm } from '@/components/leaflet-map';

export function MyNeighborhood({ historicalEarthquakes, className = '' }: MyNeighborhoodProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
  } | null>(null);
  
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);

  // Convert km to miles for distance calculation
  const getDistance = (eq: Earthquake) => {
    if (!userLocation) return 0;
    return getDistanceKm(
      userLocation.lat, 
      userLocation.lon,
      eq.latitude, 
      eq.longitude
    ) * 0.621371; // Convert to miles
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Address Search */}
      {/* ... existing code ... */}
      
      {/* NEW: Earthquake Explorer */}
      {userLocation && (
        <EarthquakeExplorer
          earthquakes={historicalEarthquakes}
          userLocation={userLocation}
          onResultsChange={setFilteredEarthquakes}
          getDistance={getDistance}
        />
      )}
      
      {/* Map - now uses filtered earthquakes */}
      <LeafletMap
        earthquakes={filteredEarthquakes}
        userLocation={userLocation}
        // ... other props
      />
      
      {/* Results - now uses filtered earthquakes */}
      {/* ... rest of existing code ... */}
    </div>
  );
}
```

### Step 3: Add Visual Query Builder (Optional)

```typescript
import { VisualQueryBuilder } from '@/components/visual-query-builder';
import { QueryCondition } from '@/components/earthquake-explorer';

// Inside your component
const [showQueryBuilder, setShowQueryBuilder] = useState(false);

// Somewhere in your JSX
{showQueryBuilder && (
  <VisualQueryBuilder
    onBuildQuery={(conditions) => {
      // Convert to EarthquakeExplorer conditions
      // Apply to explorer
    }}
    onSaveQuery={(name, conditions) => {
      // Save to localStorage or MongoDB
    }}
  />
)}
```

## Component API Reference

### EarthquakeExplorer

```typescript
interface EarthquakeExplorerProps {
  earthquakes: Earthquake[];        // All available earthquakes
  userLocation: {                   // User's location (optional)
    lat: number;
    lon: number;
  } | null;
  onResultsChange: (filtered: Earthquake[]) => void;  // Callback with filtered results
  getDistance: (eq: Earthquake) => number;  // Distance calculator (in miles)
}
```

**Usage**:
```tsx
<EarthquakeExplorer
  earthquakes={historicalData}
  userLocation={userLocation}
  onResultsChange={handleFiltered}
  getDistance={calculateDistance}
/>
```

**Features**:
- Quick filter templates
- Search bar with auto-complete
- Active conditions display
- Dynamic facets generation
- Real-time filtering

### VisualQueryBuilder

```typescript
interface VisualQueryBuilderProps {
  onBuildQuery: (conditions: Omit<QueryCondition, 'id'>[]) => void;  // Apply query
  onSaveQuery?: (name: string, conditions: Omit<QueryCondition, 'id'>[]) => void;  // Save query
}
```

**Usage**:
```tsx
<VisualQueryBuilder
  onBuildQuery={applyFilters}
  onSaveQuery={saveToStorage}
/>
```

**Features**:
- Dropdown-based query building
- Add/remove conditions
- Preview query in plain English
- Save with custom name

## Data Structures

### QueryCondition

```typescript
interface QueryCondition {
  id: string;  // Unique identifier
  field: 'magnitude' | 'distance' | 'felt' | 'depth' | 'time' | 'location';
  operator: '>' | '<' | '>=' | '<=' | '=' | 'between' | 'contains';
  value: string | number | [number, number];  // Single value or range
  label: string;  // Human-readable description
}
```

**Example**:
```typescript
const condition: QueryCondition = {
  id: 'abc123',
  field: 'magnitude',
  operator: '>',
  value: 3.0,
  label: 'magnitude greater than 3.0'
};
```

### Facet

```typescript
interface Facet {
  id: string;        // e.g., 'magnitude', 'distance'
  label: string;     // e.g., 'Magnitude', 'Distance'
  icon: React.ReactNode;
  options: FacetOption[];
  expanded: boolean;
}

interface FacetOption {
  label: string;   // e.g., 'Minor (2.0-3.0)'
  value: string;   // e.g., 'mag_2_3'
  count: number;   // Number of matching earthquakes
  checked: boolean;
}
```

## Styling & Theming

The components use Tailwind CSS classes that match your existing design:

```css
/* Primary colors (already in your app) */
bg-white/[0.02]        /* Card backgrounds */
border-white/10        /* Borders */
text-neutral-400       /* Secondary text */
bg-blue-500           /* Primary accent */

/* Component-specific */
.earthquake-explorer-search {
  @apply w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 
         rounded-xl text-sm focus:outline-none focus:border-blue-500/50;
}

.earthquake-explorer-facet {
  @apply bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden;
}

.earthquake-explorer-filter-pill {
  @apply flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 
         border border-blue-500/30 rounded-lg text-xs;
}
```

## State Management

### Recommended Approach

```typescript
// Parent component manages overall state
const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
const [filteredResults, setFilteredResults] = useState<Earthquake[]>([]);
const [activeConditions, setActiveConditions] = useState<QueryCondition[]>([]);
const [savedQueries, setSavedQueries] = useState<QueryTemplate[]>([]);

// EarthquakeExplorer handles its own filtering logic
<EarthquakeExplorer
  earthquakes={earthquakes}
  userLocation={userLocation}
  onResultsChange={setFilteredResults}
  getDistance={getDistance}
/>

// Parent uses filtered results for map, list, stats
<Map earthquakes={filteredResults} />
<StatCards data={filteredResults} />
<EarthquakeList items={filteredResults} />
```

## Persistence

### LocalStorage (Saved Queries)

```typescript
// Save a query
const saveQuery = (name: string, conditions: QueryCondition[]) => {
  const saved = JSON.parse(localStorage.getItem('saved_queries') || '[]');
  saved.push({
    id: Date.now().toString(),
    name,
    conditions,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('saved_queries', JSON.stringify(saved));
};

// Load saved queries
const loadQueries = (): QueryTemplate[] => {
  return JSON.parse(localStorage.getItem('saved_queries') || '[]');
};
```

### URL (Shareable Links)

```typescript
// Encode query to URL
const encodeQuery = (conditions: QueryCondition[]): string => {
  return conditions.map(c => 
    `${c.field}_${c.operator}_${c.value}`
  ).join('_AND_');
};

// Example: ?q=magnitude_gt_3_AND_distance_lt_10

// Decode URL to query
const decodeQuery = (queryString: string): QueryCondition[] => {
  // Parse query string and return conditions
  // Implementation depends on your URL structure
};
```

### MongoDB (Cross-device, Future)

```typescript
// API endpoint: POST /api/saved-queries
async function saveQueryToCloud(query: QueryTemplate) {
  const response = await fetch('/api/saved-queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: getVisitorId(),
      query
    })
  });
  return response.json();
}
```

## Performance Optimization

### Memoization

```typescript
// Expensive facet generation
const facets = useMemo(() => 
  generateFacets(earthquakes, userLocation),
  [earthquakes, userLocation]
);

// Filtered results
const filteredEarthquakes = useMemo(() => 
  filterEarthquakes(earthquakes, activeConditions),
  [earthquakes, activeConditions]
);

// Stats calculation
const stats = useMemo(() => 
  calculateStats(filteredEarthquakes),
  [filteredEarthquakes]
);
```

### Virtual Scrolling (for 1000+ results)

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={filteredEarthquakes.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <EarthquakeListItem earthquake={filteredEarthquakes[index]} />
    </div>
  )}
</FixedSizeList>
```

### Web Workers (for heavy computation)

```typescript
// worker.ts
self.onmessage = (e) => {
  const { earthquakes, conditions } = e.data;
  const filtered = filterEarthquakes(earthquakes, conditions);
  self.postMessage(filtered);
};

// Component
const worker = new Worker('/worker.js');
worker.postMessage({ earthquakes, conditions });
worker.onmessage = (e) => setFilteredResults(e.data);
```

## Testing

### Unit Tests

```typescript
// earthquake-explorer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EarthquakeExplorer } from './earthquake-explorer';

describe('EarthquakeExplorer', () => {
  const mockEarthquakes = [
    { id: '1', magnitude: 3.2, latitude: 37.7, longitude: -122.4, ... },
    { id: '2', magnitude: 2.5, latitude: 37.8, longitude: -122.3, ... },
  ];

  it('renders quick filters', () => {
    render(
      <EarthquakeExplorer
        earthquakes={mockEarthquakes}
        userLocation={null}
        onResultsChange={jest.fn()}
        getDistance={jest.fn()}
      />
    );
    expect(screen.getByText('Felt by Many')).toBeInTheDocument();
  });

  it('filters earthquakes by magnitude', () => {
    const handleResults = jest.fn();
    render(
      <EarthquakeExplorer
        earthquakes={mockEarthquakes}
        userLocation={null}
        onResultsChange={handleResults}
        getDistance={jest.fn()}
      />
    );
    
    // Apply magnitude filter
    // Verify handleResults called with filtered array
  });
});
```

### Integration Tests

```typescript
// Test full user journey
it('user can build and save a query', async () => {
  render(<MyNeighborhood historicalEarthquakes={mockData} />);
  
  // Enter address
  const addressInput = screen.getByPlaceholderText('Search Address');
  fireEvent.change(addressInput, { target: { value: '123 Main St' } });
  
  // Apply quick filter
  fireEvent.click(screen.getByText('Strong & Close'));
  
  // Verify results
  expect(screen.getByText(/Found \d+ earthquakes/)).toBeInTheDocument();
  
  // Save query
  fireEvent.click(screen.getByText('Save'));
  fireEvent.change(screen.getByPlaceholderText('Query name'), { 
    target: { value: 'My Saved Search' } 
  });
  fireEvent.click(screen.getByText('Save Query'));
  
  // Verify saved
  expect(localStorage.getItem('saved_queries')).toContain('My Saved Search');
});
```

## Accessibility

### Keyboard Navigation

```typescript
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch(e.key) {
        case 'k':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'f':
          e.preventDefault();
          setShowFacets(!showFacets);
          break;
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [showFacets]);
```

### ARIA Labels

```tsx
<button
  aria-label="Apply magnitude filter greater than 3.0"
  aria-pressed={isActive}
  onClick={handleClick}
>
  Magnitude > 3.0
</button>

<div role="search" aria-label="Earthquake search">
  <input
    type="text"
    aria-label="Search earthquakes"
    aria-describedby="search-help"
  />
  <div id="search-help" className="sr-only">
    Try: magnitude > 3.0, felt by people, within 10 miles
  </div>
</div>
```

## Mobile Considerations

### Responsive Facets

```tsx
// Desktop: sidebar
// Mobile: modal
{isMobile ? (
  <FacetsModal
    facets={facets}
    isOpen={showFacets}
    onClose={() => setShowFacets(false)}
  />
) : (
  <FacetsSidebar facets={facets} />
)}
```

### Touch Gestures

```typescript
// Swipe to open/close facets
const handlers = useSwipeable({
  onSwipedUp: () => setShowFacets(true),
  onSwipedDown: () => setShowFacets(false),
  preventDefaultTouchmoveEvent: true,
});

<div {...handlers}>
  {/* Content */}
</div>
```

## Monitoring & Analytics

### Track User Behavior

```typescript
// Track filter usage
const trackFilter = (filterType: string, value: any) => {
  if (typeof window !== 'undefined' && window.datadog) {
    window.datadog.track('filter_applied', {
      filter_type: filterType,
      value: value,
      results_count: filteredEarthquakes.length
    });
  }
};

// Track query saves
const trackQuerySave = (queryName: string) => {
  if (typeof window !== 'undefined' && window.datadog) {
    window.datadog.track('query_saved', {
      query_name: queryName,
      condition_count: activeConditions.length
    });
  }
};

// Track "no results"
useEffect(() => {
  if (activeConditions.length > 0 && filteredEarthquakes.length === 0) {
    if (typeof window !== 'undefined' && window.datadog) {
      window.datadog.track('no_results', {
        conditions: activeConditions,
        total_earthquakes: earthquakes.length
      });
    }
  }
}, [activeConditions, filteredEarthquakes, earthquakes]);
```

## Deployment Checklist

- [ ] Components built and tested
- [ ] Integration with existing my-neighborhood page
- [ ] LocalStorage persistence working
- [ ] URL sharing functional
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Screen reader compatible
- [ ] Analytics tracking enabled
- [ ] Performance profiled (< 100ms filter time)
- [ ] Error boundaries in place
- [ ] User documentation written
- [ ] Beta user group identified
- [ ] Rollback plan prepared

## Rollout Strategy

### Phase 1: Beta (Week 1)
- Deploy to 10% of users
- Monitor analytics closely
- Gather direct feedback
- Fix critical bugs

### Phase 2: Gradual Rollout (Week 2-3)
- 25% of users
- 50% of users
- 75% of users
- Monitor performance and engagement

### Phase 3: Full Launch (Week 4)
- 100% of users
- Announce on social media
- Press outreach
- Gather testimonials

### Success Criteria
- < 5% error rate
- 50%+ filter usage rate
- 4.0+ user rating
- No major performance issues

## Support & Documentation

### User Help Text

```tsx
<Tooltip content="Magnitude measures earthquake strength. M3.0 feels like a truck driving by.">
  <HelpCircle className="w-4 h-4" />
</Tooltip>
```

### Empty State Guidance

```tsx
{filteredEarthquakes.length === 0 && (
  <EmptyState
    icon={<Search />}
    title="No earthquakes found"
    description="Your filters are too restrictive. Try:"
    suggestions={[
      "Increasing the search radius",
      "Extending the time range",
      "Removing some filters"
    ]}
    actions={
      <>
        <Button onClick={clearFilters}>Clear All Filters</Button>
        <Button onClick={expandRadius}>Expand to 25 Miles</Button>
      </>
    }
  />
)}
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  EARTHQUAKE EXPLORER QUICK REFERENCE                    │
├─────────────────────────────────────────────────────────┤
│  QUICK FILTERS (1-click)                                │
│  🔥 Felt by Many     → felt by 50+ people               │
│  ⚡ Strong & Close   → M3.0+ within 10 mi               │
│  🌊 Shallow Events   → depth < 5km                      │
│                                                          │
│  SEARCH BAR                                              │
│  Type: "magnitude" → See suggestions                     │
│  Type: "felt by people" → Auto-complete                 │
│                                                          │
│  FACETS (checkboxes)                                     │
│  📊 Magnitude, 📏 Distance, 👥 Felt, ⏰ Time, 🌊 Depth  │
│                                                          │
│  KEYBOARD SHORTCUTS                                      │
│  Cmd+K → Focus search                                    │
│  Cmd+F → Toggle facets                                   │
│  Esc   → Clear filters                                   │
└─────────────────────────────────────────────────────────┘
```

Ready to make earthquake data accessible! 🚀

