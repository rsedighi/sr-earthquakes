# Earthquake Explorer - Complete UI Mockup

## Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  🏠 My Neighborhood                                                                     │
│  Find earthquakes people felt near your address                                         │
│                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [📍 Search Address...                                            ] [Clear]             │
│  ✓ Your address is saved for your next visit                                           │
│                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ✨ Quick Filters:                                                                      │
│  [🔥 Felt by Many] [⚡ Strong & Close] [🌊 Shallow Events] [📈 Significant Only]       │
│                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [🔍 Try: magnitude > 3.0, felt by people, within 10 miles...                        ] │
│                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  🔧 Active filters: │ magnitude ≥ 3.0 ✕ │ within 10 miles ✕ │ Clear all               │
│                                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Found 23 earthquakes matching your filters                      [Hide Facets ▼]       │
│                                                                                          │
├──────────────────────┬──────────────────────────────────────────────────────────────────┤
│                      │                                                                   │
│  📊 MAGNITUDE ▼      │  ┌──────────────────────────────────────────────────────────┐   │
│  ☐ Micro    1,234    │  │                                                           │   │
│  ☑ Minor      156    │  │                                                           │   │
│  ☑ Light       23    │  │              [MAP VISUALIZATION]                         │   │
│  ☐ Moderate     5    │  │              Your location + earthquakes                 │   │
│  ☐ Strong       1    │  │              with radius circle                          │   │
│                      │  │                                                           │   │
│  📏 DISTANCE ▼       │  │                                                           │   │
│  ☑ 0-5 mi      45    │  └──────────────────────────────────────────────────────────┘   │
│  ☑ 5-10 mi     89    │  Showing 23 earthquakes | within 10 miles                      │
│  ☐ 10-25 mi   234    │                                                                  │
│  ☐ 25+ mi     567    │  ┌─────────┬─────────┬─────────┬─────────┐                     │
│                      │  │ 📊 23   │ 👥 12   │ ⚠️ M4.1 │ 📍 3.2mi│                     │
│  👥 FELT ▼           │  │ Total   │ People  │ Largest │ Closest │                     │
│  ☑ Felt       67    │  │ Found   │ Felt    │         │         │                     │
│  ☐ Not felt 1,352   │  └─────────┴─────────┴─────────┴─────────┘                     │
│                      │                                                                  │
│  ⏰ WHEN ▼           │  ┌──────────────────────────────────────────────────────────┐   │
│  ☑ Last 24h    12    │  │ 📅 DECEMBER 20, 2024 (3 earthquakes)                    │   │
│  ☐ Last week   89    │  │ ┌────────────────────────────────────────────────────┐ │   │
│  ☐ Last month 234    │  │ │ 🔴 M3.2 • San Francisco                           │ │   │
│  ☐ This year 1,234   │  │ │ 2:15 PM • 5.2 mi away • 45 people felt it         │ │   │
│                      │  │ └────────────────────────────────────────────────────┘ │   │
│  🌊 DEPTH ▼          │  │ ┌────────────────────────────────────────────────────┐ │   │
│  ☐ Shallow    234    │  │ │ 🟠 M2.8 • Oakland                                 │ │   │
│  ☑ Moderate   789    │  │ │ 8:30 AM • 12.1 mi away • 12 people felt it        │ │   │
│  ☐ Deep       123    │  │ └────────────────────────────────────────────────────┘ │   │
│                      │  │ ┌────────────────────────────────────────────────────┐ │   │
│  📍 LOCATIONS ▼      │  │ │ 🟡 M1.9 • Berkeley                                │ │   │
│  ☐ San Fran   234    │  │ │ 3:45 AM • 8.3 mi away • not reported felt         │ │   │
│  ☐ Berkeley   123    │  │ └────────────────────────────────────────────────────┘ │   │
│  ☐ Oakland     89    │  ├──────────────────────────────────────────────────────────┤   │
│  ☐ San Jose    67    │  │ 📅 DECEMBER 19, 2024 (1 earthquake)                     │   │
│                      │  │ ┌────────────────────────────────────────────────────┐ │   │
│                      │  │ │ 🔴 M4.1 • Pacifica                                │ │   │
│                      │  │ │ 11:20 PM • 15.2 mi away • 234 people felt it      │ │   │
│                      │  │ └────────────────────────────────────────────────────┘ │   │
│                      │  └──────────────────────────────────────────────────────────┘   │
│                      │                                                                   │
└──────────────────────┴──────────────────────────────────────────────────────────────────┘
```

## Search Bar with Auto-Complete (Active State)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 magnitude                                                    │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ 💡 Suggestions:                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 magnitude > 2.0                                             │
│ 🔍 magnitude > 3.0                                             │
│ 🔍 magnitude > 4.0                                             │
│ 🔍 magnitude between 2.0 and 4.0                               │
│ 🔍 magnitude greater than or equal to 3.5                      │
├─────────────────────────────────────────────────────────────────┤
│ 💡 Combine with:                                                │
│ → AND felt by people                                            │
│ → AND within 10 miles                                           │
│ → AND in the last 24 hours                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Visual Query Builder (Expanded)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Build Your Search                                      [💾 Save] [▶️ Apply] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│      [Magnitude ▼] [greater than ▼] [3.0]                                  │
│                                                                              │
│ AND  [Distance ▼] [less than ▼] [10] miles                                 │
│                                                                              │
│ AND  [Felt ▼] [greater than ▼] [0] people                                  │
│                                                                              │
│      [➕ Add Another Condition]                                             │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📝 This will find:                                                          │
│ "Earthquakes with magnitude > 3.0 within 10 miles that were felt by people"│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Saved Queries Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💾 Your Saved Searches                                         [+ New Query]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │ 📌 School Area Check                              [Load] [Edit] [✕]  │   │
│ │ magnitude ≥ 3.0, within 10 miles                                     │   │
│ │ Last run: 2 days ago • Found 5 results                               │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │ 🔔 Weekend Monitoring                             [Load] [Edit] [✕]  │   │
│ │ felt by people, in the last 48 hours                                 │   │
│ │ Last run: 1 week ago • Found 0 results                               │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │ 🌊 Shallow Activity                               [Load] [Edit] [✕]  │   │
│ │ depth < 5km, magnitude > 2.0                                         │   │
│ │ Last run: 3 days ago • Found 89 results                              │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mobile View

```
┌──────────────────────────────────┐
│ 🏠 My Neighborhood              │
├──────────────────────────────────┤
│                                  │
│ [📍 Search Address...         ] │
│ ✓ Saved for next visit          │
│                                  │
├──────────────────────────────────┤
│ [🔍 Search...]                  │
│                                  │
│ [⚙️ Filters (2 active)         ]│
│                                  │
├──────────────────────────────────┤
│ magnitude ≥ 3.0 ✕               │
│ within 10 miles ✕               │
│                                  │
│ Found 23 earthquakes             │
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐│
│ │                              ││
│ │      [MAP]                   ││
│ │                              ││
│ └──────────────────────────────┘│
│                                  │
├──────────────────────────────────┤
│ Sort: [Most Recent ▼]           │
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐│
│ │ 🔴 M3.2 • San Francisco     ││
│ │ 2:15 PM • 5.2 mi            ││
│ │ 45 people felt it            ││
│ └──────────────────────────────┘│
│                                  │
│ ┌──────────────────────────────┐│
│ │ 🟠 M2.8 • Oakland           ││
│ │ 8:30 AM • 12.1 mi           ││
│ │ 12 people felt it            ││
│ └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
```

## Filters Modal (Mobile)

```
┌──────────────────────────────────┐
│ ⚙️ Filters              [Done]  │
├──────────────────────────────────┤
│                                  │
│ ✨ Quick Filters                │
│ [🔥 Felt by Many]               │
│ [⚡ Strong & Close]             │
│ [🌊 Shallow Events]             │
│                                  │
├──────────────────────────────────┤
│                                  │
│ 📊 MAGNITUDE            [▼]     │
│ ☐ Micro (< 2.0)      1,234     │
│ ☑ Minor (2.0-3.0)      156     │
│ ☑ Light (3.0-4.0)       23     │
│ ☐ Moderate (4.0-5.0)     5     │
│ ☐ Strong (> 5.0)         1     │
│                                  │
├──────────────────────────────────┤
│                                  │
│ 📏 DISTANCE             [▼]     │
│ ☑ 0-5 miles              45     │
│ ☑ 5-10 miles             89     │
│ ☐ 10-25 miles           234     │
│ ☐ 25+ miles             567     │
│                                  │
├──────────────────────────────────┤
│                                  │
│ 👥 FELT REPORTS         [▼]     │
│ ☑ Felt by people         67     │
│ ☐ Not reported felt   1,352     │
│                                  │
├──────────────────────────────────┤
│                                  │
│ [Clear All] [Apply Filters]     │
│                                  │
└──────────────────────────────────┘
```

## Query Building Flow (Step-by-Step)

### Step 1: User clicks "Build Custom Search"
```
┌─────────────────────────────────────────────────────────────┐
│ Build Your Search                              [▶️ Apply]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│      [Select field ▼] [Select operator ▼] [Value]          │
│                                                              │
│      [➕ Add Condition]                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: User selects "Magnitude"
```
┌─────────────────────────────────────────────────────────────┐
│ Build Your Search                              [▶️ Apply]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│      [Magnitude ▼] [Select operator ▼] [Value]             │
│                     ┌──────────────────────┐                │
│                     │ greater than (>)     │                │
│                     │ greater or equal (≥) │ ← highlighted  │
│                     │ less than (<)        │                │
│                     │ less or equal (≤)    │                │
│                     │ between              │                │
│                     └──────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: User sets value
```
┌─────────────────────────────────────────────────────────────┐
│ Build Your Search                              [▶️ Apply]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│      [Magnitude ▼] [greater than ▼] [3.0]                  │
│                                                              │
│      [➕ Add Condition]                                     │
│                                                              │
│ 📝 This will find: "Magnitude greater than 3.0"            │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: User adds another condition
```
┌─────────────────────────────────────────────────────────────┐
│ Build Your Search                              [▶️ Apply]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│      [Magnitude ▼] [greater than ▼] [3.0]                  │
│                                                              │
│ AND  [Distance ▼] [less than ▼] [10] miles                 │
│                                                              │
│      [➕ Add Condition]                                     │
│                                                              │
│ 📝 This will find:                                          │
│ "Magnitude greater than 3.0 within 10 miles"               │
└─────────────────────────────────────────────────────────────┘
```

