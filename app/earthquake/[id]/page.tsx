import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRegionForCoordinates, getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { generateEarthquakeEventSchema, generateEarthquakeArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Activity, ExternalLink, Waves } from 'lucide-react';

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
  const description = `A ${getMagnitudeLabel(earthquake.magnitude).toLowerCase()} magnitude ${earthquake.magnitude.toFixed(1)} earthquake occurred ${earthquake.place} on ${formattedDate} at a depth of ${earthquake.depth.toFixed(1)}km. ${earthquake.felt ? `Felt by ${earthquake.felt} people.` : ''} View detailed seismic data and location.`;
  
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
  
  const date = new Date(earthquake.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* JSON-LD Structured Data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([eventSchema, articleSchema, breadcrumbSchema]),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation for SEO */}
        <nav className="mb-6" aria-label="Breadcrumb">
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
        
        {/* Back Navigation */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        
        {/* Main Card */}
        <div className="bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Magnitude Badge */}
              <div 
                className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: magnitudeColor + '20',
                  border: `2px solid ${magnitudeColor}40`
                }}
              >
                <span 
                  className="text-4xl font-bold"
                  style={{ color: magnitudeColor }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">
                  {magnitudeLabel}
                </span>
              </div>
              
              {/* Title & Location */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {locationContext.formattedLocation || earthquake.place}
                </h1>
                {locationContext.formattedLocation && (
                  <p className="text-neutral-400">{earthquake.place}</p>
                )}
                {region && (
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: region.color }}
                    />
                    <span className="text-sm text-neutral-300">{region.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-400 font-mono">
                      {region.areaCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/[0.02]">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Time</span>
              </div>
              <div className="text-sm font-medium">{formattedTime}</div>
              <div className="text-xs text-neutral-500">{formattedDate}</div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Waves className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Depth</span>
              </div>
              <div className="text-sm font-medium">{earthquake.depth.toFixed(1)} km</div>
              <div className="text-xs text-neutral-500">
                {earthquake.depth < 10 ? 'Shallow' : earthquake.depth < 30 ? 'Intermediate' : 'Deep'}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Coordinates</span>
              </div>
              <div className="text-sm font-medium font-mono">
                {earthquake.latitude.toFixed(4)}°N
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                {Math.abs(earthquake.longitude).toFixed(4)}°W
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Felt Reports</span>
              </div>
              <div className="text-sm font-medium">
                {earthquake.felt ? earthquake.felt.toLocaleString() : 'No reports'}
              </div>
              <div className="text-xs text-neutral-500">
                {earthquake.felt && earthquake.felt > 0 ? 'People reported feeling this' : 'No DYFI responses'}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 border-t border-white/10 flex flex-wrap gap-3">
            {earthquake.url && (
              <a
                href={earthquake.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on USGS
              </a>
            )}
            <a
              href={`https://www.google.com/maps?q=${earthquake.latitude},${earthquake.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              <MapPin className="w-4 h-4" />
              View on Google Maps
            </a>
          </div>
        </div>
        
        {/* Event ID */}
        <div className="mt-4 text-center text-xs text-neutral-600">
          Event ID: <code className="font-mono bg-white/5 px-2 py-1 rounded">{earthquake.id}</code>
        </div>
      </div>
    </div>
  );
}

