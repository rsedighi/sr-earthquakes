import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  ChevronDown,
  Ruler,
  History,
  Building2,
  Radio,
  Zap,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Calaveras Fault - San Ramon Earthquake Swarms | Map & Guide',
  description: 'Complete guide to the Calaveras Fault in the Bay Area. Known for earthquake swarms in San Ramon, Dublin, and Pleasanton. Live seismic activity, fault map, and affected cities.',
  keywords: [
    'calaveras fault',
    'calaveras fault map',
    'calaveras fault earthquake',
    'san ramon earthquake',
    'san ramon earthquake swarm',
    'dublin earthquake',
    'pleasanton earthquake',
    'tri-valley earthquake',
    'calaveras fault line',
    'east bay earthquake',
    'danville earthquake',
    'livermore earthquake',
    'calaveras fault california',
    'earthquake swarm bay area',
  ],
  openGraph: {
    title: 'Calaveras Fault | San Ramon Earthquake Swarms & Live Activity',
    description: 'The Calaveras Fault runs through the Tri-Valley, causing frequent earthquake swarms. Live monitoring and complete guide.',
    type: 'article',
    url: `${baseUrl}/calaveras-fault`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Calaveras Fault Map and Guide',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calaveras Fault - San Ramon Earthquake Swarms',
    description: 'Complete guide to the Calaveras Fault and its frequent earthquake swarms in the Tri-Valley.',
  },
  alternates: {
    canonical: `${baseUrl}/calaveras-fault`,
  },
};

// Notable earthquake swarms on Calaveras Fault
const notableSwarms = [
  {
    year: '2015',
    location: 'San Ramon',
    count: '400+',
    maxMagnitude: 3.6,
    duration: '2 weeks',
    description: 'Major swarm that rattled residents with hundreds of small earthquakes over two weeks. Largest was M3.6.',
  },
  {
    year: '2018',
    location: 'Danville/San Ramon',
    count: '175+',
    maxMagnitude: 3.4,
    duration: '1 week',
    description: 'Swarm centered under the Tassajara area. Many earthquakes felt by residents.',
  },
  {
    year: '2019',
    location: 'Pleasant Hill',
    count: '50+',
    maxMagnitude: 4.5,
    duration: '3 days',
    description: 'Notable swarm with a M4.5 mainshock felt across the entire Bay Area.',
  },
  {
    year: '2021',
    location: 'San Ramon',
    count: '200+',
    maxMagnitude: 3.2,
    duration: '10 days',
    description: 'Sustained swarm activity in the typical San Ramon cluster area.',
  },
  {
    year: '2023',
    location: 'Dublin/San Ramon',
    count: '100+',
    maxMagnitude: 3.1,
    duration: '5 days',
    description: 'Moderate swarm with dozens of felt earthquakes over several days.',
  },
];

// Cities along the Calaveras Fault
const citiesAtRisk = [
  { name: 'San Ramon', population: '84K', risk: 'Very High', faultDistance: 'On fault', note: 'Epicenter of most swarm activity' },
  { name: 'Danville', population: '44K', risk: 'Very High', faultDistance: 'On fault', note: 'Fault runs through town center' },
  { name: 'Dublin', population: '72K', risk: 'Very High', faultDistance: '1 mi', note: 'Adjacent to active fault segment' },
  { name: 'Pleasanton', population: '79K', risk: 'High', faultDistance: '2 mi', note: 'Feels most swarm earthquakes' },
  { name: 'Livermore', population: '90K', risk: 'High', faultDistance: '5 mi', note: 'Near Greenville Fault connection' },
  { name: 'Alamo', population: '15K', risk: 'High', faultDistance: '2 mi', note: 'Between Calaveras and Hayward faults' },
  { name: 'Walnut Creek', population: '70K', risk: 'Moderate', faultDistance: '4 mi', note: 'Feels larger swarm events' },
  { name: 'Morgan Hill', population: '46K', risk: 'Very High', faultDistance: 'On fault', note: 'Southern segment of fault' },
  { name: 'Hollister', population: '42K', risk: 'Very High', faultDistance: 'On fault', note: 'Active creeping section' },
];

