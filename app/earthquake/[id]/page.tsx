import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRegionForCoordinates, getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { generateEarthquakeEventSchema, generateEarthquakeArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EarthquakeShareContent } from '@/components/earthquake-share-content';
import { BayAreaLogo } from '@/components/bay-area-logo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: Date;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  felt: number | null;
  significance: number;
  url?: string;
  region: string;
}

async function getEarthquake(id: string): Promise<Earthquake | null> {
  // First try USGS API
  try {
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const feature = await response.json();
      const [longitude, latitude, depth] = feature.geometry.coordinates;
      
      return {
        id: feature.id,
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        time: new Date(feature.properties.time),
        timestamp: feature.properties.time,
        latitude,
        longitude,
        depth,
        felt: feature.properties.felt,
        significance: feature.properties.sig,
        url: feature.properties.url,
        region: getRegionForCoordinates(latitude, longitude),
      };
    }
  } catch {
    // Continue to local search
  }
  
  // Search local data
  const dataDir = path.join(process.cwd(), 'data');
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.features) {
        const feature = data.features.find((f: { id: string }) => f.id === id);
        if (feature) {
          const [longitude, latitude, depth] = feature.geometry.coordinates;
          return {
            id: feature.id,
            magnitude: feature.properties.mag,
            place: feature.properties.place,
            time: new Date(feature.properties.time),
            timestamp: feature.properties.time,
            latitude,
            longitude,
            depth,
            felt: feature.properties.felt,
            significance: feature.properties.sig,
            url: feature.properties.url,
            region: getRegionForCoordinates(latitude, longitude),
          };
        }
      }
    }
  } catch {
    // Return null
  }
  
  return null;
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const earthquake = await getEarthquake(id);
  
  if (!earthquake) {
    return {
      title: 'Earthquake Not Found',
    };
  }
  
  const date = new Date(earthquake.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const region = getRegionById(earthquake.region);
  
  const title = `M${earthquake.magnitude.toFixed(1)} Earthquake ${earthquake.place} - ${formattedDate}`;
  const description = `A ${getMagnitudeLabel(earthquake.magnitude).toLowerCase()} magnitude ${earthquake.magnitude.toFixed(1)} earthquake occurred ${earthquake.place} on ${formattedDate} at a depth of ${earthquake.depth.toFixed(1)}km. ${earthquake.felt ? `Felt by ${earthquake.felt} people.` : ''} View detailed seismic data and community reports.`;
  
  const keywords = [
    `M${earthquake.magnitude.toFixed(1)} earthquake`,
    earthquake.place,
    region?.name || '',
    region?.county || '',
    region?.faultLine || '',
    'California earthquake',
    'Bay Area earthquake',
    `earthquake ${formattedDate}`,
    getMagnitudeLabel(earthquake.magnitude) + ' earthquake',
    'did you feel it',
    'earthquake reports',
  ].filter(Boolean);
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: date.toISOString(),
      modifiedTime: new Date().toISOString(),
      authors: ['Bay Tremor'],
      tags: keywords,
      url: `${baseUrl}/earthquake/${id}`,
      images: [
        {
          url: `${baseUrl}/earthquake/${id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/earthquake/${id}/twitter-image`],
    },
    alternates: {
      canonical: `${baseUrl}/earthquake/${id}`,
    },
  };
}

export default async function EarthquakePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const earthquake = await getEarthquake(id);
  
  if (!earthquake) {
    notFound();
  }
  
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude);
  const magnitudeColor = getMagnitudeColor(earthquake.magnitude);
  const magnitudeLabel = getMagnitudeLabel(earthquake.magnitude);

  // Generate structured data schemas
  const eventSchema = generateEarthquakeEventSchema({
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    place: earthquake.place,
    timestamp: earthquake.timestamp,
    latitude: earthquake.latitude,
    longitude: earthquake.longitude,
    depth: earthquake.depth,
    felt: earthquake.felt,
  });
  
  const articleSchema = generateEarthquakeArticleSchema({
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    place: earthquake.place,
    timestamp: earthquake.timestamp,
    depth: earthquake.depth,
    region: earthquake.region,
  });
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: region?.name || 'Region', url: region ? `${baseUrl}/region/${region.id}` : baseUrl },
    { name: `M${earthquake.magnitude.toFixed(1)} ${earthquake.place.split(',')[0]}`, url: `${baseUrl}/earthquake/${earthquake.id}` },
  ]);

  // Serialize earthquake for client component
  const earthquakeData = {
    id: earthquake.id,
    magnitude: earthquake.magnitude,
    place: earthquake.place,
    time: earthquake.time.toISOString(),
    timestamp: earthquake.timestamp,
    latitude: earthquake.latitude,
    longitude: earthquake.longitude,
    depth: earthquake.depth,
    felt: earthquake.felt,
    significance: earthquake.significance,
    url: earthquake.url,
    region: earthquake.region,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* JSON-LD Structured Data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([eventSchema, articleSchema, breadcrumbSchema]),
        }}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <BayAreaLogo variant="seismic-bridge" className="w-8 h-8" />
              <span className="font-medium">Bay Area Quake Tracker</span>
            </Link>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="px-4 py-8">
        {/* Breadcrumb Navigation for SEO */}
        <nav className="max-w-4xl mx-auto mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
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
            <li className="text-white truncate max-w-[200px]">
              M{earthquake.magnitude.toFixed(1)} {earthquake.place.split(',')[0]}
            </li>
          </ol>
        </nav>
        
        {/* Main Content - Client Component with full interactive experience */}
        <EarthquakeShareContent 
          earthquake={{
            ...earthquakeData,
            time: new Date(earthquakeData.time),
          }}
        />
      </main>
      
      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 mt-8 border-t border-white/5">
        <p className="text-sm text-neutral-500 text-center">
          Data from{' '}
          <a href="https://earthquake.usgs.gov/" className="text-neutral-400 hover:text-white transition-colors">
            USGS Earthquake Hazards Program
          </a>
        </p>
        <p className="text-xs text-neutral-600 mt-2 text-center">
          This site provides real-time earthquake information for educational purposes.
          For emergencies, dial 911.
        </p>
      </footer>
    </div>
  );
}
