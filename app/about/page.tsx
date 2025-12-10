import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Activity, Database, MapPin, Zap, Shield, Clock } from 'lucide-react';
import { generateBreadcrumbSchema, generateOrganizationSchema } from '@/lib/seo';
import { REGIONS } from '@/lib/regions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'About Bay Tremor - Bay Area Earthquake Tracking | Bay Tremor',
  description: 'Learn about Bay Tremor, the real-time earthquake tracking platform for the San Francisco Bay Area. Powered by USGS data, we monitor seismic activity across all Bay Area regions.',
  keywords: [
    'about Bay Tremor',
    'Bay Area earthquake tracking',
    'USGS earthquake data',
    'San Francisco seismic monitoring',
    'earthquake tracker app',
    'California earthquake alerts',
    'real-time earthquake monitoring',
  ],
  openGraph: {
    title: 'About Bay Tremor - Bay Area Earthquake Tracking',
    description: 'Learn about Bay Tremor and how we track earthquakes across the San Francisco Bay Area.',
    type: 'website',
    url: `${baseUrl}/about`,
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  const organizationSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'About', url: `${baseUrl}/about` },
  ]);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, breadcrumbSchema]),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li className="text-white">About</li>
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
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">About Bay Tremor</h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Real-time earthquake tracking and seismic analysis for the San Francisco Bay Area, 
            powered by USGS data.
          </p>
        </header>
        
        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Bay Tremor provides Bay Area residents with comprehensive, real-time earthquake information 
            to help communities stay informed about seismic activity. We believe that access to 
            timely, accurate earthquake data helps people understand their local seismic environment 
            and make better preparedness decisions.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            Living in one of the most seismically active regions in the United States, Bay Area 
            residents experience hundreds of earthquakes each year. Bay Tremor makes this data 
            accessible, understandable, and actionable.
          </p>
        </section>
        
        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <Activity className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-neutral-400 text-sm">
                Live earthquake data updated continuously from the USGS seismic network, 
                typically within minutes of an earthquake occurring.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <MapPin className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Regional Focus</h3>
              <p className="text-neutral-400 text-sm">
                Specialized coverage of all 9 Bay Area counties plus San Benito across 12 distinct regions, 
                from San Francisco to Sonoma, with local context for each area.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <Zap className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Swarm Detection</h3>
              <p className="text-neutral-400 text-sm">
                Automatic detection and analysis of earthquake swarms, helping you 
                understand patterns in local seismic activity.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <Database className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
              <p className="text-neutral-400 text-sm">
                Access to years of historical earthquake data for trend analysis 
                and understanding long-term seismic patterns.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <Clock className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">24/7 Updates</h3>
              <p className="text-neutral-400 text-sm">
                Continuous data updates around the clock, ensuring you always have 
                access to the latest seismic information.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <Shield className="w-8 h-8 text-red-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Preparedness Info</h3>
              <p className="text-neutral-400 text-sm">
                Educational resources and links to official preparedness guidelines 
                to help you stay ready for the next earthquake.
              </p>
            </div>
          </div>
        </section>
        
        {/* Data Source */}
        <section className="mb-12 bg-neutral-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Our Data Source</h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Bay Tremor uses earthquake data from the{' '}
            <a 
              href="https://earthquake.usgs.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              United States Geological Survey (USGS)
            </a>
            , the official source for earthquake information in the United States.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The USGS operates the Northern California Seismic Network (NCSN), a dense network 
            of seismometers that monitors earthquake activity throughout the Bay Area. This 
            network can detect earthquakes as small as magnitude 1.0 in most areas.
          </p>
        </section>
        
        {/* Coverage Areas */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Coverage Areas</h2>
          <p className="text-neutral-300 mb-4">
            We monitor seismic activity across the entire San Francisco Bay Area, with specialized 
            coverage for these regions:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {REGIONS.map(region => (
              <Link
                key={region.id}
                href={`/region/${region.id}`}
                className="flex items-center gap-3 p-3 bg-neutral-900 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                <span 
                  className="font-mono text-xs font-bold px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: region.color + '20',
                    color: region.color,
                    border: `1px solid ${region.color}40`
                  }}
                >
                  {region.areaCode}
                </span>
                <span className="text-sm">{region.name.split(' / ')[0]}</span>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Disclaimer */}
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-semibold text-amber-400 mb-2">Important Notice</h2>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Bay Tremor is an informational service and should not be used as an emergency 
            alert system. For official earthquake alerts and emergency information, please 
            refer to the USGS, local emergency services, and official early warning systems 
            like ShakeAlert. Earthquake data is subject to revision as analysts review 
            recorded data.
          </p>
        </section>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Ready to explore earthquake activity in your area?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
            >
              View Live Dashboard
            </Link>
            <Link 
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Read FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

