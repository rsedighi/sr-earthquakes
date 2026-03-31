import { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  ChevronDown,
  Ruler,
  History,
  Building2,
  Calendar,
  Radio,
  Users
} from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { generateBreadcrumbSchema } from '@/lib/seo';


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Hayward Fault - The Most Dangerous Fault in America | Map & Guide',
  description: 'Complete guide to the Hayward Fault, called the most dangerous fault in America. Interactive map, earthquake history, affected cities Oakland, Berkeley, Fremont & more. Live seismic updates.',
  keywords: [
    'hayward fault',
    'hayward fault map',
    'hayward fault earthquake',
    'hayward fault earthquake prediction',
    'hayward fault last earthquake',
    'hayward fault overdue',
    'hayward fault bay area',
    'hayward fault line',
    'hayward fault 1868',
    'hayward fault creep',
    'oakland earthquake',
    'berkeley earthquake',
    'fremont earthquake',
    'east bay earthquake',
    'most dangerous fault america',
  ],
  openGraph: {
    title: 'Hayward Fault | The Most Dangerous Fault in America',
    description: 'The Hayward Fault runs through densely populated Oakland, Berkeley & Fremont. Learn about the risks and live earthquake monitoring.',
    type: 'article',
    url: `${baseUrl}/hayward-fault`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Hayward Fault Map and Guide',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hayward Fault - Most Dangerous Fault in America',
    description: 'Complete guide to the Hayward Fault running through Oakland, Berkeley, and Fremont.',
  },
  alternates: {
    canonical: `${baseUrl}/hayward-fault`,
  },
};

// Historical earthquakes on Hayward Fault
const historicalEarthquakes = [
  {
    year: 1868,
    magnitude: 6.8,
    name: 'Great Hayward Earthquake',
    description: 'The most destructive earthquake in Bay Area history until 1906. Surface rupture from Oakland to Fremont. Caused significant damage in San Francisco across the bay.',
    casualties: '30+',
    significance: 'Last major rupture on the Hayward Fault - over 155 years ago',
  },
  {
    year: 2018,
    magnitude: 4.4,
    name: 'Berkeley Earthquake',
    description: 'Centered beneath UC Berkeley campus. Widely felt across the Bay Area. Served as a reminder of the fault\'s presence.',
    casualties: '0',
    significance: 'Largest earthquake on the Hayward Fault since 2007',
  },
  {
    year: 2007,
    magnitude: 4.2,
    name: 'Oakland Hills Earthquake',
    description: 'Struck Oakland Hills near Piedmont. Felt strongly in Oakland and Berkeley. No significant damage.',
    casualties: '0',
    significance: 'Moderate earthquake on a typically quiet segment',
  },
  {
    year: 1984,
    magnitude: 4.5,
    name: 'Morgan Hill Earthquake',
    description: 'Though centered on the Calaveras Fault to the south, it highlighted the interconnected nature of Bay Area fault systems.',
    casualties: '0',
    significance: 'Part of ongoing East Bay seismic activity',
  },
];

// Cities at high risk
const citiesAtRisk = [
  { name: 'Oakland', population: '433K', risk: 'Critical', faultDistance: 'On fault', note: 'Downtown Oakland sits directly on the fault trace' },
  { name: 'Berkeley', population: '124K', risk: 'Critical', faultDistance: 'On fault', note: 'UC Berkeley campus crosses the fault' },
  { name: 'Fremont', population: '230K', risk: 'Critical', faultDistance: 'On fault', note: 'Fault runs through downtown Fremont' },
  { name: 'Hayward', population: '162K', risk: 'Critical', faultDistance: 'On fault', note: 'City that gave the fault its name' },
  { name: 'San Leandro', population: '91K', risk: 'Very High', faultDistance: '1 mi', note: 'Adjacent to fault trace' },
  { name: 'Richmond', population: '116K', risk: 'Very High', faultDistance: '2 mi', note: 'Northern terminus of fault zone' },
  { name: 'Union City', population: '74K', risk: 'Very High', faultDistance: '1 mi', note: 'Between Hayward and Fremont segments' },
  { name: 'San Jose', population: '1M', risk: 'High', faultDistance: '8 mi', note: 'Could feel strong shaking from major event' },
];

