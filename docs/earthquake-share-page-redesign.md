# Earthquake Share Page Redesign: Mobile-First Community Experience

## Vision

Transform the earthquake share page from a data-heavy page into a **mobile-first, community-driven experience** that provides:
1. **Better context than USGS** - AI-powered analysis that explains what this earthquake means for YOU
2. **Community connection** - A social feed-like experience where neighbors share their experiences
3. **Visual storytelling** - Less numbers, more visuals and narratives
4. **Immediate value** - Users should understand the impact within 3 seconds of landing

---

## User Landing Experience (First 3 Seconds)

### Current Problems
- Too much technical data (lat/long, significance scores)
- Stats-heavy layout that looks intimidating
- Comments are buried at the bottom
- Feels like a technical report, not a community resource

### New Experience (Mobile-First)

```
┌─────────────────────────────────────┐
│  M4.2 Earthquake                    │
│  Pleasant Hill, CA                  │
│  5 minutes ago                      │
│                                     │
│  ╔══════════════════════════════╗  │
│  ║  🔸 MODERATE SHAKING         ║  │
│  ║  Felt by 234 people          ║  │
│  ╚══════════════════════════════╝  │
│                                     │
│  🤖 AI ANALYSIS                     │
│  ┌──────────────────────────────┐  │
│  │ "This earthquake was         │  │
│  │  stronger than 90% of quakes │  │
│  │  in your area this year.     │  │
│  │  Similar to the M4.1 that    │  │
│  │  occurred in July."          │  │
│  └──────────────────────────────┘  │
│                                     │
│  👥 WHAT YOUR NEIGHBORS SAW         │
│  ┌──────────────────────────────┐  │
│  │ 😨 Sarah (Downtown)           │  │
│  │ "My whole apartment shook!   │  │
│  │  Pictures fell off the wall" │  │
│  │ 2 min ago • 12 reactions     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 👍 Mike (Walnut Creek)        │  │
│  │ "Felt like a truck driving   │  │
│  │  by. Lasted ~5 seconds"      │  │
│  │ 4 min ago • 8 reactions      │  │
│  └──────────────────────────────┘  │
│                                     │
│  [💬 Add Your Experience]          │
│                                     │
│  📍 MAP SHOWING EPICENTER           │
│  [Interactive heat map of reports] │
│                                     │
│  📊 AI-POWERED INSIGHTS             │
│  [Visual comparisons & context]    │
└─────────────────────────────────────┘
```

---

## 1. Hero Section: Immediate Impact Understanding

### Design Principles
- **Visual hierarchy**: Magnitude → Impact level → Social proof
- **Emotional color coding**: Not just red/yellow/green, but meaningful gradients
- **Recency indicator**: Pulsing animation for quakes < 1 hour old

### Implementation

```typescript
interface HeroSection {
  // Bold, attention-grabbing
  magnitude: number;
  location: string; // Human-friendly: "Pleasant Hill" not "5km NE of..."
  timeAgo: string; // "5 minutes ago" not timestamp
  
  // Impact badge
  impactLevel: {
    emoji: string; // 🔸, 🟠, 🔴
    label: string; // "LIGHT SHAKING", "MODERATE", "STRONG"
    color: string; // Gradient background
    description: string; // "You probably felt this"
  };
  
  // Social proof
  feltCount: number; // "Felt by 234 people"
  commentCount: number; // "89 people shared their experience"
}
```