// FAQ data
const faqs = [
  {
    question: 'What causes earthquake swarms on the Calaveras Fault?',
    answer: 'Earthquake swarms on the Calaveras Fault are caused by the gradual release of stress along the fault. Unlike typical earthquake sequences with a clear mainshock and aftershocks, swarms involve many similar-sized earthquakes occurring in clusters. Scientists believe this may be related to fluids moving through the fault zone, which can temporarily reduce friction and allow small earthquakes to occur in rapid succession.',
  },
  {
    question: 'Are San Ramon earthquake swarms dangerous?',
    answer: 'The frequent small earthquakes in San Ramon swarms are generally not dangerous. Most are below magnitude 3.0 and cause no damage. However, swarms are a reminder that the Calaveras Fault is active and capable of producing larger earthquakes. The fault has produced earthquakes up to magnitude 6.2 historically (1911 Morgan Hill area). While swarms themselves are not precursors to larger earthquakes, the fault remains a significant seismic hazard.',
  },
  {
    question: 'How often do earthquake swarms occur in San Ramon?',
    answer: 'The San Ramon/Danville area experiences noticeable earthquake swarms roughly every 1-3 years. Smaller clusters of activity occur more frequently but may not be widely felt. The area is one of the most seismically active in the Bay Area, with dozens to hundreds of small earthquakes recorded each year along this segment of the Calaveras Fault.',
  },
  {
    question: 'What is the largest earthquake the Calaveras Fault can produce?',
    answer: 'The Calaveras Fault is capable of producing earthquakes up to approximately magnitude 6.8-7.0. The largest recorded earthquake on the fault was the 1911 Morgan Hill earthquake at magnitude 6.2. Scientists estimate that a full rupture of the northern segment (through San Ramon) could produce a magnitude 6.8 earthquake, while a rupture of the entire fault could reach magnitude 7.0.',
  },
  {
    question: 'Is the Calaveras Fault connected to the Hayward Fault?',
    answer: 'Yes, the Calaveras Fault is part of the larger San Andreas Fault system and connects to the Hayward Fault near Fremont. The two faults branch from each other in the southern East Bay hills. This connection means that a major earthquake on one fault could potentially trigger increased activity on the other, though they typically behave independently.',
  },
  {
    question: 'Why does the Calaveras Fault creep?',
    answer: 'Parts of the Calaveras Fault exhibit "creep" - slow, continuous movement without large earthquakes. This is particularly notable in the Hollister area where the fault creeps at about 15mm per year. Creep occurs when the fault zone contains clay minerals that allow smooth sliding. However, the northern segment through San Ramon does not creep continuously, which is why it produces swarms and could generate larger earthquakes.',
  },
];

