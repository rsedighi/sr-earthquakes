'use client';

import { useEffect, useRef, useState } from 'react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getRegionById } from '@/lib/regions';
import { formatDistanceToNow } from 'date-fns';

// We'll use a simple SVG-based map since Leaflet requires window object
// This provides a clean, fast alternative that works with SSR

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
  onSelectEarthquake?: (eq: Earthquake | null) => void;
  className?: string;
}

// Map bounds for Northern California
const MAP_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -122.8,
  maxLon: -121.3,
};

// Convert lat/lon to SVG coordinates
function latLonToSvg(lat: number, lon: number, width: number, height: number) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

// Get magnitude size - exponential scaling for better visual distinction
function getMagnitudeSize(magnitude: number): number {
  // More aggressive scaling: M5+ are much larger than M1-2
  if (magnitude >= 5) return 30;
  if (magnitude >= 4) return 22;
  if (magnitude >= 3) return 16;
  if (magnitude >= 2) return 11;
  if (magnitude >= 1) return 7;
  return 5;
}

export function EarthquakeMap({ 
  earthquakes, 
  selectedEarthquake,
  onSelectEarthquake,
  className = ''
}: EarthquakeMapProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredQuake, setHoveredQuake] = useState<Earthquake | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.min(500, width * 0.6) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { width, height } = dimensions;

  // Sort earthquakes by magnitude so smaller ones render on top
  const sortedQuakes = [...earthquakes].sort((a, b) => b.magnitude - a.magnitude);

  // Major cities for reference
  const cities = [
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'Oakland', lat: 37.8044, lon: -122.2712 },
    { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
    { name: 'San Ramon', lat: 37.7799, lon: -121.9780 },
    { name: 'Berkeley', lat: 37.8716, lon: -122.2727 },
    { name: 'Fremont', lat: 37.5485, lon: -121.9886 },
  ];

  const displayQuake = hoveredQuake || selectedEarthquake;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-neutral-900/50 rounded-xl overflow-hidden"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width={width} height={height} fill="url(#mapGradient)" />
        
        {/* Grid lines */}
        {[...Array(10)].map((_, i) => (
          <g key={i}>
            <line
              x1={width * (i / 10)}
              y1={0}
              x2={width * (i / 10)}
              y2={height}
              stroke="white"
              strokeOpacity="0.03"
              strokeWidth="1"
            />
            <line
              x1={0}
              y1={height * (i / 10)}
              x2={width}
              y2={height * (i / 10)}
              stroke="white"
              strokeOpacity="0.03"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Cities */}
        {cities.map(city => {
          const { x, y } = latLonToSvg(city.lat, city.lon, width, height);
          if (x < 0 || x > width || y < 0 || y > height) return null;
          return (
            <g key={city.name}>
              <circle cx={x} cy={y} r="3" fill="white" fillOpacity="0.4" />
              <text
                x={x}
                y={y - 8}
                fontSize="10"
                fill="white"
                fillOpacity="0.5"
                textAnchor="middle"
                fontFamily="system-ui"
              >
                {city.name}
              </text>
            </g>
          );
        })}

        {/* Earthquake markers */}
        {sortedQuakes.map((eq, index) => {
          const { x, y } = latLonToSvg(eq.latitude, eq.longitude, width, height);
          if (x < 0 || x > width || y < 0 || y > height) return null;
          
          const size = getMagnitudeSize(eq.magnitude);
          const color = getMagnitudeColor(eq.magnitude);
          const isSelected = selectedEarthquake?.id === eq.id;
          const isHovered = hoveredQuake?.id === eq.id;
          const isRecent = Date.now() - eq.timestamp < 24 * 60 * 60 * 1000;
          
          return (
            <g 
              key={`${eq.id}-${index}`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredQuake(eq)}
              onMouseLeave={() => setHoveredQuake(null)}
              onClick={() => onSelectEarthquake?.(isSelected ? null : eq)}
            >
              {/* Pulse animation for recent earthquakes */}
              {isRecent && (
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />
              )}
              
              {/* Main marker */}
              <circle
                cx={x}
                cy={y}
                r={isSelected || isHovered ? size * 1.3 : size}
                fill={color}
                fillOpacity={isSelected || isHovered ? 0.9 : 0.6}
                stroke={isSelected ? 'white' : color}
                strokeWidth={isSelected ? 2 : 1}
                strokeOpacity={isSelected || isHovered ? 1 : 0.8}
                filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                style={{ 
                  transition: 'all 0.2s ease-out',
                  animationDelay: `${index * 10}ms`
                }}
              />
              
              {/* Magnitude label for larger quakes */}
              {eq.magnitude >= 2.5 && (
                <text
                  x={x}
                  y={y + 4}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="600"
                  fontFamily="system-ui"
                  style={{ pointerEvents: 'none' }}
                >
                  {eq.magnitude.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="text-neutral-400 mb-2 font-medium">Magnitude</div>
        <div className="flex items-center gap-4">
          {[
            { mag: 2, label: 'Minor' },
            { mag: 3, label: 'Moderate' },
            { mag: 4, label: 'Strong' },
            { mag: 5, label: 'Major' },
          ].map(({ mag }) => (
            <div key={mag} className="flex flex-col items-center gap-1">
              <div 
                className="rounded-full"
                style={{
                  width: getMagnitudeSize(mag) * 0.7,
                  height: getMagnitudeSize(mag) * 0.7,
                  backgroundColor: getMagnitudeColor(mag),
                }}
              />
              <span className="text-neutral-500 text-[10px]">{mag}+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {displayQuake && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 max-w-xs animate-fade-in">
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: getMagnitudeColor(displayQuake.magnitude) }}
            >
              {displayQuake.magnitude.toFixed(1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{displayQuake.place}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {formatDistanceToNow(displayQuake.time, { addSuffix: true })}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {displayQuake.depth.toFixed(1)} km deep • {getMagnitudeLabel(displayQuake.magnitude)}
              </div>
              {displayQuake.felt && displayQuake.felt > 0 && (
                <div className="text-xs text-amber-400 mt-1">
                  {displayQuake.felt} people felt this
                </div>
              )}
            </div>
          </div>
          <a 
            href={displayQuake.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View on USGS →
          </a>
        </div>
      )}

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="text-xs text-neutral-400">
          <span className="text-white font-medium">{earthquakes.length}</span> earthquakes shown
        </div>
      </div>
    </div>
  );
}

