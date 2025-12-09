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
            background: '#0a0a0a',
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

  // Truncate location text if too long
  const displayLocation = locationContext.formattedLocation || earthquake.place;
  const truncatedLocation = displayLocation.length > 45 
    ? displayLocation.substring(0, 42) + '...' 
    : displayLocation;
  
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Left side - Card content */}
        <div
          style={{
            width: 750,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 40px 48px 48px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12h4l3-9 6 18 3-9h4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>
                Bay Area Quake Tracker
              </span>
              <span style={{ color: '#666', fontSize: 13 }}>
                Live Earthquake Monitoring
              </span>
            </div>
          </div>
          
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Magnitude badge and location */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 20,
                  background: `${magnitudeColor}20`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${magnitudeColor}50`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    color: magnitudeColor,
                    lineHeight: 1,
                  }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: 4,
                  }}
                >
                  {magnitudeLabel}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ 
                  fontSize: 32, 
                  fontWeight: 600, 
                  color: '#fff', 
                  lineHeight: 1.2,
                }}>
                  {truncatedLocation}
                </span>
                {locationContext.formattedLocation && earthquake.place && (
                  <span style={{ fontSize: 16, color: '#666' }}>
                    {earthquake.place.length > 50 ? earthquake.place.substring(0, 47) + '...' : earthquake.place}
                  </span>
                )}
              </div>
            </div>
            
            {/* Details row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ color: '#999', fontSize: 16 }}>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M2 12h20" stroke="#666" strokeWidth="2" />
                </svg>
                <span style={{ color: '#999', fontSize: 16 }}>
                  Depth: {earthquake.depth.toFixed(1)} km
                </span>
              </div>
              
              {region && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: region.color,
                    }}
                  />
                  <span style={{ color: '#999', fontSize: 16 }}>{region.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: `${magnitudeColor}15`,
                border: `1px solid ${magnitudeColor}30`,
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
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#ffffff08',
                  border: '1px solid #ffffff15',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#888" strokeWidth="2" />
                  <circle cx="9" cy="7" r="4" stroke="#888" strokeWidth="2" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#888" strokeWidth="2" />
                  <path d="M16 3.13a4 4 0 010 7.75" stroke="#888" strokeWidth="2" />
                </svg>
                <span style={{ color: '#888', fontSize: 14 }}>
                  {earthquake.felt} felt reports
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Map visualization */}
        <div
          style={{
            width: 450,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 48px 48px 0',
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 20,
              background: '#111',
              border: '1px solid #222',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Map header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0d0d0d',
              }}
            >
              <span style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500 }}>
                Epicenter Location
              </span>
              <span style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>
                {earthquake.latitude.toFixed(3)}°N, {Math.abs(earthquake.longitude).toFixed(3)}°W
              </span>
            </div>
            
            {/* Map visualization with seismic waves */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: '#0d0d0d',
              }}
            >
              {/* Grid pattern - simplified for satori compatibility */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Horizontal grid lines */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={`h-${i}`}
                    style={{
                      position: 'absolute',
                      top: `${i * 12.5}%`,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: '#1a1a1a',
                    }}
                  />
                ))}
                {/* Vertical grid lines */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={`v-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${i * 12.5}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: '#1a1a1a',
                    }}
                  />
                ))}
              </div>
              
              {/* Seismic wave circles */}
              <div
                style={{
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}08`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 210,
                  height: 210,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}12`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: `1px solid ${magnitudeColor}18`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  border: `2px solid ${magnitudeColor}30`,
                  background: `${magnitudeColor}08`,
                }}
              />
              
              {/* Epicenter marker */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: magnitudeColor,
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </div>
            
            {/* Map footer */}
            <div
              style={{
                padding: '14px 18px',
                borderTop: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0d0d0d',
              }}
            >
              <span style={{ color: '#555', fontSize: 11 }}>
                Depth: {earthquake.depth.toFixed(1)} km
              </span>
              {region && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: `${region.color}15`,
                    color: region.color,
                    fontSize: 11,
                    fontWeight: 600,
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