## Results Display Options

### List View (Default)
```
┌─────────────────────────────────────────────────────────────┐
│ Sort: [Most Recent ▼]  View: [List] [Map] [Timeline]       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 M3.2 • San Francisco                                │ │
│ │ December 20, 2024 at 2:15 PM                            │ │
│ │ 📍 5.2 miles from you • 👥 45 people felt it           │ │
│ │ 🌊 Depth: 8.3 km                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Timeline View
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│    Dec 19  Dec 20                                           │
│      │       │                                               │
│      ●───────●───●                                          │
│    M4.1   M3.2 M2.8                                         │
│                                                              │
│    [Scroll to zoom timeline]                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Empty State (No Results)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                   🔍                                         │
│           No earthquakes found                               │
│                                                              │
│   Your filters are too restrictive. Try:                    │
│   • Increasing the search radius                            │
│   • Extending the time range                                │
│   • Removing some filters                                   │
│                                                              │
│   [Clear All Filters] [Adjust Radius]                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Loading State

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                   ⚡                                         │
│            Analyzing earthquakes...                          │
│                                                              │
│   [████████████░░░░░░░░] 65%                                │
│                                                              │
│   Filtering 1,234 earthquakes...                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Share Dialog

```
┌─────────────────────────────────────────────────────────────┐
│ Share Your Search                              [✕ Close]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Anyone with this link can view these results:               │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://baytremor.com/my-area?q=mag_gt_3_dist_10       │ │
│ │                                            [📋 Copy]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Or share via:                                                │
│ [📧 Email] [📱 Text] [🐦 Twitter] [📘 Facebook]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

