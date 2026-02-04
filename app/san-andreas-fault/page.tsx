import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ChevronDown,
  Ruler,
  History,
  Building2,
  TrendingUp,
  Radio
} from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'San Andreas Fault - Bay Area Earthquake Guide, Map & History',
  description: 'Complete guide to the San Andreas Fault in the Bay Area. Interactive map, earthquake history, cities at risk, and when the next big one might hit. Live seismic activity updates.',
  keywords: [
    'san andreas fault',
    'san andreas fault map',
    'san andreas fault bay area',
    'san andreas fault earthquake',
    'when will san andreas fault earthquake',
    'san andreas fault california',
    'san andreas fault line',
    'san andreas fault san francisco',
    '1906 san francisco earthquake',
    'san andreas fault next big one',
    'san andreas fault history',
    'san andreas fault cities',
  ],
  openGraph: {
    title: 'San Andreas Fault | Bay Area Guide, Map & Live Earthquakes',
    description: 'Complete guide to the San Andreas Fault: map, history, at-risk cities, and real-time earthquake monitoring.',
    type: 'article',
    url: `${baseUrl}/san-andreas-fault`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'San Andreas Fault Map and Guide',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'San Andreas Fault | Complete Bay Area Guide',
    description: 'Map, history, and live earthquake monitoring for California\'s most famous fault.',
  },
  alternates: {
    canonical: `${baseUrl}/san-andreas-fault`,
  },
};

// Historical earthquakes data
const historicalEarthquakes = [
  {
    year: 1906,
    magnitude: 7.9,
    name: 'Great San Francisco Earthquake',
    description: 'Devastated San Francisco. Fire caused 80% of destruction. Estimated 3,000+ deaths. Surface rupture traced for 296 miles.',
    casualties: '~3,000+',
    significance: 'One of the most significant earthquakes in American history',
  },
  {
    year: 1989,
    magnitude: 6.9,
    name: 'Loma Prieta Earthquake',
    description: 'Struck during World Series game. Collapsed Cypress Structure and Bay Bridge section. 63 deaths, $6B in damage.',
    casualties: '63',
    significance: 'Most damaging Bay Area earthquake since 1906',
  },
  {
    year: 1838,
    magnitude: 6.8,
    name: 'Great San Francisco Bay Earthquake',
    description: 'Ruptured the northern Peninsula segment. Damaged Mission Dolores and other structures.',
    casualties: 'Unknown',
    significance: 'First recorded major earthquake on the Peninsula segment',
  },
  {
    year: 1857,
    magnitude: 7.9,
    name: 'Fort Tejon Earthquake',
    description: 'Ruptured the southern San Andreas. One of the largest earthquakes in California history.',
    casualties: '2',
    significance: 'Last major earthquake on southern San Andreas',
  },
];

// Cities at risk
const citiesAtRisk = [
  { name: 'San Francisco', population: '874K', risk: 'Very High', faultDistance: '0 mi' },
  { name: 'Daly City', population: '104K', risk: 'Very High', faultDistance: '1 mi' },
  { name: 'Pacifica', population: '39K', risk: 'Very High', faultDistance: 'On fault' },
  { name: 'Half Moon Bay', population: '12K', risk: 'High', faultDistance: '5 mi' },
  { name: 'San Mateo', population: '105K', risk: 'High', faultDistance: '8 mi' },
  { name: 'Redwood City', population: '84K', risk: 'High', faultDistance: '10 mi' },
  { name: 'Palo Alto', population: '68K', risk: 'Moderate', faultDistance: '12 mi' },
  { name: 'San Jose', population: '1M', risk: 'Moderate', faultDistance: '15 mi' },
];