**Example:**
```tsx
<div className="hero-gradient from-orange-500/30 to-amber-500/20 p-6 rounded-2xl">
  <div className="flex items-center gap-3 mb-2">
    <span className="text-6xl font-black">4.2</span>
    <div>
      <span className="block text-sm text-neutral-400">MAGNITUDE</span>
      <span className="block text-2xl font-bold">Earthquake</span>
    </div>
  </div>
  
  <h1 className="text-3xl font-bold mb-1">Pleasant Hill, CA</h1>
  <p className="text-neutral-300 mb-4">5 minutes ago • 3.2 miles deep</p>
  
  <div className="flex items-center gap-2 p-4 bg-orange-500/20 rounded-xl border-2 border-orange-500/40">
    <span className="text-3xl">🔸</span>
    <div>
      <span className="block text-xl font-bold text-orange-300">MODERATE SHAKING</span>
      <span className="block text-sm text-neutral-300">Widely felt • May cause minor damage</span>
    </div>
  </div>
  
  <div className="flex items-center gap-4 mt-4 text-sm">
    <span className="flex items-center gap-1 text-neutral-300">
      <Users className="w-4 h-4" />
      234 felt this
    </span>
    <span className="flex items-center gap-1 text-neutral-300">
      <MessageCircle className="w-4 h-4" />
      89 comments
    </span>
  </div>
</div>
```

---

## 2. AI-Powered Analysis (Replaces Technical Stats)

### What USGS Doesn't Provide
- **Personal context**: "How does this compare to others near me?"
- **Trend analysis**: "Is this part of a swarm?"
- **Plain English**: "What does 4.2 magnitude actually mean?"
- **Predictions**: "Should I expect aftershocks?"

### AI Analysis Sections

#### A. One-Sentence Summary
**Goal**: Instant understanding
```
"This was a moderate earthquake - stronger than 90% of 
quakes in your area this year, but unlikely to cause damage."
```

#### B. Visual Comparison
Replace raw stats with comparative visuals:

```
┌─────────────────────────────────────────────┐
│ HOW THIS COMPARES                           │
│                                             │
│ This quake (M4.2)  ████████████░░░  4.2     │
│ Typical (M2.5)     ████░░░░░░░░░░  2.5      │
│ Largest (M5.1)     ████████████████ 5.1     │
│                                             │
│ 📊 THIS YEAR'S EARTHQUAKES:                 │
│ • 1,234 total quakes in your area           │
│ • 890 micro (M<2.0) - usually not felt      │
│ • 298 minor (M2-3) - sometimes felt         │
│ • 38 light (M3-4) - often felt              │
│ • 7 moderate (M4-5) - widely felt ← YOU ARE HERE │
│ • 1 strong (M5+) - significant              │
│                                             │
│ 🔹 This is the 7th moderate quake this year │
│ 🔹 Energy: Enough to charge 50,000 iPhones  │
│ 🔹 12th largest in Pleasant Hill since 2020 │
└─────────────────────────────────────────────┘
```

#### C. Historical Context (AI-Generated)
```typescript
interface AIAnalysis {
  summary: string; // 2-3 sentences
  comparisons: {
    vsAverageQuake: number; // 2.5× stronger
    vsTodayQuakes: string; // "Largest of 7 quakes today"
    vsYearlyMax: string; // "Second largest this year"
  };
  insights: {
    icon: string;
    text: string;
  }[];
  // Examples:
  // { icon: "📈", text: "Part of a 3-day swarm of 15 earthquakes" }
  // { icon: "🏠", text: "Shallow depth means it was felt more intensely" }
  // { icon: "⚠️", text: "Similar quakes often have aftershocks within 24 hours" }
}
```

#### D. What to Expect Next
```
┌─────────────────────────────────────────────┐
│ 🔮 WHAT TO EXPECT                           │
│                                             │
│ ⚡ Aftershocks (Likely)                     │
│ Small aftershocks are common within 24hrs.  │
│ Most will be unnoticeable (< M2.0)         │
│                                             │
│ 🏚️ Damage (Unlikely)                       │
│ M4.2 rarely causes structural damage.       │
│ Check for fallen objects & cracks.          │
│                                             │
│ 📊 Follow-up Activity (Moderate)            │
│ This may be part of a swarm. We'll watch   │
│ for more earthquakes in the next 3 days.    │
└─────────────────────────────────────────────┘
```

---

## 3. Community Feed (The Star of the Show)

