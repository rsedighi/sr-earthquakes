import { ImageResponse } from 'next/og';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';

// Use edge runtime for faster cold starts
export const runtime = 'edge';
export const alt = 'Earthquake details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Cache OG images aggressively - earthquake data is immutable once recorded
export const revalidate = 86400; // 24 hours

interface EarthquakeBasic {
  magnitude: number;
  place: string;
  timestamp: number;
  depth: number;
}

async function getEarthquake(id: string): Promise<EarthquakeBasic | null> {
  // Fast fetch with short timeout - fail quickly if USGS is slow
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { 
        signal: controller.signal,
        cache: 'force-cache', // Use cached response if available
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const feature = await response.json();
      const depth = feature.geometry.coordinates[2];
      
      return {
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        timestamp: feature.properties.time,
        depth,
      };
    }
  } catch {
    // Fail fast
  }
  
  return null;
}

// Simple, fast OG image - optimized for speed
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const earthquake = await getEarthquake(id);
  
  // Fast fallback for missing earthquake
  if (!earthquake) {
    return new ImageResponse(
      (
        <div style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ color: '#10b981', fontSize: 64, fontWeight: 700 }}>
            Bay Tremor
          </div>
        </div>
      ),
      { ...size }
    );
  }
  
  const magnitudeColor = getMagnitudeColor(earthquake.magnitude);
  const magnitudeLabel = getMagnitudeLabel(earthquake.magnitude);
  
  const date = new Date(earthquake.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Truncate location if too long
  const location = earthquake.place.length > 40 
    ? earthquake.place.substring(0, 37) + '...' 
    : earthquake.place;
  
  // Simplified OG image - fewer elements = faster render
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 60,
        }}
      >
        {/* Left side - Magnitude */}
        <div
          style={{
            width: 280,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #333',
            paddingRight: 60,
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 800,
              color: magnitudeColor,
              lineHeight: 1,
            }}
          >
            {earthquake.magnitude.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginTop: 16,
            }}
          >
            {magnitudeLabel}
          </div>
        </div>
        
        {/* Right side - Details */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 60,
          }}
        >
          {/* Location */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {location}
          </div>
          
          {/* Date & Time */}
          <div
            style={{
              fontSize: 28,
              color: '#888',
              marginBottom: 16,
            }}
          >
            {formattedDate} at {formattedTime}
          </div>
          
          {/* Depth */}
          <div
            style={{
              fontSize: 24,
              color: '#666',
            }}
          >
            Depth: {earthquake.depth.toFixed(1)} km
          </div>
          
          {/* Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 48,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'white',
                fontWeight: 700,
              }}
            >
              ⚡
            </div>
            <div style={{ fontSize: 20, color: '#666' }}>
              baytremor.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