// FAQ data
const faqs = [
  {
    question: 'When will the San Andreas Fault cause the next big earthquake?',
    answer: 'Scientists cannot predict exactly when the next major earthquake will occur. However, the USGS estimates there is a 22% probability of a magnitude 6.7 or greater earthquake on the northern San Andreas Fault in the next 30 years. The southern segment (near Los Angeles) has a 60% probability of a major quake in the same timeframe. The northern segment last ruptured in 1906 and has been "quiet" since.',
  },
  {
    question: 'How long is the San Andreas Fault?',
    answer: 'The San Andreas Fault extends approximately 800 miles (1,300 km) through California, from the Salton Sea in the south to Cape Mendocino in the north. In the Bay Area, it runs offshore near the Golden Gate, then comes onshore at Mussel Rock near Pacifica and continues down the Peninsula toward San Juan Bautista.',
  },
  {
    question: 'Can the San Andreas Fault cause a tsunami?',
    answer: 'A direct San Andreas earthquake is unlikely to cause a significant tsunami because it is primarily a strike-slip fault (horizontal movement) rather than a subduction or thrust fault. However, underwater landslides triggered by a major San Andreas earthquake could potentially cause localized tsunamis in the San Francisco Bay.',
  },
  {
    question: 'What is the difference between the San Andreas and Hayward Faults?',
    answer: 'Both are major faults in the Bay Area\'s fault system, but they\'re different branches. The San Andreas runs along the Peninsula and through San Francisco, while the Hayward Fault runs along the East Bay hills through Oakland, Berkeley, and Fremont. The Hayward Fault is actually considered more dangerous to the Bay Area because it runs directly through densely populated areas.',
  },
  {
    question: 'How fast is the San Andreas Fault moving?',
    answer: 'The Pacific Plate is moving northwestward past the North American Plate at an average rate of about 2 inches (5 cm) per year along the San Andreas Fault. This movement accumulates stress that is released during earthquakes. Over millions of years, this movement will eventually slide Los Angeles past San Francisco.',
  },
  {
    question: 'Could California fall into the ocean from a San Andreas earthquake?',
    answer: 'No, this is a common myth. The San Andreas is a transform fault where plates slide past each other horizontally, not vertically. California west of the fault is slowly moving northward, not sinking. In about 15 million years, Los Angeles and San Francisco will be neighbors (both on the Pacific Plate side), but the land will never "fall into the ocean."',
  },
];

// Generate Article Schema
function generateArticleSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'San Andreas Fault: Complete Bay Area Guide',
    description: 'Comprehensive guide to the San Andreas Fault including maps, history, at-risk cities, and live earthquake data.',
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
      '@id': `${baseUrl}/san-andreas-fault`,
    },
    about: {
      '@type': 'Thing',
      name: 'San Andreas Fault',
      description: 'Major geological fault in California',
    },
  };
}

