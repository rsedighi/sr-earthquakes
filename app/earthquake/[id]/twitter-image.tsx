import { ImageResponse } from 'next/og';
import { getRegionForCoordinates, getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const alt = 'Earthquake details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

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
  region: string;
}

async function getEarthquake(id: string): Promise<Earthquake | null> {
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
        region: getRegionForCoordinates(latitude, longitude),
      };
    }
  } catch {
    // Continue to local search
  }
  
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

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const earthquake = await getEarthquake(id);
  
  if (!earthquake) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ color: '#666', fontSize: 48 }}>Earthquake Not Found</div>
        </div>
      ),
      { ...size }
    );
  }
  
  const magnitudeColor = getMagnitudeColor(earthquake.magnitude);
  const magnitudeLabel = getMagnitudeLabel(earthquake.magnitude);
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude);
  
  const date = new Date(earthquake.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 48,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Left side - Card content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 48,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12h4l3-9 6 18 3-9h4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
                Bay Area Quake Tracker
              </span>
              <span style={{ color: '#666', fontSize: 14 }}>
                Live Earthquake Monitoring
              </span>
            </div>
          </div>
          
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 24,
                  background: `${magnitudeColor}25`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${magnitudeColor}40`,
                }}
              >
                <span
                  style={{
                    fontSize: 72,
                    fontWeight: 700,
                    color: magnitudeColor,
                    lineHeight: 1,
                  }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {magnitudeLabel}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                  {locationContext.formattedLocation || earthquake.place}
                </span>
                {locationContext.formattedLocation && (
                  <span style={{ fontSize: 18, color: '#666' }}>
                    {earthquake.place}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ color: '#999', fontSize: 18 }}>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M2 12h20" stroke="#666" strokeWidth="2" />
                </svg>
                <span style={{ color: '#999', fontSize: 18 }}>
                  Depth: {earthquake.depth.toFixed(1)} km
                </span>
              </div>
              
              {region && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: region.color,
                    }}
                  />
                  <span style={{ color: '#999', fontSize: 18 }}>{region.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: `${magnitudeColor}20`,
                border: `1px solid ${magnitudeColor}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke={magnitudeColor}
                  strokeWidth="2"
                />
                <line x1="12" y1="9" x2="12" y2="13" stroke={magnitudeColor} strokeWidth="2" />
                <line x1="12" y1="17" x2="12.01" y2="17" stroke={magnitudeColor} strokeWidth="2" />
              </svg>
              <span style={{ color: magnitudeColor, fontSize: 14, fontWeight: 500 }}>
                {earthquake.magnitude >= 5
                  ? 'Significant Event'
                  : earthquake.magnitude >= 4
                  ? 'Moderate Event'
                  : earthquake.magnitude >= 3
                  ? 'Minor Event'
                  : 'Micro Event'}
              </span>
            </div>
            
            {earthquake.felt && earthquake.felt > 0 && (
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#ffffff10',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    stroke="#888"
                    strokeWidth="2"
                  />
                  <circle cx="9" cy="7" r="4" stroke="#888" strokeWidth="2" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#888" strokeWidth="2" />
                  <path d="M16 3.13a4 4 0 010 7.75" stroke="#888" strokeWidth="2" />
                </svg>
                <span style={{ color: '#888', fontSize: 14 }}>
                  {earthquake.felt} people felt this
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Mini map visualization */}
        <div
          style={{
            width: 400,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 24,
              background: '#1a1a1a',
              border: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Epicenter Location
              </span>
              <span style={{ color: '#444', fontSize: 11 }}>
                {earthquake.latitude.toFixed(3)}°N, {Math.abs(earthquake.longitude).toFixed(3)}°W
              </span>
            </div>
            
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: `
                  radial-gradient(circle at center, #1a1a1a 0%, #0f0f0f 100%),
                  repeating-linear-gradient(0deg, transparent, transparent 29px, #222 30px),
                  repeating-linear-gradient(90deg, transparent, transparent 29px, #222 30px)
                `,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}10`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}15`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}25`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: `2px solid ${magnitudeColor}40`,
                  background: `${magnitudeColor}10`,
                }}
              />
              
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: magnitudeColor,
                  boxShadow: `0 0 40px ${magnitudeColor}80, 0 0 80px ${magnitudeColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                }}
              />
              
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: 1,
                  background: `linear-gradient(90deg, transparent 0%, ${magnitudeColor}30 50%, transparent 100%)`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 1,
                  height: '100%',
                  background: `linear-gradient(180deg, transparent 0%, ${magnitudeColor}30 50%, transparent 100%)`,
                }}
              />
            </div>
            
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#444', fontSize: 11 }}>
                Depth: {earthquake.depth.toFixed(1)} km
              </span>
              {region && (
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: `${region.color}20`,
                    color: region.color,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {region.areaCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

