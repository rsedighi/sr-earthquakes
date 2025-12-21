import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Clock, MapPin, AlertTriangle, Radio, TrendingUp } from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { BAY_AREA_LANDMARKS, REGIONS } from '@/lib/regions';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// Define supported city slugs for "city earthquake today" pages
const CITY_SLUGS = [
  'san-francisco',
  'oakland',
  'san-jose',
  'berkeley',
  'fremont',
  'hayward',
  'santa-rosa',
  'sunnyvale',
  'concord',
  'vallejo',
  'richmond',
  'san-mateo',
  'daly-city',
  'palo-alto',
  'mountain-view',
  'livermore',
  'pleasanton',
  'san-ramon',
  'walnut-creek',
  'napa',
  'santa-clara',
  'milpitas',
  'dublin',
  'redwood-city',
  'san-leandro',
  'alameda',
  'union-city',
  'newark',
  'cupertino',
  'campbell',
];

interface CityTodayPageProps {
  params: Promise<{ city: string }>;
}

// Extract city name from slug like "san-francisco-earthquake-today" -> "san-francisco"
function extractCitySlug(fullSlug: string | undefined): string | null {
  if (!fullSlug) return null;
  const match = fullSlug.match(/^(.+)-earthquake-today$/);
  return match ? match[1] : null;
}

// Convert slug to city name
function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calculate distance between two points (Haversine formula)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371; // Convert to miles
}

// Time ago formatter
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export async function generateStaticParams() {
  return CITY_SLUGS.map((citySlug) => ({
    city: `${citySlug}-earthquake-today`,
  }));
}

export async function generateMetadata({ params }: CityTodayPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const fullSlug = resolvedParams?.city;
  const citySlug = extractCitySlug(fullSlug);
  
  if (!citySlug || !CITY_SLUGS.includes(citySlug)) {
    return { title: 'City Not Found' };
  }
  
  const cityName = slugToCityName(citySlug);
  const cityData = BAY_AREA_LANDMARKS.find(
    l => l.type === 'city' && l.name.toLowerCase() === cityName.toLowerCase()
  );
  
  const title = `${cityName} Earthquake Today | Live Updates - Bay Tremor`;
  const description = `Did you feel an earthquake in ${cityName}? See all earthquakes near ${cityName}, ${cityData?.county || 'California'} today. Real-time USGS seismic data and live updates.`;
  
  return {
    title,
    description,
    keywords: [
      `${cityName.toLowerCase()} earthquake today`,
      `earthquake ${cityName.toLowerCase()}`,
      `${cityName.toLowerCase()} earthquake just now`,
      `did i feel an earthquake ${cityName.toLowerCase()}`,
      `earthquake near ${cityName.toLowerCase()}`,
      `${cityName.toLowerCase()} california earthquake`,
      `${cityData?.county?.toLowerCase() || 'bay area'} earthquake today`,
      'bay area earthquake',
      'earthquake today',
      'did you feel it',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/${citySlug}-earthquake-today`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${citySlug}-earthquake-today`,
    },
  };
}