// Generate FAQ Schema
function generateSanAndreasFAQSchema() {
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

export default async function SanAndreasFaultPage() {
  const allEarthquakes = loadAllEarthquakes();
  
  // Filter earthquakes near San Andreas Fault (Peninsula and SF)
  // Approximate bounding box for San Andreas in Bay Area
  const sanAndreasQuakes = allEarthquakes.filter(eq => {
    // San Andreas runs roughly along these coordinates in Bay Area
    const isNearFault = (
      // SF and Peninsula segment
      (eq.latitude >= 37.3 && eq.latitude <= 37.85 && 
       eq.longitude >= -122.6 && eq.longitude <= -122.35)
    );
    return isNearFault;
  });
  
  const now = Date.now();
  const last30Days = sanAndreasQuakes.filter(eq => eq.timestamp > now - 30 * 24 * 60 * 60 * 1000);
  const recentQuakes = sanAndreasQuakes.slice(0, 20);
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'San Andreas Fault', url: `${baseUrl}/san-andreas-fault` },
  ]);
  
  const articleSchema = generateArticleSchema();
  const faqSchema = generateSanAndreasFAQSchema();
  
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
            <li className="text-white">San Andreas Fault</li>
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
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Major Fault Line
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
              800 Miles Long
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            San Andreas Fault
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed max-w-3xl">
            California's most famous fault line runs <strong className="text-white">800 miles</strong> from 
            the Salton Sea to Cape Mendocino. In the Bay Area, it passes through San Francisco and down 
            the Peninsula. The 1906 earthquake that devastated San Francisco originated here.
          </p>
        </header>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Ruler className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Length</span>
            </div>
            <div className="text-2xl font-bold">800 mi</div>
            <div className="text-xs text-neutral-500">1,300 km</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <History className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Last Major</span>
            </div>
            <div className="text-2xl font-bold">1906</div>
            <div className="text-xs text-neutral-500">M7.9 SF Earthquake</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Movement</span>
            </div>
            <div className="text-2xl font-bold">2 in/yr</div>
            <div className="text-xs text-neutral-500">Plate velocity</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">30-Day Quakes</span>
            </div>
            <div className="text-2xl font-bold">{last30Days.length}</div>
            <div className="text-xs text-neutral-500">near fault zone</div>
          </div>
        </div>
        
        {/* What is the San Andreas Fault */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">What is the San Andreas Fault?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4 text-lg leading-relaxed">
              The San Andreas Fault is a <strong>transform fault</strong> marking the boundary between the 
              Pacific Plate and the North American Plate. Unlike subduction zones where one plate dives beneath 
              another, transform faults feature two plates sliding horizontally past each other.
            </p>
            <p className="text-neutral-300 mb-4 leading-relaxed">
              In California, the Pacific Plate (carrying much of coastal California including Los Angeles) is 
              moving northwestward relative to the North American Plate at about <strong>2 inches per year</strong>. 
              This seemingly slow movement builds enormous stress that is periodically released as earthquakes.
            </p>
            <p className="text-neutral-300 leading-relaxed">
              The fault was discovered in 1895 by UC Berkeley geology professor Andrew Lawson, who named it 
              after the San Andreas Valley (now Crystal Springs Reservoir) where he first identified it on 
              the Peninsula south of San Francisco.
            </p>
          </div>
        </section>
        
        {/* Bay Area Segment */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">San Andreas Fault in the Bay Area</h2>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-6">
            <h3 className="font-semibold text-xl mb-4 text-red-400">Path Through the Bay Area</h3>
            <div className="space-y-4 text-neutral-300">
              <p>
                The San Andreas Fault enters the Bay Area from the south, passing through San Juan Bautista 
                (where it creeps continuously) and continuing up the Peninsula.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Peninsula Segment</h4>
                  <p className="text-sm">
                    Runs along the Crystal Springs Reservoir and through the hills west of Redwood City, 
                    Millbrae, and Daly City. This segment has been "locked" since 1906.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">San Francisco Segment</h4>
                  <p className="text-sm">
                    Passes just offshore at the Golden Gate, then comes onshore at Mussel Rock in Daly City. 
                    Continues offshore past the city and up through Marin County.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cities at Risk Table */}
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-4">
              <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Cities Near the San Andreas Fault
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 text-left">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-neutral-400">City</th>
                    <th className="px-6 py-3 text-sm font-medium text-neutral-400">Population</th>
                    <th className="px-6 py-3 text-sm font-medium text-neutral-400">Distance to Fault</th>
                    <th className="px-6 py-3 text-sm font-medium text-neutral-400">Risk Level</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* Historical Earthquakes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <History className="w-8 h-8 text-amber-400" />
            Major Historical Earthquakes
          </h2>
          
          <div className="space-y-4">
            {historicalEarthquakes.map((eq, index) => (
              <div key={index} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{eq.name}</h3>
                    <span className="text-neutral-500">{eq.year}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-amber-400">M{eq.magnitude}</span>
                    <span className="text-sm text-neutral-500">magnitude</span>
                  </div>
                </div>
                <p className="text-neutral-300 mb-3">{eq.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-neutral-500">
                    Casualties: <span className="text-white">{eq.casualties}</span>
                  </span>
                  <span className="text-neutral-400">{eq.significance}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* The Next Big One */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            When Will "The Big One" Hit?
          </h2>
          
          <div className="bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <p className="text-lg text-neutral-300 mb-4">
              Scientists cannot predict exactly when the next major earthquake will occur, but they can 
              estimate probabilities based on historical patterns and accumulated stress.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-semibold text-red-400 mb-2">Northern Segment (Bay Area)</h3>
                <p className="text-3xl font-bold text-white mb-1">22%</p>
                <p className="text-sm text-neutral-400">probability of M6.7+ in next 30 years</p>
                <p className="text-xs text-neutral-500 mt-2">Last major rupture: 1906</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-semibold text-amber-400 mb-2">Southern Segment (LA Area)</h3>
                <p className="text-3xl font-bold text-white mb-1">60%</p>
                <p className="text-sm text-neutral-400">probability of M6.7+ in next 30 years</p>
                <p className="text-xs text-neutral-500 mt-2">Last major rupture: 1857</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold text-lg mb-3">Why Scientists Are Watching Closely</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>The northern San Andreas has been relatively quiet since 1906 - stress is accumulating</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>The southern segment hasn't ruptured since 1857 - longer than average interval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>GPS measurements show strain building along locked sections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Both sections are considered "overdue" based on historical averages</span>
              </li>
            </ul>
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
              href="/today" 
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all →
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
                <p>No recent earthquakes near the San Andreas Fault zone.</p>
              </div>
            )}
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
              <p className="text-sm text-neutral-400">The "most dangerous fault in America" runs through the East Bay</p>
            </Link>
            <Link 
              href="/earthquake-preparedness"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-emerald-400 transition-colors">Preparedness Guide</h3>
              <p className="text-sm text-neutral-400">Emergency kits, safety tips, and family plans</p>
            </Link>
            <Link 
              href="/region/san-francisco"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-blue-400 transition-colors">San Francisco Region</h3>
              <p className="text-sm text-neutral-400">All earthquake activity in San Francisco</p>
            </Link>
          </div>
        </section>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Monitor earthquake activity across the entire Bay Area.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
            >
              View Live Dashboard
            </Link>
            <Link 
              href="/earthquake-preparedness"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Preparedness Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Revalidate every hour
export const revalidate = 3600;
