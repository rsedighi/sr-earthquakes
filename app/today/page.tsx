import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Clock, MapPin, AlertTriangle, TrendingUp, Radio } from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getRegionById, BAY_AREA_LANDMARKS } from '@/lib/regions';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Bay Area Earthquakes Today | Live Seismic Activity - Bay Tremor',
  description: 'See all earthquakes in the San Francisco Bay Area TODAY. Real-time seismic activity tracker with live USGS data. Did you feel an earthquake? Check here for the latest quake information.',
  keywords: [
    'earthquake today',
    'bay area earthquake today',
    'san francisco earthquake today',
    'did i feel an earthquake',
    'earthquake just now',
    'earthquake near me california',
    'latest earthquake bay area',
    'recent earthquakes california',
    'earthquake today san jose',
    'oakland earthquake today',
    'berkeley earthquake today',
    'earthquake right now bay area',
    'usgs earthquake today',
    'california earthquake just happened',
  ],
  openGraph: {
    title: 'Bay Area Earthquakes Today | Live Updates',
    description: 'Real-time earthquake tracker for the San Francisco Bay Area. See what just happened.',
    type: 'website',
    url: `${baseUrl}/today`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Bay Area Earthquakes Today',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Area Earthquakes Today | Live Updates',
    description: 'Real-time earthquake tracker for the San Francisco Bay Area.',
  },
  alternates: {
    canonical: `${baseUrl}/today`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Time ago formatter
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Get day label
function getDayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default async function TodayPage() {
  const allEarthquakes = loadAllEarthquakes();
  const now = Date.now();
  
  // Filter earthquakes from the last 7 days
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentEarthquakes = allEarthquakes.filter(eq => eq.timestamp > sevenDaysAgo);
  
  // Categorize by time
  const last24Hours = recentEarthquakes.filter(eq => eq.timestamp > now - 24 * 60 * 60 * 1000);
  const lastHour = last24Hours.filter(eq => eq.timestamp > now - 60 * 60 * 1000);
  const todayQuakes = last24Hours.filter(eq => {
    const eqDate = new Date(eq.timestamp).toDateString();
    return eqDate === new Date().toDateString();
  });
  
  // Find the most recent earthquake
  const mostRecent = recentEarthquakes[0];
  const timeSinceLastQuake = mostRecent ? formatTimeAgo(mostRecent.timestamp) : 'Unknown';
  
  // Calculate stats
  const avgMagnitude = last24Hours.length > 0
    ? last24Hours.reduce((sum, eq) => sum + eq.magnitude, 0) / last24Hours.length
    : 0;
  const maxMagnitude = last24Hours.length > 0 
    ? Math.max(...last24Hours.map(eq => eq.magnitude))
    : 0;
  
  // Group earthquakes by day for display
  const earthquakesByDay = recentEarthquakes.reduce((acc, eq) => {
    const dayKey = getDayLabel(eq.timestamp);
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(eq);
    return acc;
  }, {} as Record<string, typeof recentEarthquakes>);
  
  // Get affected cities in last 24 hours
  const affectedCities = new Set<string>();
  for (const eq of last24Hours) {
    const region = getRegionById(eq.region);
    if (region) {
      // Find cities in this region
      const citiesInRegion = BAY_AREA_LANDMARKS.filter(l => {
        if (l.type !== 'city') return false;
        const { minLat, maxLat, minLon, maxLon } = region.bounds;
        return l.lat >= minLat && l.lat <= maxLat && l.lon >= minLon && l.lon <= maxLon;
      });
      citiesInRegion.forEach(c => affectedCities.add(c.name));
    }
  }
  
  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Earthquakes Today', url: `${baseUrl}/today` },
  ]);
  
  // Live update schema for Google
  const liveUpdateSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Bay Area Earthquakes Today',
    description: 'Real-time earthquake updates for the San Francisco Bay Area',
    url: `${baseUrl}/today`,
    dateModified: new Date().toISOString(),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    about: {
      '@type': 'Thing',
      name: 'Earthquakes',
      description: 'Seismic events in the San Francisco Bay Area',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Recent Earthquakes',
      numberOfItems: last24Hours.length,
      itemListElement: last24Hours.slice(0, 10).map((eq, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Event',
          name: `M${eq.magnitude.toFixed(1)} Earthquake - ${eq.place}`,
          startDate: new Date(eq.timestamp).toISOString(),
          location: {
            '@type': 'Place',
            name: eq.place,
            geo: {
              '@type': 'GeoCoordinates',
              latitude: eq.latitude,
              longitude: eq.longitude,
            },
          },
        },
      })),
    },
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, liveUpdateSchema]),
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li className="text-white">Earthquakes Today</li>
          </ol>
        </nav>
        
        {/* Back Navigation */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        
        {/* Header with Live Indicator */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-red-400 font-medium">LIVE</span>
            </div>
            <span className="text-sm text-neutral-500">
              Updated {new Date().toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bay Area Earthquakes Today
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Real-time seismic activity in the San Francisco Bay Area. 
            Last earthquake: <span className="text-white font-semibold">{timeSinceLastQuake}</span>
            {mostRecent && (
              <span className="text-neutral-500"> (M{mostRecent.magnitude.toFixed(1)} {mostRecent.place.split(',')[0]})</span>
            )}
          </p>
        </header>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Last Hour</span>
            </div>
            <div className="text-3xl font-bold">{lastHour.length}</div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Today</span>
            </div>
            <div className="text-3xl font-bold">{todayQuakes.length}</div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">24h Average</span>
            </div>
            <div className="text-3xl font-bold">M{avgMagnitude.toFixed(1)}</div>
            <div className="text-xs text-neutral-500">magnitude</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">24h Max</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">M{maxMagnitude.toFixed(1)}</div>
            <div className="text-xs text-neutral-500">magnitude</div>
          </div>
        </div>
        
        {/* Did You Feel It Banner */}
        {lastHour.length > 0 && lastHour[0].magnitude >= 2.5 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Did You Feel It?
            </h2>
            <p className="text-neutral-300">
              A M{lastHour[0].magnitude.toFixed(1)} earthquake occurred {formatTimeAgo(lastHour[0].timestamp)} near {lastHour[0].place}.
              {' '}
              <Link href={`/earthquake/${lastHour[0].id}`} className="text-amber-400 hover:text-amber-300 underline">
                View details and report if you felt it →
              </Link>
            </p>
          </div>
        )}
        
        {/* Affected Cities */}
        {affectedCities.size > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Affected Areas (Last 24 Hours)
            </h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(affectedCities).slice(0, 15).map(city => (
                <Link
                  key={city}
                  href={`/city/${city.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-colors"
                >
                  {city}
                </Link>
              ))}
              {affectedCities.size > 15 && (
                <span className="px-3 py-1.5 text-neutral-500 text-sm">
                  +{affectedCities.size - 15} more
                </span>
              )}
            </div>
          </section>
        )}
        
        {/* Earthquake List by Day */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Earthquake Activity</h2>
          
          {Object.entries(earthquakesByDay).map(([dayLabel, earthquakes]) => (
            <div key={dayLabel} className="mb-8">
              <h3 className="text-lg font-semibold text-neutral-400 mb-4 sticky top-0 bg-[#0a0a0a] py-2 z-10">
                {dayLabel}
                <span className="text-sm font-normal ml-2">({earthquakes.length} earthquakes)</span>
              </h3>
              
              <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
                <ul className="divide-y divide-white/5">
                  {earthquakes.slice(0, 50).map(eq => {
                    const region = getRegionById(eq.region);
                    return (
                      <li key={eq.id}>
                        <Link 
                          href={`/earthquake/${eq.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                        >
                          <div 
                            className="w-14 h-14 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                            style={{ 
                              backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                              color: getMagnitudeColor(eq.magnitude)
                            }}
                          >
                            <span className="text-lg">{eq.magnitude.toFixed(1)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{eq.place}</div>
                            <div className="text-sm text-neutral-500 flex flex-wrap gap-x-3">
                              <span>{formatTimeAgo(eq.timestamp)}</span>
                              <span>{eq.depth.toFixed(1)}km deep</span>
                              {region && <span>{region.name.split(' / ')[0]}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs px-2 py-1 rounded bg-white/5 text-neutral-400">
                              {getMagnitudeLabel(eq.magnitude)}
                            </span>
                            <span className="text-xs text-neutral-600">
                              {new Date(eq.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
          
          {recentEarthquakes.length === 0 && (
            <div className="bg-neutral-900 rounded-xl p-8 text-center text-neutral-500 border border-white/10">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No earthquakes recorded in the Bay Area in the last 7 days.</p>
              <p className="text-sm mt-2">This is unusual - check back later for updates.</p>
            </div>
          )}
        </section>
        
        {/* SEO Content Section */}
        <section className="mt-12 bg-neutral-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">About Bay Area Earthquake Activity</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4">
              The San Francisco Bay Area is one of the most seismically active regions in the United States. 
              Located along the boundary between the Pacific and North American tectonic plates, the region 
              experiences hundreds of earthquakes each week, though most are too small to feel.
            </p>
            <p className="text-neutral-300 mb-4">
              This page shows all earthquakes detected in the Bay Area over the past 7 days, with real-time 
              updates from the USGS seismic monitoring network. Major fault lines in the region include the 
              San Andreas Fault, Hayward Fault, Calaveras Fault, and Rodgers Creek Fault.
            </p>
            <p className="text-neutral-300">
              If you felt an earthquake, you can report it through the USGS "Did You Feel It?" program. 
              Your reports help scientists better understand how earthquakes affect different areas and 
              improve future earthquake response.
            </p>
          </div>
        </section>
        
        {/* Quick Links */}
        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/learn"
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <span className="block text-sm text-neutral-400">Learn About</span>
            <span className="font-semibold">Earthquakes</span>
          </Link>
          <Link 
            href="/faq"
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <span className="block text-sm text-neutral-400">Frequently Asked</span>
            <span className="font-semibold">Questions</span>
          </Link>
          <Link 
            href="/my-area"
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <span className="block text-sm text-neutral-400">Earthquakes In</span>
            <span className="font-semibold">My Area</span>
          </Link>
          <Link 
            href="/history"
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <span className="block text-sm text-neutral-400">Historical</span>
            <span className="font-semibold">Data</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

// Revalidate every 5 minutes for fresh content
export const revalidate = 300;