export default async function CityEarthquakeTodayPage({ params }: CityTodayPageProps) {
  const resolvedParams = await params;
  const fullSlug = resolvedParams?.city;
  const citySlug = extractCitySlug(fullSlug);
  
  if (!citySlug || !CITY_SLUGS.includes(citySlug)) {
    notFound();
  }
  
  const cityName = slugToCityName(citySlug);
  const cityData = BAY_AREA_LANDMARKS.find(
    l => l.type === 'city' && l.name.toLowerCase() === cityName.toLowerCase()
  );
  
  if (!cityData) {
    notFound();
  }
  
  // Find the region for this city
  const region = REGIONS.find(r => {
    const { minLat, maxLat, minLon, maxLon } = r.bounds;
    return cityData.lat >= minLat && cityData.lat <= maxLat && 
           cityData.lon >= minLon && cityData.lon <= maxLon;
  });
  
  const allEarthquakes = loadAllEarthquakes();
  const now = Date.now();
  
  // Filter earthquakes within 30 miles of the city
  const nearbyEarthquakes = allEarthquakes.filter(eq => {
    const distance = haversineDistance(cityData.lat, cityData.lon, eq.latitude, eq.longitude);
    return distance <= 30;
  });
  
  // Recent earthquakes
  const last24Hours = nearbyEarthquakes.filter(eq => eq.timestamp > now - 24 * 60 * 60 * 1000);
  const last7Days = nearbyEarthquakes.filter(eq => eq.timestamp > now - 7 * 24 * 60 * 60 * 1000);
  const lastHour = nearbyEarthquakes.filter(eq => eq.timestamp > now - 60 * 60 * 1000);
  
  // Most recent earthquake
  const mostRecent = nearbyEarthquakes[0];
  
  // Stats
  const maxMagnitude24h = last24Hours.length > 0 
    ? Math.max(...last24Hours.map(eq => eq.magnitude)) 
    : 0;
  
  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Earthquakes Today', url: `${baseUrl}/today` },
    { name: cityName, url: `${baseUrl}/${citySlug}-earthquake-today` },
  ]);
  
  const cityEarthquakeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${cityName} Earthquake Today`,
    description: `Real-time earthquake updates for ${cityName}, California`,
    url: `${baseUrl}/${citySlug}-earthquake-today`,
    dateModified: new Date().toISOString(),
    about: {
      '@type': 'City',
      name: cityName,
      containedInPlace: {
        '@type': 'State',
        name: 'California',
      },
    },
    mainEntity: mostRecent ? {
      '@type': 'Event',
      name: `M${mostRecent.magnitude.toFixed(1)} Earthquake near ${cityName}`,
      startDate: new Date(mostRecent.timestamp).toISOString(),
      location: {
        '@type': 'Place',
        name: mostRecent.place,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: mostRecent.latitude,
          longitude: mostRecent.longitude,
        },
      },
    } : undefined,
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, cityEarthquakeSchema]),
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/today" className="hover:text-white transition-colors">Earthquakes Today</Link>
            </li>
            <li>/</li>
            <li className="text-white">{cityName}</li>
          </ol>
        </nav>
        
        {/* Back Navigation */}
        <Link 
          href="/today"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          All Bay Area Earthquakes
        </Link>
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-red-400 font-medium">LIVE</span>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-white/10 text-neutral-300">
              {cityData.county} County
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {cityName} Earthquake Today
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {mostRecent ? (
              <>
                Last earthquake near {cityName}: <span className="text-white font-semibold">
                  {formatTimeAgo(mostRecent.timestamp)}
                </span>
                <span className="text-neutral-500"> (M{mostRecent.magnitude.toFixed(1)})</span>
              </>
            ) : (
              <>No recent earthquakes detected within 30 miles of {cityName}</>
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
            <div className="text-xs text-neutral-500">within 30 miles</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Today</span>
            </div>
            <div className="text-3xl font-bold">{last24Hours.length}</div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">7-Day Total</span>
            </div>
            <div className="text-3xl font-bold">{last7Days.length}</div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">24h Max</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {maxMagnitude24h > 0 ? `M${maxMagnitude24h.toFixed(1)}` : '-'}
            </div>
            <div className="text-xs text-neutral-500">magnitude</div>
          </div>
        </div>
        
        {/* Alert for very recent earthquake */}
        {lastHour.length > 0 && lastHour[0].magnitude >= 2.0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Earthquake Near {cityName}
            </h2>
            <p className="text-neutral-300">
              A M{lastHour[0].magnitude.toFixed(1)} earthquake was detected {formatTimeAgo(lastHour[0].timestamp)}.
              {' '}
              <Link href={`/earthquake/${lastHour[0].id}`} className="text-amber-400 hover:text-amber-300 underline">
                View details →
              </Link>
            </p>
          </div>
        )}
        
        {/* Earthquake List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Earthquakes Near {cityName} (Within 30 Miles)
          </h2>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            {last7Days.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {last7Days.slice(0, 50).map(eq => {
                  const distance = haversineDistance(cityData.lat, cityData.lon, eq.latitude, eq.longitude);
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
                            <span>{distance.toFixed(1)} miles away</span>
                            <span>{eq.depth.toFixed(1)}km deep</span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-neutral-400 hidden sm:block">
                          {getMagnitudeLabel(eq.magnitude)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No earthquakes recorded near {cityName} in the last 7 days.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* About Section for SEO */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-4">Earthquake Risk in {cityName}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4">
              {cityName} is located in {cityData.county} County, California, in the seismically active 
              San Francisco Bay Area. The region sits near several major fault lines, making earthquake 
              awareness and preparedness essential for all residents.
            </p>
            {region && (
              <p className="text-neutral-300 mb-4">
                The nearest major fault to {cityName} is the {region.faultLine}. This fault system 
                is capable of producing earthquakes that could be felt throughout the Bay Area. 
                Scientists estimate a 72% probability of a magnitude 6.7 or greater earthquake 
                striking the Bay Area within the next 30 years.
              </p>
            )}
            <p className="text-neutral-300">
              If you felt an earthquake in {cityName}, you can help scientists by reporting it. 
              Your reports help improve earthquake response and hazard assessment for the region.
            </p>
          </div>
        </section>
        
        {/* Related Links */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href={`/city/${citySlug}`}
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            <MapPin className="w-5 h-5 text-blue-400 mb-2" />
            <span className="block font-semibold">{cityName} Overview</span>
            <span className="text-sm text-neutral-500">Historical data & analysis</span>
          </Link>
          {region && (
            <Link 
              href={`/region/${region.id}`}
              className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Activity className="w-5 h-5 text-amber-400 mb-2" />
              <span className="block font-semibold">{region.name.split(' / ')[0]} Region</span>
              <span className="text-sm text-neutral-500">All regional activity</span>
            </Link>
          )}
          <Link 
            href="/today"
            className="p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Radio className="w-5 h-5 text-red-400 mb-2" />
            <span className="block font-semibold">All Bay Area</span>
            <span className="text-sm text-neutral-500">Today's earthquakes</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

// Revalidate every 5 minutes
export const revalidate = 300;

