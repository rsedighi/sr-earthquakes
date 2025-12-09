import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Activity, TrendingUp, Clock, AlertTriangle, Zap } from 'lucide-react';
import { REGIONS, BAY_AREA_LANDMARKS } from '@/lib/regions';
import { getRegionSEOData, generateRegionSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { loadAllEarthquakes } from '@/lib/server-data';
import { detectSwarms, getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface RegionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return REGIONS.map((region) => ({
    id: region.id,
  }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { id } = await params;
  const seoData = getRegionSEOData(id);
  
  if (!seoData) {
    return { title: 'Region Not Found' };
  }
  
  return {
    title: seoData.seoTitle,
    description: seoData.seoDescription,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.seoTitle,
      description: seoData.seoDescription,
      type: 'website',
      locale: 'en_US',
      siteName: 'Bay Tremor',
      url: `${baseUrl}/region/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.seoTitle,
      description: seoData.seoDescription,
    },
    alternates: {
      canonical: `${baseUrl}/region/${id}`,
    },
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { id } = await params;
  const region = REGIONS.find(r => r.id === id);
  
  if (!region) {
    notFound();
  }
  
  // Load region-specific earthquake data
  const allEarthquakes = loadAllEarthquakes();
  const regionEarthquakes = allEarthquakes.filter(eq => eq.region === id);
  const recentEarthquakes = regionEarthquakes.slice(0, 20);
  const swarms = detectSwarms(regionEarthquakes);
  
  // Calculate stats
  const totalCount = regionEarthquakes.length;
  const magnitudes = regionEarthquakes.map(eq => eq.magnitude);
  const avgMagnitude = magnitudes.length > 0 
    ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length 
    : 0;
  const maxMagnitude = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
  
  // Get cities in this region
  const citiesInRegion = BAY_AREA_LANDMARKS
    .filter(l => l.type === 'city')
    .filter(city => {
      const { minLat, maxLat, minLon, maxLon } = region.bounds;
      return city.lat >= minLat && city.lat <= maxLat && 
             city.lon >= minLon && city.lon <= maxLon;
    });
  
  // Generate structured data
  const regionSchema = generateRegionSchema(id);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Regions', url: `${baseUrl}/region` },
    { name: region.name, url: `${baseUrl}/region/${id}` },
  ]);
  
  // Recent activity (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentActivity = regionEarthquakes.filter(eq => eq.timestamp > thirtyDaysAgo);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([regionSchema, breadcrumbSchema]),
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
            <li className="text-white">{region.name}</li>
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
            <span 
              className="text-2xl font-mono font-bold px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: region.color + '20',
                color: region.color,
                border: `1px solid ${region.color}40`
              }}
            >
              {region.areaCode}
            </span>
            <span className="text-sm text-neutral-500">{region.county} County</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {region.name} Earthquakes
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Real-time earthquake monitoring for {region.name}. 
            Track seismic activity along the {region.faultLine} in {region.county} County.
          </p>
        </header>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Total Events</span>
            </div>
            <div className="text-3xl font-bold">{totalCount.toLocaleString()}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Avg Magnitude</span>
            </div>
            <div className="text-3xl font-bold">{avgMagnitude.toFixed(2)}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Max Magnitude</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{maxMagnitude.toFixed(1)}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Swarm Events</span>
            </div>
            <div className="text-3xl font-bold">{swarms.length}</div>
          </div>
        </div>
        
        {/* Recent Activity Alert */}
        {recentActivity.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-400 mb-2">
              Recent Activity
            </h2>
            <p className="text-neutral-300">
              {recentActivity.length} earthquake{recentActivity.length !== 1 ? 's' : ''} recorded 
              in the last 30 days. The most recent was M{recentActivity[0]?.magnitude.toFixed(1)} on{' '}
              {new Date(recentActivity[0]?.timestamp).toLocaleDateString()}.
            </p>
          </div>
        )}
        
        {/* About Section - Rich Content for SEO */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {region.name} Seismic Activity</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4">
              {region.description}. This region is monitored by the USGS seismic network and 
              experiences regular seismic activity due to the {region.faultLine}.
            </p>
            <p className="text-neutral-300 mb-4">
              The {region.faultLine} is one of the major fault systems in the San Francisco Bay Area. 
              Earthquakes in this region can range from minor tremors to significant events that 
              may be felt across multiple counties.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">Cities in This Region</h3>
            <div className="flex flex-wrap gap-2">
              {citiesInRegion.map(city => (
                <Link 
                  key={city.name}
                  href={`/city/${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Recent Earthquakes List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Earthquakes in {region.name}</h2>
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            {recentEarthquakes.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {recentEarthquakes.map(eq => (
                  <li key={eq.id}>
                    <Link 
                      href={`/earthquake/${eq.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    >
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center font-bold"
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
                          {new Date(eq.timestamp).toLocaleString()} • {eq.depth.toFixed(1)}km deep
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-neutral-400">
                        {getMagnitudeLabel(eq.magnitude)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                No recent earthquakes recorded in this region.
              </div>
            )}
          </div>
        </section>
        
        {/* Fault Line Information */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">The {region.faultLine}</h2>
          <p className="text-neutral-300">
            The {region.faultLine} is part of the San Andreas Fault System, which is the 
            primary boundary between the Pacific Plate and the North American Plate. Understanding 
            earthquake activity along this fault is crucial for earthquake preparedness in 
            {' '}{region.county} County and surrounding areas.
          </p>
        </section>
      </div>
    </div>
  );
}

export const revalidate = 3600; // Revalidate every hour

