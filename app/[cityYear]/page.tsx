import { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Calendar, TrendingUp, AlertTriangle, ChevronRight, BarChart3 } from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor } from '@/lib/analysis';
import { BAY_AREA_LANDMARKS, REGIONS } from '@/lib/regions';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// Define supported city slugs
const CITY_SLUGS = [
  'san-francisco', 'oakland', 'san-jose', 'berkeley', 'fremont',
  'hayward', 'santa-rosa', 'sunnyvale', 'concord', 'vallejo',
  'richmond', 'san-mateo', 'daly-city', 'palo-alto', 'mountain-view',
  'livermore', 'pleasanton', 'san-ramon', 'walnut-creek', 'napa',
  'santa-clara', 'milpitas', 'dublin', 'redwood-city', 'san-leandro',
  'alameda', 'union-city', 'newark', 'cupertino', 'campbell',
];

// Years to generate pages for (only recent years to keep build memory within limits)
const YEARS = [2025, 2026];

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ cityYear: string }>;
}

// Parse slug like "san-francisco-earthquakes-2025"
function parseSlug(slug: string): { citySlug: string; year: number } | null {
  if (!slug || typeof slug !== 'string') return null;
  
  const match = slug.match(/^(.+)-earthquakes-(\d{4})$/);
  if (!match) return null;
  
  const citySlug = match[1];
  const year = parseInt(match[2], 10);
  
  if (!CITY_SLUGS.includes(citySlug) || !YEARS.includes(year)) {
    return null;
  }
  
  return { citySlug, year };
}

function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Haversine distance formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371;
}