### Design Philosophy
- **Social media DNA**: Make it feel like Instagram/Twitter
- **Real-time updates**: New comments appear instantly (Pusher)
- **Engagement mechanics**: Reactions, replies, helpful votes
- **Location clustering**: "23 people in Downtown felt this"

### Feed Layout (Mobile-Optimized)

```
┌─────────────────────────────────────────────┐
│ 💬 WHAT PEOPLE ARE EXPERIENCING (234)      │
│                                             │
│ [📝 Share Your Experience] ← Prominent CTA │
│                                             │
│ 📍 DOWNTOWN PLEASANT HILL (45 reports)     │
│ ────────────────────────────────────────── │
│ ┌─────────────────────────────────────┐   │
│ │ 😱 Sarah M. • Just now              │   │
│ │ My ENTIRE apartment shook! I was in │   │
│ │ the kitchen and saw the chandelier  │   │
│ │ swinging. Lasted about 8 seconds.   │   │
│ │                                     │   │
│ │ 👍 12  💬 4  ⚡ Felt it strongly     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 👌 Mike R. • 2 min ago              │   │
│ │ Definitely felt it but not too bad. │   │
│ │ Coffee mug rattled on my desk.      │   │
│ │                                     │   │
│ │ 👍 8  💬 2  ⚡ Felt it moderately    │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 📍 WALNUT CREEK (31 reports)               │
│ ────────────────────────────────────────── │
│ ┌─────────────────────────────────────┐   │
│ │ 🤷 Tom L. • 3 min ago               │   │
│ │ Barely noticed. Thought it was my   │   │
│ │ neighbor's washing machine.         │   │
│ │                                     │   │
│ │ 👍 5  💬 1  ⚡ Felt it lightly       │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [Load More Comments (189 more)]            │
└─────────────────────────────────────────────┘
```

### Enhanced Comment Features

#### Intensity Selector (Visual & Fun)
```tsx
<div className="intensity-selector">
  <p className="text-sm mb-2">How strongly did you feel it?</p>
  <div className="flex gap-2">
    <button className="intensity-btn">
      🤷
      <span>Barely</span>
    </button>
    <button className="intensity-btn">
      👌
      <span>Light</span>
    </button>
    <button className="intensity-btn active">
      💪
      <span>Moderate</span>
    </button>
    <button className="intensity-btn">
      😱
      <span>Strong</span>
    </button>
    <button className="intensity-btn">
      🔴
      <span>Violent</span>
    </button>
  </div>
</div>
```

#### Quick Templates for Lazy Users
```tsx
<div className="quick-responses">
  <p className="text-xs text-neutral-400 mb-2">Or use a quick response:</p>
  <div className="flex flex-wrap gap-2">
    <button className="quick-btn">Felt it in bed 🛏️</button>
    <button className="quick-btn">At work, everyone noticed 💼</button>
    <button className="quick-btn">Kids got scared 👶</button>
    <button className="quick-btn">Dog went crazy 🐕</button>
    <button className="quick-btn">Didn't feel it 🤷</button>
  </div>
</div>
```

#### Reaction System (like Slack/Discord)
```tsx
<div className="reactions">
  <button className="reaction">👍 12</button>
  <button className="reaction">❤️ 8</button>
  <button className="reaction">😮 5</button>
  <button className="reaction">🙏 3</button>
  <button className="reaction-add">+ Add</button>
</div>
```

#### Location-Based Grouping
```typescript
interface CommentFeed {
  grouped: {
    location: string; // "Downtown Pleasant Hill"
    count: number; // 45 reports
    averageIntensity: number; // 3.2 / 5
    topComments: Comment[]; // Top 3 by reactions
    collapsed: boolean; // Expand/collapse
  }[];
}
```

---

## 4. Visual "Felt Map" (Heat Map)

### Interactive Map Showing Community Reports

