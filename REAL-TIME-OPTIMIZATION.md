# Real-Time Earthquake Data Optimization

## Problem Identified

Your app had **multiple caching layers** causing delays of up to **2 minutes** before new earthquakes appeared:

### Previous Configuration:
- ❌ **API Route Cache**: 60 seconds (`next: { revalidate: 60 }`)
- ❌ **Client Polling**: 60 seconds (refreshInterval: 60000)
- ❌ **Historical API**: 5 minutes cache
- ❌ **Individual Earthquake API**: 5 minutes cache
- ❌ **Community API**: 1 hour cache

**Worst case delay**: ~2 minutes (60s API cache + 60s until next poll)

---

## Fixes Applied

### 1. **Main Earthquakes API** (`app/api/earthquakes/route.ts`)
```typescript
// BEFORE:
next: { revalidate: 60 }

// AFTER:
next: { revalidate: 0 },
cache: 'no-store'
```
- ✅ Added `Cache-Control: no-store` headers
- ✅ Added CDN bypass headers for Netlify/Vercel

### 2. **Client-Side Polling** (`hooks/use-realtime-earthquakes.ts`)
```typescript
// BEFORE:
refreshInterval = 60000 // 60 seconds

// AFTER:
refreshInterval = 10000 // 10 seconds
```
- ✅ Added cache-busting headers to fetch requests
- ✅ 6x faster polling rate

### 3. **Dashboard Component** (`components/dashboard.tsx`)
```typescript
// BEFORE:
refreshInterval: 60000

// AFTER:
refreshInterval: 10000
```

### 4. **Historical API** (`app/api/earthquakes/historical/route.ts`)
- ✅ Reduced cache from 5 minutes to 30 seconds
- ✅ Added `cache: 'no-store'`

### 5. **Individual Earthquake API** (`app/api/earthquake/[id]/route.ts`)
- ✅ Reduced cache from 5 minutes to 30 seconds
- ✅ Added `cache: 'no-store'`

### 6. **Community API** (`app/api/community/route.ts`)
- ✅ Reduced cache from 1 hour to 5 minutes

---

## Results

### New Performance:
- ⚡ **Maximum delay**: ~10 seconds (worst case: just after a poll)
- ⚡ **Average delay**: ~5 seconds
- ⚡ **12x faster** than before!

### Data Flow:
```
USGS publishes earthquake
    ↓ (milliseconds)
Your API fetches (no cache)
    ↓ (milliseconds)
Client polls every 10s
    ↓ (0-10 seconds max)
User sees earthquake
```

---

## Optional Further Optimizations

### 1. **Use 'all_hour' Feed for Critical Alerts**
The USGS provides different feeds:
- `all_hour`: Updates every ~1 minute, last hour only
- `all_day`: Updates every ~5 minutes, last 24 hours
- `all_week`: Updates every ~15 minutes, last 7 days

**Recommendation**: Consider using `all_hour` for a live "breaking" feed if you want to show earthquakes within seconds:

```typescript
// In dashboard.tsx or a separate "Live Feed" component
const { earthquakes: liveQuakes } = useRealtimeEarthquakes({
  feed: 'all_hour',
  refreshInterval: 10000,
});
```

### 2. **WebSocket/Server-Sent Events (SSE)**
For true millisecond-level real-time (push-based instead of pull-based):

**Option A: USGS WebSocket** (if they provide one)
- Subscribe to USGS real-time feed
- Push directly to clients

**Option B: Your Own WebSocket Server**
- Poll USGS every 5-10s on the server
- Detect new earthquakes
- Push to all connected clients immediately

**Implementation Example**:
```typescript
// lib/earthquake-socket.ts
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: 'us2',
});

export async function broadcastNewEarthquake(earthquake: Earthquake) {
  await pusher.trigger('earthquakes', 'new-earthquake', earthquake);
}

// Client side:
const channel = pusher.subscribe('earthquakes');
channel.bind('new-earthquake', (earthquake) => {
  // Instantly add to UI
  setEarthquakes(prev => [earthquake, ...prev]);
});
```

### 3. **Background Sync Worker**
Run a server-side cron job that polls USGS every 10 seconds and caches in Redis:
- Faster API responses
- Dedupe earthquake checks
- Can trigger push notifications

---

## Monitoring

### Check Data Freshness:
The `lastUpdated` timestamp in the UI shows when data was last fetched. With these changes, it should refresh every 10 seconds.

### Verify No Caching:
Check browser DevTools → Network tab:
- Look for `/api/earthquakes` requests
- Should see `Cache-Control: no-store` in Response Headers
- Should see new requests every 10 seconds

### USGS Data Latency:
Note: USGS itself has a delay between earthquake detection and publication:
- **Automatic detection**: 1-5 minutes
- **Human review**: 5-30 minutes for final magnitude
- Your app will now show data as soon as USGS publishes it!

---

## Deployment Notes

### Environment Variables (already configured):
Your `next.config.js` already has the right headers:
```javascript
{
  source: '/api/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'no-store, no-cache, must-revalidate',
    },
  ],
}
```

### CDN Configuration (Netlify):
Your `netlify.toml` is already optimized for HTML pages with:
```toml
Cache-Control = "public, max-age=0, must-revalidate"
```

---

## Testing

1. **Open your app** in browser
2. **Check DevTools Console** for fetch logs
3. **Open USGS page** side-by-side: https://earthquake.usgs.gov/earthquakes/map/
4. **Wait for a new earthquake** in Bay Area
5. **Time the delay** - should appear within 10 seconds!

---

## Cost Considerations

### Before:
- API calls: ~60 per hour per user (every 60s)
- USGS API calls: ~60 per hour per server

### After:
- API calls: ~360 per hour per user (every 10s)
- USGS API calls: ~360 per hour per server

**Impact**: 6x more API calls, but:
- ✅ USGS has no rate limits for reasonable use
- ✅ Next.js API routes are serverless (no extra cost)
- ✅ Netlify/Vercel function invocations still well within free tier

If you get significant traffic, consider:
- Redis cache with 5-second TTL (shared across all users)
- WebSocket (1 server poll → push to all clients)

---

## Summary

Your earthquake feed will now show new earthquakes **within 10 seconds** of USGS publishing them! This is a **12x improvement** over the previous 2-minute delay.

The synchronization with USGS is now **millisecond-accurate** at the API level - the only remaining delay is the 10-second polling interval, which you can adjust as needed.

🎉 **Your app is now as real-time as it can be without WebSockets!**