// Generate Article Schema
function generateArticleSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Calaveras Fault: San Ramon Earthquake Swarms & Complete Guide',
    description: 'Comprehensive guide to the Calaveras Fault, known for frequent earthquake swarms in San Ramon, Dublin, and the Tri-Valley area.',
    image: `${baseUrl}/og-image.png`,
    datePublished: '2024-01-01T00:00:00Z',
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/android-chrome-512x512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/calaveras-fault`,
    },
  };
}

// Generate FAQ Schema
function generateCalaverasFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Format time ago
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

export default async function CalaverasFaultPage() {
  const allEarthquakes = loadAllEarthquakes();
  
  // Filter earthquakes near Calaveras Fault (San Ramon through Morgan Hill)
  const calaverasQuakes = allEarthquakes.filter(eq => {
    const isNearFault = (
      // San Ramon / Dublin / Pleasanton area
      (eq.latitude >= 37.55 && eq.latitude <= 37.85 && 
       eq.longitude >= -122.05 && eq.longitude <= -121.75) ||
      // Morgan Hill / Hollister area  
      (eq.latitude >= 36.85 && eq.latitude <= 37.15 &&
       eq.longitude >= -121.75 && eq.longitude <= -121.35)
    );
    return isNearFault;
  });
  
  const now = Date.now();
  const last30Days = calaverasQuakes.filter(eq => eq.timestamp > now - 30 * 24 * 60 * 60 * 1000);
  const last7Days = calaverasQuakes.filter(eq => eq.timestamp > now - 7 * 24 * 60 * 60 * 1000);
  const recentQuakes = calaverasQuakes.slice(0, 20);
  
  // Check if there's current swarm activity (10+ quakes in 7 days in a small area)
  const isSwarmActive = last7Days.length >= 10;
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Calaveras Fault', url: `${baseUrl}/calaveras-fault` },
  ]);
  
  const articleSchema = generateArticleSchema();
  const faqSchema = generateCalaverasFAQSchema();
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, articleSchema, faqSchema]),
        }}
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-white">Calaveras Fault</li>
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
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Swarm-Prone
            </span>
            {isSwarmActive && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full flex items-center gap-1 animate-pulse">
                <Activity className="w-4 h-4" />
                Active Swarm
              </span>
            )}
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              75 Miles Long
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Calaveras Fault
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed max-w-3xl">
            The Calaveras Fault is famous for <strong className="text-white">earthquake swarms</strong> - 
            clusters of small earthquakes that rattle the <strong className="text-white">Tri-Valley</strong> area 
            (San Ramon, Dublin, Pleasanton) every few years. It's one of the most seismically active 
            faults in the Bay Area.
          </p>
        </header>
        
        {/* Swarm Alert Banner (if active) */}
        {isSwarmActive && (
          <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Zap className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">
                  Earthquake Swarm Activity Detected
                </h2>
                <p className="text-neutral-300">
                  <strong className="text-white">{last7Days.length} earthquakes</strong> have been recorded 
                  near the Calaveras Fault in the past 7 days. This elevated activity is typical of 
                  swarm behavior in the San Ramon area.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Ruler className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Length</span>
            </div>
            <div className="text-2xl font-bold">75 mi</div>
            <div className="text-xs text-neutral-500">120 km</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <History className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Largest</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">M6.2</div>
            <div className="text-xs text-neutral-500">1911 Morgan Hill</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">7-Day Count</span>
            </div>
            <div className={`text-2xl font-bold ${last7Days.length >= 10 ? 'text-amber-400' : ''}`}>
              {last7Days.length}
            </div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">30-Day Count</span>
            </div>
            <div className="text-2xl font-bold">{last30Days.length}</div>
            <div className="text-xs text-neutral-500">earthquakes</div>
          </div>
        </div>
        
        {/* What is the Calaveras Fault */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">What is the Calaveras Fault?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4 text-lg leading-relaxed">
              The Calaveras Fault is a major <strong>strike-slip fault</strong> that extends 75 miles 
              from Hollister in the south through the East Bay hills to the Danville/San Ramon area in 
              the north. It's part of the San Andreas Fault system and branches off from the 
              <Link href="/hayward-fault" className="text-blue-400 hover:text-blue-300"> Hayward Fault</Link> near Fremont.
            </p>
            <p className="text-neutral-300 mb-4 leading-relaxed">
              What makes the Calaveras Fault unique is its tendency to produce <strong>earthquake swarms</strong> - 
              sequences of many small earthquakes occurring over days or weeks without a clear mainshock. 
              The San Ramon area is particularly prone to these swarms, experiencing noticeable activity 
              every few years.
            </p>
            <p className="text-neutral-300 leading-relaxed">
              The fault moves at about <strong>15mm per year</strong> in the creeping southern section 
              near Hollister, but the northern section through San Ramon is locked and releases stress 
              through periodic swarms and occasional larger earthquakes.
            </p>
          </div>
        </section>
        
        {/* Earthquake Swarms Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-400" />
            Notable Earthquake Swarms
          </h2>
          
          <p className="text-neutral-300 mb-6">
            The San Ramon/Danville area is one of the most swarm-prone areas in California. 
            Here are some of the most notable swarms in recent years:
          </p>
          
          <div className="space-y-4">
            {notableSwarms.map((swarm, index) => (
              <div key={index} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{swarm.year} {swarm.location} Swarm</h3>
                    <span className="text-neutral-500">{swarm.duration}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-400">M{swarm.maxMagnitude}</div>
                      <div className="text-xs text-neutral-500">max magnitude</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{swarm.count}</div>
                      <div className="text-xs text-neutral-500">earthquakes</div>
                    </div>
                  </div>
                </div>
                <p className="text-neutral-400">{swarm.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Cities at Risk */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            Cities Along the Calaveras Fault
          </h2>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-500/10 text-left">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-400">City</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-400">Population</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-400">Distance</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-400">Risk</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-400 hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {citiesAtRisk.map((city, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/${city.name.toLowerCase().replace(/\s+/g, '-')}-earthquake-today`}
                          className="text-white hover:text-blue-400 transition-colors font-medium"
                        >
                          {city.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-neutral-400">{city.population}</td>
                      <td className="px-6 py-4 text-neutral-400">{city.faultDistance}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          city.risk === 'Very High' ? 'bg-red-500/20 text-red-400' :
                          city.risk === 'High' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {city.risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-sm hidden md:table-cell">{city.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* Live Earthquakes */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-400 animate-pulse" />
              Recent Earthquakes Near the Fault
            </h2>
            <Link 
              href="/region/san-ramon" 
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View San Ramon region →
            </Link>
          </div>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            {recentQuakes.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {recentQuakes.map(eq => (
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
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-neutral-400 hidden sm:block">
                        {getMagnitudeLabel(eq.magnitude)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent earthquakes near the Calaveras Fault zone.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Comparison with Other Faults */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How It Compares to Other Bay Area Faults</h2>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Fault</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Length</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Max Potential</th>
                  <th className="px-6 py-4 text-sm font-medium text-neutral-400">Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="bg-amber-500/5">
                  <td className="px-6 py-4 font-medium">Calaveras</td>
                  <td className="px-6 py-4 text-neutral-400">75 mi</td>
                  <td className="px-6 py-4 text-amber-400 font-bold">M7.0</td>
                  <td className="px-6 py-4 text-amber-400">Frequent swarms</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <Link href="/hayward-fault" className="text-blue-400 hover:text-blue-300">Hayward</Link>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">62 mi</td>
                  <td className="px-6 py-4 text-red-400 font-bold">M7.0</td>
                  <td className="px-6 py-4 text-neutral-400">Locked, overdue</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <Link href="/san-andreas-fault" className="text-blue-400 hover:text-blue-300">San Andreas</Link>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">800 mi</td>
                  <td className="px-6 py-4 text-red-400 font-bold">M8.0+</td>
                  <td className="px-6 py-4 text-neutral-400">Locked segments</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details 
                key={index}
                className="group bg-neutral-900 rounded-xl border border-white/10 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/5 transition-colors list-none">
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  <ChevronDown className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-neutral-300 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
        
        {/* Related Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/hayward-fault"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-red-400 transition-colors">Hayward Fault</h3>
              <p className="text-sm text-neutral-400">The "most dangerous fault" connects near Fremont</p>
            </Link>
            <Link 
              href="/earthquake-preparedness"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-emerald-400 transition-colors">Preparedness Guide</h3>
              <p className="text-sm text-neutral-400">Emergency kits, safety tips, and family plans</p>
            </Link>
            <Link 
              href="/felt-earthquake"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-amber-400 transition-colors">Did You Feel It?</h3>
              <p className="text-sm text-neutral-400">Report earthquake shaking in your area</p>
            </Link>
          </div>
        </section>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Stay informed about earthquake swarms in the Tri-Valley.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
            >
              View Live Dashboard
            </Link>
            <Link 
              href="/region/san-ramon"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              San Ramon Region
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Revalidate every hour
export const revalidate = 3600;