```
┌─────────────────────────────────────────────┐
│ 📍 WHO FELT IT & WHERE                      │
│                                             │
│ [Interactive map with heat zones]           │
│                                             │
│ 🟥 Strong shaking (15 reports)             │
│ 🟧 Moderate (89 reports)                   │
│ 🟨 Light (124 reports)                     │
│ ⬜ Not felt (6 reports)                    │
│                                             │
│ Click any zone to see comments from        │
│ that area                                   │
└─────────────────────────────────────────────┘
```

**Features:**
- Real-time updates as people report
- Clustering of reports by location
- Color intensity based on aggregate "felt intensity"
- Tap a cluster to see comments from that area
- Shows radius of felt reports

---

## 5. AI Visual Insights (Replaces Stats Grid)

### Instead of showing raw data like "significance: 342", show:

#### A. Energy Visualization
```
┌─────────────────────────────────────────────┐
│ 💥 ENERGY RELEASED                          │
│                                             │
│ [Battery-style graphic showing fill level]  │
│ 🔋 ████████░░░░░░░░                        │
│                                             │
│ That's enough energy to:                    │
│                                             │
│ 🚗 Charge a Tesla Model 3 → 500 times      │
│ 📱 Charge an iPhone 15 → 50,000 times      │
│ 🎸 Power Coachella main stage → 2 hours    │
│ 🏠 Run a house → 3 months                  │
│ ☕ Brew espresso → 25,000 cups             │
│                                             │
│ Or in old-school terms: ~1 ton of TNT 💣   │
└─────────────────────────────────────────────┘
```

#### B. Shake Duration
```
┌─────────────────────────────────────────────┐
│ ⏱️ HOW LONG IT LASTED                       │
│                                             │
│ [Waveform animation]                        │
│ ╱╲╱╲╱╲____                                 │
│                                             │
│ Most people felt shaking for 5-8 seconds    │
│                                             │
│ P-wave arrival: 0s                          │
│ S-wave arrival: 2s ← Strongest shaking     │
│ Surface waves: 5-8s                         │
└─────────────────────────────────────────────┘
```

#### C. Depth Visualization
```
┌─────────────────────────────────────────────┐
│ 🌍 DEPTH & IMPACT                           │
│                                             │
│ ───── Ground level                          │
│                                             │
│ │ 1 km                                      │
│ │                                           │
│ │ 2 km                                      │
│ │                                           │
│ ● 3.2 km ← This earthquake                 │
│ │                                           │
│ │ 4 km                                      │
│ │                                           │
│ ─────                                       │
│                                             │
│ SHALLOW = Felt more strongly at surface     │
│ Typical for Bay Area quakes: 5-15 km       │
└─────────────────────────────────────────────┘
```

---

## 6. Mobile-First Interactions

### Swipe Gestures
- **Swipe up** on comment card → See replies
- **Swipe right** on map → Compare with past quakes
- **Pull down** → Refresh for new comments

### Bottom Sheet Design
```
┌─────────────────────────────────────────────┐
│ [Map showing epicenter]                     │
│                                             │
│ [Drag handle - swipe up to expand]         │
│ ═══                                         │
│                                             │
│ M4.2 Earthquake                             │
│ Pleasant Hill, CA                           │
│                                             │
│ [Swipe up to see full details & comments]  │
└─────────────────────────────────────────────┘
```

### Quick Actions (Floating Button)
```
[💬] ← Tapping opens comment composer
     Positioned at thumb-reachable zone
     Pulsing animation
```

---

## 7. Implementation Plan

### Phase 1: Core Mobile Experience (Week 1)
- [ ] Redesign hero section with impact badge
- [ ] Simplify layout - remove stats grid
- [ ] Move comments to prominent position
- [ ] Add intensity selector to comments
- [ ] Implement location-based grouping

### Phase 2: AI Integration (Week 2)
- [ ] Create AI analysis endpoint
- [ ] Generate personalized summaries
- [ ] Add visual comparisons (strength bars)
- [ ] Create "What to Expect" section
- [ ] Add historical context

