import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { TV_STATIONS, NEWSPAPERS } from '@/lib/news-sources';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Bay Area Earthquake News | Local TV Coverage',
  description: 'Earthquake news from Bay Area TV stations: KTVU, KRON 4, ABC 7, CBS, NBC Bay Area. Real journalism, local coverage, community impact.',
  keywords: [
    'bay area earthquake news',
    'ktvu earthquake',
    'kron 4 earthquake',
    'abc7 earthquake',
    'nbc bay area earthquake',
    'cbs bay area earthquake',
    'san francisco earthquake news',
    'oakland earthquake news',
  ],
  openGraph: {
    title: 'Bay Area Earthquake News',
    description: 'Earthquake coverage from local Bay Area TV stations and newspapers.',
    type: 'website',
    url: `${baseUrl}/news`,
  },
  alternates: {
    canonical: `${baseUrl}/news`,
  },
};

export default function NewsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'News', url: `${baseUrl}/news` },
  ]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <nav className="text-sm text-neutral-500 mb-4">
            <Link href="/" className="hover:text-neutral-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900">News</span>
          </nav>
          
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Earthquake News
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Coverage from Bay Area TV stations and newspapers. 
            Click any source to read their latest earthquake reporting.
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        
        {/* TV Stations Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-2">Local TV Stations</h2>
          <p className="text-neutral-500 text-sm mb-8">
            Bay Area TV news with video coverage, expert interviews, and community impact stories.
          </p>
          
          <div className="space-y-1">
            {TV_STATIONS.map((station) => (
              <a
                key={station.id}
                href={station.earthquakePage}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between py-4 border-b border-neutral-100 hover:bg-neutral-50 -mx-4 px-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span 
                    className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: station.color }}
                  >
                    {station.channel}
                  </span>
                  <div>
                    <div className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {station.name}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Earthquake coverage →
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </a>
            ))}
          </div>
        </section>
        
        {/* What You'll Find */}
        <section className="mb-16 bg-neutral-50 -mx-4 px-4 py-8 md:rounded-lg md:mx-0 md:px-8">
          <h2 className="font-serif text-xl font-bold mb-4">What You&apos;ll Find</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium mb-2">Breaking Coverage</h3>
              <p className="text-neutral-600">
                Real-time reporting when earthquakes hit. Video footage, reporter updates, 
                and community reactions as events unfold.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Local Impact</h3>
              <p className="text-neutral-600">
                Stories about damage reports, BART delays, power outages, and how 
                your neighborhood was affected.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Expert Analysis</h3>
              <p className="text-neutral-600">
                Interviews with USGS seismologists, emergency officials, and 
                earthquake scientists explaining what happened and what to expect.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Preparedness Tips</h3>
              <p className="text-neutral-600">
                Guides on emergency kits, family plans, and what to do during 
                and after an earthquake.
              </p>
            </div>
          </div>
        </section>
        
        {/* Newspapers Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-2">Newspapers &amp; Public Media</h2>
          <p className="text-neutral-500 text-sm mb-8">
            In-depth reporting, investigative journalism, and long-form earthquake coverage.
          </p>
          
          <div className="space-y-1">
            {NEWSPAPERS.map((paper) => (
              <a
                key={paper.id}
                href={paper.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between py-4 border-b border-neutral-100 hover:bg-neutral-50 -mx-4 px-4 transition-colors"
              >
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">
                    {paper.name}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {paper.shortName === 'KQED' ? 'Public radio & news' : 'Regional newspaper'}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </a>
            ))}
          </div>
        </section>
        
        {/* Recent Headlines Preview */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-2">Recent Headlines</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Sample of recent earthquake coverage from Bay Area stations.
          </p>
          
          <div className="space-y-6">
            {/* These are real headlines from KTVU's earthquake page */}
            <article className="border-l-2 border-neutral-200 pl-4">
              <a 
                href="https://www.ktvu.com/tag/weather/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  Swarm of earthquakes strike San Ramon, jolting residents
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  At least 25 moderate and smaller earthquakes hit San Ramon on Monday morning.
                </p>
                <div className="text-xs text-neutral-400 mt-2">
                  KTVU · Feb 2, 2026
                </div>
              </a>
            </article>
            
            <article className="border-l-2 border-neutral-200 pl-4">
              <a 
                href="https://abc7news.com/tag/earthquake/"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  Swarm of over 30 quakes strike near San Ramon, strongest 4.2: USGS
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  A 4.2 earthquake struck near San Ramon Monday morning amid a string of over 30 temblors.
                </p>
                <div className="text-xs text-neutral-400 mt-2">
                  ABC7 · Feb 2, 2026
                </div>
              </a>
            </article>
            
            <article className="border-l-2 border-neutral-200 pl-4">
              <a 
                href="https://www.ktvu.com/tag/weather/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  3.4-magnitude earthquake strikes near Dublin
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  The U.S. Geological Survey reported a small earthquake striking just south of Dublin.
                </p>
                <div className="text-xs text-neutral-400 mt-2">
                  KTVU · Jan 30, 2026
                </div>
              </a>
            </article>
            
            <article className="border-l-2 border-neutral-200 pl-4">
              <a 
                href="https://www.ktvu.com/tag/weather/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  3.1M earthquake strikes near Alum Rock in Santa Clara County
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  A 3.1-magnitude earthquake was reported in northeastern Santa Clara County.
                </p>
                <div className="text-xs text-neutral-400 mt-2">
                  KTVU · Jan 15, 2026
                </div>
              </a>
            </article>
            
            <article className="border-l-2 border-neutral-200 pl-4">
              <a 
                href="https://www.ktvu.com/tag/weather/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  Cluster of earthquakes strike San Ramon on Saturday night
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Shaking was felt at the KTVU station in Oakland, and callers reported movement in San Francisco.
                </p>
                <div className="text-xs text-neutral-400 mt-2">
                  KTVU · Dec 20, 2025
                </div>
              </a>
            </article>
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="https://www.ktvu.com/tag/weather/earthquakes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              View all earthquake news on KTVU
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
        
        {/* Back to Bay Tremor */}
        <section className="border-t border-neutral-200 pt-8">
          <h2 className="font-serif text-xl font-bold mb-4">Bay Tremor Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/"
              className="block p-4 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <div className="font-medium">Live Map</div>
              <div className="text-sm text-neutral-400 mt-1">
                Real-time earthquake tracker
              </div>
            </Link>
            <Link 
              href="/felt-earthquake"
              className="block p-4 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <div className="font-medium">Did You Feel It?</div>
              <div className="text-sm text-neutral-500 mt-1">
                Report what you felt
              </div>
            </Link>
            <Link 
              href="/earthquake-preparedness"
              className="block p-4 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <div className="font-medium">Preparedness Guide</div>
              <div className="text-sm text-neutral-500 mt-1">
                Be ready for the next one
              </div>
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer note */}
      <footer className="border-t border-neutral-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-sm text-neutral-500">
            Bay Tremor aggregates earthquake news from local sources. 
            All articles link directly to their original publishers. 
            For real-time earthquake data, visit our{' '}
            <Link href="/" className="text-blue-600 hover:underline">live map</Link>.
          </p>
        </div>
      </footer>
    </div>
  );
}