export async function generateStaticParams() {
  const params: { cityYear: string }[] = [];
  
  for (const citySlug of CITY_SLUGS) {
    for (const year of YEARS) {
      params.push({
        cityYear: `${citySlug}-earthquakes-${year}`,
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const parsed = parseSlug(resolvedParams.cityYear);
  
  if (!parsed) {
    return { title: 'Not Found' };
  }
  
  const { citySlug, year } = parsed;
  const cityName = slugToCityName(citySlug);
  const cityData = BAY_AREA_LANDMARKS.find(
    l => l.type === 'city' && l.name.toLowerCase() === cityName.toLowerCase()
  );
  
  const title = `${cityName} Earthquakes ${year} | Complete Seismic History`;
  const description = `Complete list of all earthquakes near ${cityName}, California in ${year}. View magnitude, depth, and location data for every earthquake recorded within 30 miles of ${cityName}.`;
  const pageUrl = `${baseUrl}/${citySlug}-earthquakes-${year}`;
  
  return {
    title,
    description,
    keywords: [
      `${cityName.toLowerCase()} earthquakes ${year}`,
      `earthquakes near ${cityName.toLowerCase()} ${year}`,
      `${cityName.toLowerCase()} earthquake history ${year}`,
      `${cityData?.county?.toLowerCase() || 'bay area'} earthquakes ${year}`,
      `california earthquakes ${year}`,
      'bay area seismic activity',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Bay Tremor',
      images: [{
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${cityName} Earthquakes ${year}`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: pageUrl,
    },
    other: cityData ? {
      'geo.region': 'US-CA',
      'geo.placename': cityName,
      'geo.position': `${cityData.lat};${cityData.lon}`,
    } : {},
  };
}

export default async function CityYearPage({ params }: PageProps) {
  'use cache';
  cacheLife('days');

  const resolvedParams = await params;
  const parsed = parseSlug(resolvedParams.cityYear);
  
  if (!parsed) {
    notFound();
  }
  
  const { citySlug, year } = parsed;
  const cityName = slugToCityName(citySlug);
  const cityData = BAY_AREA_LANDMARKS.find(
    l => l.type === 'city' && l.name.toLowerCase() === cityName.toLowerCase()
  );
  
  if (!cityData) {
    notFound();
  }
  
  // Find region
  const region = REGIONS.find(r => {
    const { minLat, maxLat, minLon, maxLon } = r.bounds;
    return cityData.lat >= minLat && cityData.lat <= maxLat && 
           cityData.lon >= minLon && cityData.lon <= maxLon;
  });
  
  // Load earthquakes
  const allEarthquakes = await loadAllEarthquakes();
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  
  // Filter earthquakes for this year and within 30 miles of city
  const yearEarthquakes = allEarthquakes.filter(eq => {
    if (eq.timestamp < yearStart || eq.timestamp >= yearEnd) return false;
    const distance = haversineDistance(cityData.lat, cityData.lon, eq.latitude, eq.longitude);
    return distance <= 30;
  });
  
  // Calculate stats
  const totalCount = yearEarthquakes.length;
  const magnitudes = yearEarthquakes.map(eq => eq.magnitude);
  const maxMagnitude = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
  const avgMagnitude = magnitudes.length > 0 
    ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length 
    : 0;
  
  // Group by month
  const byMonth: Record<string, typeof yearEarthquakes> = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  for (const eq of yearEarthquakes) {
    const month = new Date(eq.timestamp).getMonth();
    const monthName = monthNames[month];
    if (!byMonth[monthName]) byMonth[monthName] = [];
    byMonth[monthName].push(eq);
  }
  
  // Count by magnitude range
  const magDistribution = {
    'M0-2': yearEarthquakes.filter(eq => eq.magnitude < 2).length,
    'M2-3': yearEarthquakes.filter(eq => eq.magnitude >= 2 && eq.magnitude < 3).length,
    'M3-4': yearEarthquakes.filter(eq => eq.magnitude >= 3 && eq.magnitude < 4).length,
    'M4+': yearEarthquakes.filter(eq => eq.magnitude >= 4).length,
  };
  
  // Get significant earthquakes (M3+)
  const significantQuakes = yearEarthquakes.filter(eq => eq.magnitude >= 3)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10);
  
  // Get available years for navigation
  const availableYears = YEARS.filter(y => {
    if (y > new Date().getFullYear()) return false;
    return true;
  });
  
  // Generate structured data
  const pageSlug = `${citySlug}-earthquakes-${year}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: cityName, url: `${baseUrl}/city/${citySlug}` },
    { name: `${year} Earthquakes`, url: `${baseUrl}/${pageSlug}` },
  ]);
  
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${cityName} Earthquake Data ${year}`,
    description: `Complete earthquake data for ${cityName}, California in ${year}. Includes ${totalCount} earthquakes within 30 miles.`,
    url: `${baseUrl}/${pageSlug}`,
    creator: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    temporalCoverage: `${year}`,
    spatialCoverage: {
      '@type': 'Place',
      name: `${cityName}, California`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: cityData.lat,
        longitude: cityData.lon,
      },
    },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Total Earthquakes', value: totalCount },
      { '@type': 'PropertyValue', name: 'Maximum Magnitude', value: maxMagnitude },
      { '@type': 'PropertyValue', name: 'Average Magnitude', value: avgMagnitude.toFixed(2) },
    ],
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, datasetSchema]),
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
            <li><Link prefetch={false} href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link prefetch={false} href={`/city/${citySlug}`} className="hover:text-white transition-colors">{cityName}</Link></li>
            <li>/</li>
            <li className="text-white">{year} Earthquakes</li>
          </ol>
        </nav>
        
        {/* Back Link */}
        <Link prefetch={false} 
          href={`/city/${citySlug}`}
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to {cityName}
        </Link>
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {year}
            </span>
            <span className="px-3 py-1 bg-white/10 text-neutral-300 rounded-full text-sm">
              {cityData.county} County
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {cityName} Earthquakes {year}
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {totalCount > 0 ? (
              <>
                <span className="text-white font-semibold">{totalCount.toLocaleString()} earthquakes</span> were recorded 
                within 30 miles of {cityName} in {year}
                {maxMagnitude >= 3 && (
                  <>, including <span className="text-amber-400 font-semibold">M{maxMagnitude.toFixed(1)}</span> as the largest</>
                )}.
              </>
            ) : (
              <>No earthquakes recorded within 30 miles of {cityName} in {year}.</>
            )}
          </p>
        </header>
        
        {/* Year Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {availableYears.map(y => (
            <Link
              prefetch={false}
              key={y}
              href={`/${citySlug}-earthquakes-${y}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                y === year 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
        
        {totalCount > 0 ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Total</span>
                </div>
                <div className="text-3xl font-bold">{totalCount.toLocaleString()}</div>
                <div className="text-xs text-neutral-500">earthquakes</div>
              </div>
              
              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Largest</span>
                </div>
                <div className={`text-3xl font-bold ${maxMagnitude >= 4 ? 'text-red-400' : maxMagnitude >= 3 ? 'text-amber-400' : ''}`}>
                  M{maxMagnitude.toFixed(1)}
                </div>
                <div className="text-xs text-neutral-500">magnitude</div>
              </div>
              
              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Average</span>
                </div>
                <div className="text-3xl font-bold">M{avgMagnitude.toFixed(1)}</div>
                <div className="text-xs text-neutral-500">magnitude</div>
              </div>
              
              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-2 text-neutral-500 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Monthly Avg</span>
                </div>
                <div className="text-3xl font-bold">{Math.round(totalCount / 12)}</div>
                <div className="text-xs text-neutral-500">per month</div>
              </div>
            </div>
            
            {/* Magnitude Distribution */}
            <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-bold mb-4">Magnitude Distribution</h2>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(magDistribution).map(([range, count]) => (
                  <div key={range} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-neutral-500">{range}</div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Significant Earthquakes */}
            {significantQuakes.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Notable Earthquakes (M3.0+)
                </h2>
                <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
                  <ul className="divide-y divide-white/5">
                    {significantQuakes.map(eq => (
                      <li key={eq.id}>
                        <Link prefetch={false} 
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
                            <div className="text-sm text-neutral-500">
                              {new Date(eq.timestamp).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-neutral-500" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
            
            {/* Monthly Breakdown */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Monthly Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {monthNames.map(month => {
                  const monthQuakes = byMonth[month] || [];
                  const monthMax = monthQuakes.length > 0 
                    ? Math.max(...monthQuakes.map(eq => eq.magnitude)) 
                    : 0;
                  return (
                    <div 
                      key={month}
                      className="bg-neutral-900 rounded-xl p-4 border border-white/10"
                    >
                      <div className="text-sm text-neutral-500 mb-1">{month}</div>
                      <div className="text-2xl font-bold">{monthQuakes.length}</div>
                      {monthMax >= 2 && (
                        <div className="text-xs text-neutral-500">
                          Max: M{monthMax.toFixed(1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            
            {/* All Earthquakes (limited to 100) */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                All Earthquakes ({Math.min(yearEarthquakes.length, 100)} shown)
              </h2>
              <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
                <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {yearEarthquakes.slice(0, 100).map(eq => {
                    const distance = haversineDistance(cityData.lat, cityData.lon, eq.latitude, eq.longitude);
                    return (
                      <li key={eq.id}>
                        <Link prefetch={false} 
                          href={`/earthquake/${eq.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ 
                              backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                              color: getMagnitudeColor(eq.magnitude)
                            }}
                          >
                            {eq.magnitude.toFixed(1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{eq.place}</div>
                            <div className="text-xs text-neutral-500">
                              {new Date(eq.timestamp).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                              })} • {distance.toFixed(1)} mi away • {eq.depth.toFixed(1)}km deep
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <div className="bg-neutral-900 rounded-xl p-12 border border-white/10 text-center mb-8">
            <Activity className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
            <h2 className="text-xl font-semibold mb-2">No Earthquake Data</h2>
            <p className="text-neutral-500">
              No earthquakes were recorded within 30 miles of {cityName} in {year}.
            </p>
          </div>
        )}
        
        {/* Related Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link prefetch={false} 
            href={`/${citySlug}-earthquake-today`}
            className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <Activity className="w-5 h-5 text-red-400 mb-2" />
            <span className="block font-semibold">{cityName} Today</span>
            <span className="text-sm text-neutral-500">Live earthquake activity</span>
          </Link>
          <Link prefetch={false} 
            href={`/city/${citySlug}`}
            className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
            <span className="block font-semibold">{cityName} Overview</span>
            <span className="text-sm text-neutral-500">All-time data & analysis</span>
          </Link>
          {region && (
            <Link prefetch={false} 
              href={`/region/${region.id}`}
              className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-amber-400 mb-2" />
              <span className="block font-semibold">{region.name.split(' / ')[0]} Region</span>
              <span className="text-sm text-neutral-500">Regional seismic data</span>
            </Link>
          )}
        </section>
        
        {/* SEO Content */}
        <section className="mt-12 prose prose-invert max-w-none">
          <h2>About {cityName} Earthquake History</h2>
          <p>
            {cityName} is located in {cityData.county} County, California, within the seismically 
            active San Francisco Bay Area. The region experiences regular seismic activity due to 
            its proximity to major fault lines{region?.faultLine && `, including the ${region.faultLine}`}.
          </p>
          <p>
            This page provides a complete record of all earthquakes detected within 30 miles of 
            {cityName} during {year}. The data is sourced from the USGS earthquake monitoring 
            network, which operates a comprehensive array of seismometers throughout California.
          </p>
          <p>
            For real-time earthquake information, visit the{' '}
            <Link prefetch={false} href={`/${citySlug}-earthquake-today`} className="text-blue-400 hover:text-blue-300">
              {cityName} Earthquake Today
            </Link>{' '}
            page, or explore our{' '}
            <Link prefetch={false} href="/earthquake-preparedness" className="text-blue-400 hover:text-blue-300">
              earthquake preparedness guide
            </Link>{' '}
            to learn how to stay safe.
          </p>
        </section>
      </div>
    </div>
  );
}