```
Magnitude Colors:
🔴 M5.0+   → Strong    → Red (#EF4444)
🟠 M4.0-5.0 → Moderate  → Orange (#F97316)
🟡 M3.0-4.0 → Light     → Yellow (#F59E0B)
🟢 M2.0-3.0 → Minor     → Green (#10B981)
⚪ M<2.0    → Micro     → Gray (#6B7280)

UI Elements:
Background       → #0A0A0A (neutral-950)
Cards            → #FFFFFF10 (white/10%)
Borders          → #FFFFFF10 (white/10%)
Text Primary     → #FFFFFF (white)
Text Secondary   → #A3A3A3 (neutral-400)
Accent           → #3B82F6 (blue-500)
Success          → #10B981 (green-500)
Warning          → #F59E0B (yellow-500)
Error            → #EF4444 (red-500)
```

## Responsive Breakpoints

```
Mobile:        < 768px  → Single column, collapsed facets
Tablet:   768 - 1024px  → Two columns, collapsible facets  
Desktop: 1024 - 1440px  → Three columns, expanded facets
Wide:         > 1440px  → Three columns, expanded everything
```

---

This mockup shows the complete user experience from search to results, with all the data exploration capabilities in place. The interface is designed to be intuitive for beginners while providing power features for advanced users.