// FAQ data
const faqs = [
  {
    question: 'Why is the Hayward Fault called the most dangerous fault in America?',
    answer: 'The Hayward Fault is considered the most dangerous because of its location running directly through densely populated East Bay cities including Oakland, Berkeley, Hayward, and Fremont. Over 2.5 million people live within close proximity to the fault. Additionally, the fault is considered "overdue" for a major earthquake, having last ruptured in 1868 - longer than its average recurrence interval of about 140 years.',
  },
  {
    question: 'When was the last major earthquake on the Hayward Fault?',
    answer: 'The last major earthquake on the Hayward Fault was the 1868 "Great Hayward Earthquake," estimated at magnitude 6.8-7.0. It caused the surface to rupture for about 20 miles and was the most destructive earthquake in Bay Area history until 1906. That means it has been over 155 years since the last significant rupture.',
  },
  {
    question: 'Is the Hayward Fault overdue for an earthquake?',
    answer: 'Yes, scientists consider the Hayward Fault statistically overdue for a major earthquake. Based on studies of past earthquakes (paleoseismology), large earthquakes occur on the Hayward Fault roughly every 140 years on average. Since the last major earthquake was in 1868 (over 155 years ago), stress has been accumulating. The USGS estimates there is a 33% probability of a magnitude 6.7 or greater earthquake on the Hayward Fault in the next 30 years.',
  },
  {
    question: 'What is Hayward Fault creep?',
    answer: 'The Hayward Fault is one of the few faults in the world that exhibits "creep" - slow, continuous movement that can be observed at the surface. You can see evidence of this at places like the Hayward Fault Creep at the Memorial Stadium at UC Berkeley, where the fault is slowly offsetting the stadium seating. However, this creep only releases a small fraction of the accumulated stress; most will still be released in future earthquakes.',
  },
  {
    question: 'How much warning will we have before a Hayward Fault earthquake?',
    answer: 'Earthquakes cannot be predicted in advance, but the ShakeAlert early warning system can provide seconds to tens of seconds of warning AFTER an earthquake begins but BEFORE strong shaking arrives at your location. This warning time depends on your distance from the epicenter. Download the MyShake app or enable Android Earthquake Alerts to receive these warnings.',
  },
  {
    question: 'How many people live near the Hayward Fault?',
    answer: 'Approximately 2.5 million people live in close proximity to the Hayward Fault. The cities directly on the fault - Oakland, Berkeley, Hayward, Fremont, San Leandro, and Richmond - alone have a combined population of over 1.1 million. A major earthquake on this fault would affect millions more throughout the greater Bay Area.',
  },
  {
    question: 'What would a magnitude 7 Hayward Fault earthquake look like?',
    answer: 'A M7.0 earthquake on the Hayward Fault could cause catastrophic damage: hundreds to thousands of deaths, tens of thousands of injuries, and over $150 billion in damage. It would likely collapse soft-story apartment buildings, rupture gas lines causing fires, knock out power and water for weeks, and severely damage transportation infrastructure including BART which crosses the fault in multiple locations.',
  },
];

// Generate Article Schema
function generateArticleSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Hayward Fault: The Most Dangerous Fault in America',
    description: 'Comprehensive guide to the Hayward Fault including map, history, affected cities, and why it\'s considered the most dangerous fault in America.',
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
      '@id': `${baseUrl}/hayward-fault`,
    },
  };
}

