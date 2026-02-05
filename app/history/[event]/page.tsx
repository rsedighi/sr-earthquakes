import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, AlertTriangle, History, ExternalLink, BookOpen } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// Historical earthquake events
const HISTORICAL_EVENTS = {
  '1906-san-francisco': {
    name: '1906 San Francisco Earthquake',
    date: 'April 18, 1906',
    time: '5:12 AM',
    magnitude: 7.9,
    location: 'San Francisco, California',
    coordinates: { lat: 37.75, lon: -122.55 },
    depth: 8,
    deaths: '3,000+',
    damage: '$524 million (1906 dollars)',
    fault: 'San Andreas Fault',
    summary: 'The deadliest earthquake in California history struck San Francisco at 5:12 AM on April 18, 1906. The quake and resulting fires destroyed over 80% of San Francisco.',
    content: `
      <h2>The Great Earthquake</h2>
      <p>At 5:12 AM on April 18, 1906, a massive earthquake struck San Francisco with an estimated magnitude of 7.9. The rupture on the San Andreas Fault extended for nearly 300 miles, from San Juan Bautista to Cape Mendocino.</p>
      
      <p>The initial shaking lasted approximately 45-60 seconds and was felt from Oregon to Los Angeles and as far inland as central Nevada. The ground displacement along the fault was as much as 20 feet in some locations.</p>
      
      <h2>The Fires</h2>
      <p>While the earthquake caused significant damage, the subsequent fires proved even more destructive. Broken gas mains and collapsed chimneys ignited fires throughout the city. With water mains also broken, firefighters were largely helpless to stop the blazes.</p>
      
      <p>The fires burned for three days and nights, destroying approximately 25,000 buildings and leaving more than half of San Francisco's 400,000 residents homeless.</p>
      
      <h2>Death Toll and Damage</h2>
      <p>Official estimates at the time placed the death toll at around 700, but modern research suggests the actual number was closer to 3,000. The majority of deaths occurred in San Francisco, but significant casualties were also reported in San Jose, Santa Rosa, and other Bay Area cities.</p>
      
      <p>The total damage was estimated at $524 million in 1906 dollars, equivalent to approximately $16 billion today.</p>
      
      <h2>Legacy and Lessons</h2>
      <p>The 1906 earthquake led to significant advances in earthquake science and building codes. The "Reid's elastic rebound theory," which explains how earthquakes occur, was developed based on observations from this event.</p>
      
      <p>San Francisco rebuilt with improved building standards, and the disaster prompted the development of modern earthquake engineering. The event remains a reminder of the seismic risk facing the Bay Area.</p>
    `,
    sources: [
      { name: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/events/1906calif/' },
      { name: 'California Historical Society', url: 'https://californiahistoricalsociety.org/' },
    ],
  },
  '1989-loma-prieta': {
    name: '1989 Loma Prieta Earthquake',
    date: 'October 17, 1989',
    time: '5:04 PM',
    magnitude: 6.9,
    location: 'Santa Cruz Mountains, California',
    coordinates: { lat: 37.04, lon: -121.88 },
    depth: 18,
    deaths: '63',
    damage: '$6 billion',
    fault: 'San Andreas Fault',
    summary: 'The Loma Prieta earthquake struck during the World Series, causing the collapse of the Cypress Street Viaduct in Oakland and a section of the Bay Bridge.',
    content: `
      <h2>The World Series Earthquake</h2>
      <p>At 5:04 PM on October 17, 1989, a magnitude 6.9 earthquake struck the Santa Cruz Mountains. The timing coincided with the start of Game 3 of the World Series between the San Francisco Giants and Oakland Athletics at Candlestick Park, leading to live national television coverage of the disaster's aftermath.</p>
      
      <p>The earthquake was centered approximately 60 miles south of San Francisco but caused significant damage throughout the Bay Area, particularly in areas built on soft soils.</p>
      
      <h2>The Cypress Street Viaduct Collapse</h2>
      <p>The deadliest consequence of the earthquake was the collapse of a 1.25-mile section of the Cypress Street Viaduct (Interstate 880) in Oakland. The double-deck freeway pancaked, crushing vehicles on the lower deck and killing 42 people.</p>
      
      <p>The collapse was attributed to the amplification of seismic waves in the soft bay mud beneath the freeway, combined with design deficiencies in the structure.</p>
      
      <h2>Bay Bridge Damage</h2>
      <p>A 50-foot section of the upper deck of the Bay Bridge collapsed onto the lower deck, killing one motorist. This dramatic failure, captured in photographs that circled the world, led to a complete reconstruction of the eastern span of the bridge, completed in 2013.</p>
      
      <h2>Marina District Devastation</h2>
      <p>San Francisco's Marina District experienced severe damage due to liquefaction. Buildings constructed on fill from the 1915 Panama-Pacific International Exposition collapsed or tilted dramatically. Ruptured gas lines caused fires that destroyed several blocks.</p>
      
      <h2>Lessons Learned</h2>
      <p>The Loma Prieta earthquake led to significant changes in building codes and infrastructure design. It demonstrated the vulnerability of structures built on soft soils and the importance of seismic retrofitting. The disaster also led to improvements in emergency response coordination.</p>
      
      <p>Today, the event serves as a reminder that the Bay Area remains at significant seismic risk, particularly from the closer and more dangerous Hayward Fault.</p>
    `,
    sources: [
      { name: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/events/1989lomaprieta/' },
      { name: 'California Earthquake Authority', url: 'https://www.earthquakeauthority.com/' },
    ],
  },
  '1868-hayward': {
    name: '1868 Hayward Earthquake',
    date: 'October 21, 1868',
    time: '7:53 AM',
    magnitude: 6.8,
    location: 'Hayward, California',
    coordinates: { lat: 37.67, lon: -122.08 },
    depth: 10,
    deaths: '30+',
    damage: '$350,000 (1868 dollars)',
    fault: 'Hayward Fault',
    summary: 'Known as "The Great San Francisco Earthquake" until 1906, this earthquake ruptured the Hayward Fault and devastated the East Bay.',
    content: `
      <h2>The "Great San Francisco Earthquake"</h2>
      <p>Before 1906, the earthquake that occurred on October 21, 1868 was known as "The Great San Francisco Earthquake." The magnitude 6.8 event ruptured approximately 20 miles of the Hayward Fault, from Fremont to Berkeley.</p>
      
      <p>The earthquake struck at 7:53 AM on a Wednesday morning, when many people were beginning their day. It was felt from Monterey to Red Bluff, a distance of over 300 miles.</p>
      
      <h2>Damage and Deaths</h2>
      <p>At least 30 people were killed, and nearly every building in Hayward was damaged or destroyed. In San Francisco, five people died and many adobe and brick buildings collapsed. The newly built San Leandro courthouse was destroyed.</p>
      
      <p>Total damage was estimated at $350,000 in 1868 dollars, a significant sum at the time. Hayward, then a small agricultural town, was particularly hard hit, with almost complete destruction of its business district.</p>
      
      <h2>Scientific Significance</h2>
      <p>The 1868 earthquake was the first to be scientifically studied in California. Geologist Josiah Whitney conducted the first systematic investigation of an earthquake in the state, documenting fault displacement and ground effects.</p>
      
      <p>The surface rupture was clearly visible, with horizontal displacement of several feet observed in multiple locations. This evidence was crucial in early understanding of earthquake mechanics.</p>
      
      <h2>Why It Matters Today</h2>
      <p>The Hayward Fault has an average recurrence interval of approximately 140 years for major earthquakes. Having last ruptured in 1868, the fault is now considered "due" for another major event.</p>
      
      <p>Scientists estimate a 33% probability of a magnitude 6.7 or greater earthquake on the Hayward Fault within the next 30 years. With millions of people now living along the fault, such an event would be catastrophic.</p>
    `,
    sources: [
      { name: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/events/1868calif/' },
      { name: 'Hayward Fault Network', url: 'https://seismo.berkeley.edu/hayward/' },
    ],
  },
  '2014-napa': {
    name: '2014 South Napa Earthquake',
    date: 'August 24, 2014',
    time: '3:20 AM',
    magnitude: 6.0,
    location: 'American Canyon, California',
    coordinates: { lat: 38.22, lon: -122.31 },
    depth: 11,
    deaths: '1',
    damage: '$400 million - $1 billion',
    fault: 'West Napa Fault',
    summary: 'The largest earthquake to strike the Bay Area since 1989, causing significant damage to historic downtown Napa.',
    content: `
      <h2>The Largest Quake Since Loma Prieta</h2>
      <p>At 3:20 AM on August 24, 2014, a magnitude 6.0 earthquake struck the Napa Valley, centered about 6 miles south of Napa. It was the largest earthquake to hit the Bay Area since the 1989 Loma Prieta event.</p>
      
      <p>The earthquake woke residents throughout Northern California, from Sacramento to San Francisco. Over 200 people were injured, and one person died from heart-related causes during the event.</p>
      
      <h2>Damage to Wine Country</h2>
      <p>The earthquake caused significant damage to the historic downtown Napa area. Many older, unreinforced masonry buildings suffered partial or complete collapse. The famous Napa wineries experienced substantial losses, with an estimated $80 million in damaged wine barrels alone.</p>
      
      <p>Fires broke out in multiple locations from broken gas lines, destroying several mobile homes. Over 100 homes were red-tagged as unsafe for occupancy.</p>
      
      <h2>The West Napa Fault</h2>
      <p>The earthquake occurred on the West Napa Fault, a previously less-studied fault that runs north-south through the region. The event produced approximately 12 kilometers of surface rupture with up to 46 centimeters of displacement.</p>
      
      <p>This earthquake served as a reminder that the Bay Area has many active faults beyond the well-known San Andreas and Hayward faults.</p>
      
      <h2>Aftershock Sequence</h2>
      <p>The South Napa earthquake was followed by a significant aftershock sequence, with over 250 aftershocks recorded in the first two weeks. The largest aftershock measured magnitude 3.9.</p>
      
      <h2>Economic Impact</h2>
      <p>Total economic losses were estimated between $400 million and $1 billion, including both direct damage and business interruption. The earthquake had a significant impact on Napa's tourism-dependent economy, particularly during the critical harvest season.</p>
    `,
    sources: [
      { name: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/eventpage/nc72282711' },
      { name: 'CGS', url: 'https://www.conservation.ca.gov/' },
    ],
  },
};

type EventId = keyof typeof HISTORICAL_EVENTS;

interface PageProps {
  params: Promise<{ event: string }>;
}

export async function generateStaticParams() {
  return Object.keys(HISTORICAL_EVENTS).map(event => ({ event }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const eventId = resolvedParams.event as EventId;
  const event = HISTORICAL_EVENTS[eventId];
  
  if (!event) {
    return { title: 'Not Found' };
  }
  
  const title = `${event.name} | Bay Area Earthquake History`;
  const description = `${event.summary} Magnitude ${event.magnitude}, ${event.date}. Learn about this historic earthquake and its impact on the Bay Area.`;
  
  return {
    title,
    description,
    keywords: [
      event.name.toLowerCase(),
      `${event.date.split(',')[1]?.trim() || ''} earthquake`,
      `${event.location.toLowerCase()} earthquake`,
      event.fault.toLowerCase(),
      'california earthquake history',
      'bay area earthquake',
      'historic earthquake',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/history/${eventId}`,
      images: [{
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: event.name,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/history/${eventId}`,
    },
  };
}

export default async function HistoricalEventPage({ params }: PageProps) {
  const resolvedParams = await params;
  const eventId = resolvedParams.event as EventId;
  const event = HISTORICAL_EVENTS[eventId];
  
  if (!event) {
    notFound();
  }
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'History', url: `${baseUrl}/history` },
    { name: event.name, url: `${baseUrl}/history/${eventId}` },
  ]);
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: event.name,
    description: event.summary,
    datePublished: '2024-01-01',
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
    mainEntityOfPage: `${baseUrl}/history/${eventId}`,
    about: {
      '@type': 'Event',
      name: event.name,
      startDate: event.date,
      location: {
        '@type': 'Place',
        name: event.location,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: event.coordinates.lat,
          longitude: event.coordinates.lon,
        },
      },
    },
  };
  
  const otherEvents = Object.entries(HISTORICAL_EVENTS)
    .filter(([id]) => id !== eventId)
    .slice(0, 3);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, articleSchema]),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/history" className="hover:text-white transition-colors">History</Link></li>
            <li>/</li>
            <li className="text-white truncate max-w-[200px]">{event.name}</li>
          </ol>
        </nav>
        
        {/* Back Link */}
        <Link 
          href="/history"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Earthquake History
        </Link>
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              M{event.magnitude}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {event.fault}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {event.name}
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed">
            {event.summary}
          </p>
        </header>
        
        {/* Quick Facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase">Date</span>
            </div>
            <div className="font-semibold">{event.date}</div>
            <div className="text-xs text-neutral-500">{event.time}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase">Magnitude</span>
            </div>
            <div className="font-semibold text-red-400">M{event.magnitude}</div>
            <div className="text-xs text-neutral-500">{event.depth}km deep</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs uppercase">Location</span>
            </div>
            <div className="font-semibold text-sm">{event.location}</div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <History className="w-4 h-4" />
              <span className="text-xs uppercase">Deaths</span>
            </div>
            <div className="font-semibold">{event.deaths}</div>
            <div className="text-xs text-neutral-500">{event.damage} damage</div>
          </div>
        </div>
        
        {/* Main Content */}
        <article 
          className="prose prose-invert prose-lg max-w-none mb-12
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-p:text-neutral-300 prose-p:leading-relaxed
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: event.content }}
        />
        
        {/* Sources */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Sources & Further Reading
          </h2>
          <ul className="space-y-2">
            {event.sources.map((source, index) => (
              <li key={index}>
                <a 
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  {source.name}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        </section>
        
        {/* Related Events */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Other Historic Earthquakes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherEvents.map(([id, ev]) => (
              <Link 
                key={id}
                href={`/history/${id}`}
                className="bg-neutral-900 rounded-xl p-5 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="text-sm text-red-400 font-medium mb-1">M{ev.magnitude}</div>
                <h3 className="font-semibold mb-1">{ev.name}</h3>
                <div className="text-sm text-neutral-500">{ev.date}</div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-neutral-400 mb-4">
            Learn how to protect yourself and your family from future earthquakes.
          </p>
          <Link 
            href="/earthquake-preparedness"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Earthquake Preparedness Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