### Phase 3: Enhanced Community (Week 3)
- [ ] Add reaction system
- [ ] Implement quick response templates
- [ ] Create felt map with heat zones
- [ ] Add comment sorting (by location, time, reactions)
- [ ] Real-time comment counter

### Phase 4: Visual Storytelling (Week 4)
- [ ] Energy visualization graphics
- [ ] Depth diagram
- [ ] Shake duration animation
- [ ] Timeline of earthquake sequence
- [ ] Comparison slider with past quakes

---

## 8. Success Metrics

### Engagement Metrics
- **Comment rate**: Target 15% of visitors leave a comment (up from current ~5%)
- **Time on page**: Target 2.5 minutes (up from current ~45 seconds)
- **Share rate**: Target 25% of visitors share the page
- **Return visitors**: Target 30% come back to check updates

### Mobile Optimization
- **Thumb reach**: All primary actions within 75% thumb zone
- **Page load**: < 2s on 3G connection
- **CLS (Cumulative Layout Shift)**: < 0.1
- **First Contentful Paint**: < 1s

### Community Health
- **Positive comments**: > 80% (filter spam/negativity)
- **Location diversity**: Reports from 5+ neighborhoods
- **Response time**: New comments visible within 2 seconds

---

## 9. AI Prompt Design

### For Earthquake Analysis
```typescript
const prompt = `You are explaining a M${magnitude} earthquake to a local resident.

Earthquake details:
- Location: ${place}
- Depth: ${depth}km (${depth < 5 ? 'shallow' : depth < 15 ? 'moderate' : 'deep'})
- Time: ${timeAgo}
- Felt by: ${feltCount} people

Context:
- This is the ${rank}th largest earthquake in ${region} this year
- Average magnitude in this area: M${avgMagnitude}
- Last similar earthquake: M${lastSimilar.magnitude} on ${lastSimilar.date}

Write a 2-3 sentence analysis that:
1. Explains what this magnitude means in everyday terms
2. Provides reassuring context by comparing to past similar quakes
3. Mentions any notable characteristics (shallow depth, swarm activity, etc.)

Be conversational, factual, and helpful. Don't use jargon.`;
```

---

## 10. Example Full Page (Mobile View)

```
┌─────────────────────────────────────────────┐
│ ← Bay Area Quake Tracker                    │
├─────────────────────────────────────────────┤
│                                             │
│ 🟠 M4.2 EARTHQUAKE                          │
│                                             │
│ Pleasant Hill, CA                           │
│ 5 minutes ago                               │
│                                             │
│ ╔═══════════════════════════════════════╗  │
│ ║  🔸 MODERATE SHAKING                  ║  │
│ ║  Widely felt • May cause minor damage ║  │
│ ╚═══════════════════════════════════════╝  │
│                                             │
│ 👥 234 felt it  💬 89 comments              │
│                                             │
├─────────────────────────────────────────────┤
│ 🤖 AI ANALYSIS                              │
├─────────────────────────────────────────────┤
│                                             │
│ "This moderate earthquake was 2.5× stronger │
│ than typical quakes in your area. Similar  │
│ to the M4.1 that occurred in July near     │
│ Concord. Shallow depth means you likely    │
│ felt it more intensely than usual."        │
│                                             │
│ ─── HOW THIS COMPARES ───                   │
│                                             │
│ This quake  ████████████░░░░ 4.2           │
│ Average     ████░░░░░░░░░░░░ 2.5           │
│ Largest     ████████████████ 5.1 (Jan)     │
│                                             │
│ 💥 Energy: 1 ton of TNT                     │
│ 📏 Depth: 3.2 km (shallow)                  │
│ 📈 12th largest in area since 2020          │
│                                             │
├─────────────────────────────────────────────┤
│ 📍 WHO FELT IT                              │
├─────────────────────────────────────────────┤
│                                             │
│ [Interactive heat map]                      │
│ 🟥 45 reports (strong)                      │
│ 🟧 89 reports (moderate)                    │
│ 🟨 94 reports (light)                       │
│                                             │
├─────────────────────────────────────────────┤
│ 💬 WHAT YOUR NEIGHBORS SAW                  │
├─────────────────────────────────────────────┤
│                                             │
│ [💬 Share Your Experience] ← Big button     │
│                                             │
│ 📍 Downtown (45 reports) ────────           │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 😱 Sarah M. • Just now              │   │
│ │ My entire apartment shook! Pictures │   │
│ │ fell off the wall. Kids were scared.│   │
│ │                                     │   │
│ │ ⚡ Felt it strongly                  │   │
│ │ 👍 12  ❤️ 5  💬 Reply               │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 👌 Mike R. • 2 min ago              │   │
│ │ Rattled my coffee mug. Not too bad. │   │
│ │                                     │   │
│ │ ⚡ Felt it moderately                │   │
│ │ 👍 8  💬 Reply                       │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 📍 Walnut Creek (31 reports) ────────      │
│                                             │
│ [Show 189 more comments]                   │
│                                             │
├─────────────────────────────────────────────┤
│ 🔮 WHAT TO EXPECT                           │
├─────────────────────────────────────────────┤
│                                             │
│ ⚡ Aftershocks (Likely in 24hrs)           │
│ 🏚️ Damage (Unlikely)                       │
│ 📊 More Activity (Watch for swarm)          │
│                                             │
│ [Learn More About Earthquakes]             │
│                                             │
├─────────────────────────────────────────────┤
│ SHARE THIS EARTHQUAKE                       │
├─────────────────────────────────────────────┤
│                                             │
│ [X] [Facebook] [Nextdoor] [Copy Link]     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Key Differences from Current Design