// Generate FAQ Schema
function generateHaywardFAQSchema() {
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

export default async function HaywardFaultPage() {
  'use cache';
  cacheLife('hours');

  const allEarthquakes = await loadAllEarthquakes();
  
  // Filter earthquakes near Hayward Fault (East Bay hills)
  const haywardQuakes = allEarthquakes.filter(eq => {
    const isNearFault = (
      eq.latitude >= 37.45 && eq.latitude <= 37.95 &&
      eq.longitude >= -122.30 && eq.longitude <= -122.05
    );
    return isNearFault;
  });
  
  const now = Date.now();
  const last30Days = haywardQuakes.filter(eq => eq.timestamp > now - 30 * 24 * 60 * 60 * 1000);
  const recentQuakes = haywardQuakes.slice(0, 20);
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Hayward Fault', url: `${baseUrl}/hayward-fault` },
  ]);
  
  const articleSchema = generateArticleSchema();
  const faqSchema = generateHaywardFAQSchema();
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 md:pb-0">
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
            <li><Link prefetch={false} href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-white">Hayward Fault</li>
          </ol>
        </nav>
        
        {/* Back Navigation */}
        <Link prefetch={false} 
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
              <AlertTriangle className="w-4 h-4" />
              Critical Risk
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
              Overdue for Major Event
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Hayward Fault
          </h1>
          <p className="text-2xl text-red-400 font-semibold mb-4">
            "The Most Dangerous Fault in America"
          </p>
          <p className="text-xl text-neutral-400 leading-relaxed max-w-3xl">
            The Hayward Fault runs directly through the <strong className="text-white">most densely populated</strong> part 
            of the Bay Area - Oakland, Berkeley, Hayward, and Fremont. Over{' '}
            <strong className="text-white">2.5 million people</strong> live near this fault, which hasn't 
            had a major earthquake since <strong className="text-white">1868</strong>.
          </p>
        </header>
        
        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-red-500/30 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Earthquake Overdue</h2>
              <p className="text-neutral-300">
                The USGS estimates a <strong className="text-white">33% probability</strong> of a magnitude 
                6.7 or greater earthquake on the Hayward Fault in the next 30 years - the highest probability 
                of any individual Bay Area fault. The last major earthquake was{' '}
                <strong className="text-white">over 155 years ago</strong>.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Ruler className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Length</span>
            </div>
            <div className="text-2xl font-bold">62 mi</div>
            <div className="text-xs text-neutral-500">100 km</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <History className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Last Major</span>
            </div>
            <div className="text-2xl font-bold text-red-400">1868</div>
            <div className="text-xs text-neutral-500">155+ years ago</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Pop. At Risk</span>
            </div>
            <div className="text-2xl font-bold">2.5M+</div>
            <div className="text-xs text-neutral-500">people nearby</div>
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
        
        {/* Why It's Dangerous */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why the Hayward Fault is So Dangerous</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-red-400">1. Location</h3>
              <p className="text-neutral-300">
                Unlike the San Andreas which runs through relatively unpopulated areas in the Bay Area, 
                the Hayward Fault runs directly through downtown Oakland, the UC Berkeley campus, and 
                other densely populated cities. BART crosses the fault in multiple locations.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-red-400">2. Overdue Status</h3>
              <p className="text-neutral-300">
                Based on paleoseismic studies, major earthquakes occur on the Hayward Fault about every 
                140 years on average. The last one was in 1868 - more than 155 years ago. Stress continues 
                to accumulate.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-red-400">3. Vulnerable Buildings</h3>
              <p className="text-neutral-300">
                Many East Bay buildings were built before modern earthquake codes. "Soft-story" apartment 
                buildings (with garages on the ground floor) are particularly vulnerable and common in 
                Oakland and Berkeley.
              </p>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-red-400">4. Infrastructure</h3>
              <p className="text-neutral-300">
                Critical infrastructure including BART, major highways (I-880, I-580), water supply lines, 
                and the UC Berkeley campus all cross or sit adjacent to the fault. A major earthquake 
                could cripple regional transportation.
              </p>
            </div>
          </div>
        </section>
        
        {/* Cities at Risk */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-red-400" />
            Cities on the Hayward Fault
          </h2>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-500/10 text-left">
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
                        <Link prefetch={false} 
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
                          city.risk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          city.risk === 'Very High' ? 'bg-amber-500/20 text-amber-400' :
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
        
        {/* Historical Earthquakes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <History className="w-8 h-8 text-amber-400" />
            Historical Earthquakes
          </h2>
          
          <div className="space-y-4">
            {historicalEarthquakes.map((eq, index) => (
              <div key={index} className={`bg-neutral-900 rounded-xl p-6 border ${
                index === 0 ? 'border-red-500/30' : 'border-white/10'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{eq.name}</h3>
                    <span className="text-neutral-500">{eq.year}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-bold ${index === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      M{eq.magnitude}
                    </span>
                    <span className="text-sm text-neutral-500">magnitude</span>
                  </div>
                </div>
                <p className="text-neutral-300 mb-3">{eq.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-neutral-500">
                    Casualties: <span className="text-white">{eq.casualties}</span>
                  </span>
                  <span className={index === 0 ? 'text-red-400' : 'text-neutral-400'}>{eq.significance}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Fault Creep */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Hayward Fault "Creep"</h2>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <p className="text-neutral-300 mb-4">
              The Hayward Fault is one of the few faults in the world where you can actually <em>see</em> the 
              fault moving. This phenomenon is called "fault creep" - slow, continuous movement that occurs 
              without earthquakes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Visible Evidence</h3>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• UC Berkeley Memorial Stadium - offset seating sections</li>
                  <li>• Curbs and sidewalks in Hayward - visibly displaced</li>
                  <li>• Rose Street in Berkeley - pavement cracks</li>
                  <li>• Various structures along fault trace showing offsets</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">What It Means</h3>
                <p className="text-sm text-neutral-300">
                  While creep releases some stress, it only accounts for a small portion of the total plate 
                  movement. The majority of accumulated stress will still be released in future earthquakes. 
                  Creep is <strong>not</strong> preventing "the big one."
                </p>
              </div>
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
            <Link prefetch={false} 
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
                <p>No recent earthquakes near the Hayward Fault zone.</p>
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
            <Link prefetch={false} 
              href="/san-andreas-fault"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-amber-400 transition-colors">San Andreas Fault</h3>
              <p className="text-sm text-neutral-400">California's most famous fault, 800 miles long</p>
            </Link>
            <Link prefetch={false} 
              href="/earthquake-preparedness"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-emerald-400 transition-colors">Preparedness Guide</h3>
              <p className="text-sm text-neutral-400">Emergency kits, safety tips, and family plans</p>
            </Link>
            <Link prefetch={false} 
              href="/region/berkeley-oakland"
              className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-blue-400 transition-colors">East Bay Region</h3>
              <p className="text-sm text-neutral-400">All earthquake activity in Oakland/Berkeley area</p>
            </Link>
          </div>
        </section>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Stay informed about earthquake activity in the East Bay.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link prefetch={false} 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
            >
              View Live Dashboard
            </Link>
            <Link prefetch={false} 
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
