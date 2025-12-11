import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { BAY_AREA_LANDMARKS, REGIONS, getNearestCity } from '@/lib/regions';
import { getCityData, generateBreadcrumbSchema } from '@/lib/seo';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all cities
export async function generateStaticParams() {
  const cities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  return cities.slice(0, 30).map((city) => ({
    slug: city.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityData = getCityData(slug);
  
  if (!cityData) {
    return { title: 'City Not Found' };
  }
  
  return {
    title: cityData.seoTitle,
    description: cityData.seoDescription,
    keywords: cityData.keywords,
    openGraph: {
      title: cityData.seoTitle,
      description: cityData.seoDescription,
      type: 'website',
      locale: 'en_US',
      siteName: 'Bay Tremor',
      url: `${baseUrl}/city/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: cityData.seoTitle,
      description: cityData.seoDescription,
    },
    alternates: {
      canonical: `${baseUrl}/city/${slug}`,
    },
  };
}

// Calculate distance between two points
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

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const cityData = getCityData(slug);
  
  if (!cityData) {
    notFound();
  }
  
  const { city, region } = cityData;
  
  // Load earthquakes near this city (within 25 miles)
  const allEarthquakes = loadAllEarthquakes();
  const nearbyEarthquakes = allEarthquakes.filter(eq => {
    const distance = haversineDistance(city.lat, city.lon, eq.latitude, eq.longitude);
    return distance <= 25;
  });
  
  const recentEarthquakes = nearbyEarthquakes.slice(0, 20);
  
  // Calculate stats
  const totalCount = nearbyEarthquakes.length;
  const magnitudes = nearbyEarthquakes.map(eq => eq.magnitude);
  const avgMagnitude = magnitudes.length > 0 
    ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length 
    : 0;
  const maxMagnitude = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
  
  // Recent activity (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentActivity = nearbyEarthquakes.filter(eq => eq.timestamp > thirtyDaysAgo);
  
  // Get nearby cities
  const nearbyCities = BAY_AREA_LANDMARKS
    .filter(l => l.type === 'city' && l.name !== city.name)
    .map(c => ({
      ...c,
      distance: haversineDistance(city.lat, city.lon, c.lat, c.lon),
    }))
    .filter(c => c.distance <= 20)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);
  
  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: city.county + ' County', url: `${baseUrl}/region/${region?.id || ''}` },
    { name: city.name, url: `${baseUrl}/city/${slug}` },
  ]);
  
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: city.name,
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: city.county + ' County, California',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.lat,
      longitude: city.lon,
    },
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([placeSchema, breadcrumbSchema]),
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
            {region && (
              <>
                <li>
                  <Link href={`/region/${region.id}`} className="hover:text-white transition-colors">
                    {region.name.split(' / ')[0]}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-white">{city.name}</li>
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
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <MapPin className="w-6 h-6 text-blue-400" />
            <span className="text-sm px-3 py-1 rounded-full bg-white/10 text-neutral-300">
              {city.county} County
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Earthquakes Near {city.name}, California
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Real-time earthquake monitoring for {city.name} and surrounding areas within 25 miles. 
            {region && ` Located in the ${region.name} region along the ${region.faultLine}.`}
          </p>
        </header>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Within 25mi</span>
            </div>
            <div className="text-3xl font-bold">{totalCount.toLocaleString()}</div>
            <div className="text-xs text-neutral-500">total earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">30-Day Activity</span>
            </div>
            <div className="text-3xl font-bold">{recentActivity.length}</div>
            <div className="text-xs text-neutral-500">recent earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <span className="text-xs uppercase tracking-wider">Avg Magnitude</span>
            </div>
            <div className="text-3xl font-bold">{avgMagnitude.toFixed(2)}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Max Recorded</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{maxMagnitude.toFixed(1)}</div>
          </div>
        </div>
        
        {/* Recent Activity Alert */}
        {recentActivity.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">
              Recent Activity Near {city.name}
            </h2>
            <p className="text-neutral-300">
              {recentActivity.length} earthquake{recentActivity.length !== 1 ? 's' : ''} recorded 
              within 25 miles of {city.name} in the last 30 days. The largest was M{Math.max(...recentActivity.map(e => e.magnitude)).toFixed(1)}.
            </p>
          </div>
        )}
        
        {/* About Section */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-4">Earthquake Risk in {city.name}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4">
              {city.name} is located in {city.county} County, California, one of the most 
              seismically active regions in the United States. The city sits within the 
              San Francisco Bay Area, which is traversed by several major fault systems.
            </p>
            {region && (
              <p className="text-neutral-300 mb-4">
                The nearest major fault to {city.name} is the {region.faultLine}. 
                This fault system is capable of producing earthquakes that could cause 
                significant ground shaking in the area. Residents are encouraged to 
                be prepared with emergency supplies and an earthquake plan.
              </p>
            )}
          </div>
        </section>
        
        {/* Recent Earthquakes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Earthquakes Near {city.name}</h2>
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            {recentEarthquakes.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {recentEarthquakes.map(eq => {
                  const distance = haversineDistance(city.lat, city.lon, eq.latitude, eq.longitude);
                  return (
                    <li key={eq.id}>
                      <Link 
                        href={`/earthquake/${eq.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                      >
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                          style={{ 
                            backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                            color: getMagnitudeColor(eq.magnitude)
                          }}
                        >
                          {eq.magnitude.toFixed(1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{eq.place}</div>
                          <div className="text-sm text-neutral-500">
                            {new Date(eq.timestamp).toLocaleString()} • {distance.toFixed(1)} mi away
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
                No recent earthquakes recorded near {city.name}.
              </div>
            )}
          </div>
        </section>
        
        {/* Nearby Cities */}
        {nearbyCities.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Nearby Cities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {nearbyCities.map(nearbyCity => (
                <Link
                  key={nearbyCity.name}
                  href={`/city/${nearbyCity.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-3 p-4 bg-neutral-900 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="font-medium">{nearbyCity.name}</div>
                    <div className="text-xs text-neutral-500">{nearbyCity.distance.toFixed(1)} mi away</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Region Link */}
        {region && (
          <div className="text-center">
            <p className="text-neutral-400 mb-4">
              View all earthquake activity in the {region.name} region.
            </p>
            <Link 
              href={`/region/${region.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              View {region.name.split(' / ')[0]} Region
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export const revalidate = 3600;