### Removed/Minimized
- ❌ Raw lat/long coordinates (who cares?)
- ❌ "Significance" score (meaningless number)
- ❌ Multiple stats cards (information overload)
- ❌ Technical jargon
- ❌ Comments buried at bottom

### Added/Emphasized
- ✅ AI-powered analysis (plain English)
- ✅ Visual comparisons (bars, charts)
- ✅ Community feed as primary content
- ✅ Intensity selector for reports
- ✅ Heat map of felt reports
- ✅ "What to expect" section
- ✅ Reaction system
- ✅ Location-based grouping
- ✅ Quick response templates

---

## Technical Considerations

### API Endpoints Needed
```typescript
// GET /api/earthquake/[id]/ai-analysis
interface AIAnalysisResponse {
  summary: string;
  comparisons: {
    vsAverage: number;
    vsThisYear: string;
    similar: EarthquakeReference[];
  };
  expectations: {
    aftershocks: 'likely' | 'possible' | 'unlikely';
    damage: 'expected' | 'possible' | 'unlikely';
    swarmActivity: boolean;
  };
  insights: Insight[];
}

// GET /api/earthquake/[id]/felt-reports
interface FeltReportsResponse {
  total: number;
  byLocation: {
    name: string;
    lat: number;
    lon: number;
    count: number;
    avgIntensity: number;
  }[];
  heatMapData: {
    lat: number;
    lon: number;
    intensity: number;
  }[];
}

// POST /api/comments/[id]/react
interface ReactionPayload {
  commentId: string;
  emoji: string; // '👍', '❤️', '😮', etc.
}
```

### Performance Targets
- Initial page load: < 2s (LCP)
- Comment submission: < 500ms
- Real-time comment updates: < 2s latency
- AI analysis generation: < 3s
- Map render: < 1s

---

## Conclusion

This redesign transforms the earthquake share page from a technical data dump into a **community-driven, mobile-first experience** that:

1. **Provides immediate value** - Users understand the impact in 3 seconds
2. **Better than USGS** - AI analysis explains what data means in context
3. **Builds community** - Social feed makes users feel connected
4. **Optimized for mobile** - 90%+ of traffic will be mobile users
5. **Shareable** - Engaging content drives organic shares

The focus shifts from "here are the numbers" to "here's what this means for you and your community."

