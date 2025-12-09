'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/lib/types';
import { getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import {
  X,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Clock,
  Zap,
  Users,
  Layers,
  Activity,
  AlertTriangle,
  Share2,
  Ruler,
  Navigation,
  Gauge,
  Timer,
  Hash,
  Globe,
  Target,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  SortAsc,
  SortDesc,
  MessageCircle,
} from 'lucide-react';
import { CommentThread } from './comment-thread';

// Dynamically import the map to avoid SSR issues
const EarthquakeDetailMap = dynamic(
  () => import('./earthquake-detail-map').then(mod => mod.EarthquakeDetailMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[250px] bg-neutral-900/50 rounded-xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    )
  }
);

// Haversine distance calculation
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface EarthquakeDetailModalProps {
  earthquake: Earthquake;
  onClose: () => void;
  breadcrumb?: string;
  allEarthquakes?: Earthquake[]; // For finding related earthquakes
}

export function EarthquakeDetailModal({ 
  earthquake, 
  onClose, 
  breadcrumb = 'Earthquakes',
  allEarthquakes = [],
}: EarthquakeDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showAllNearby, setShowAllNearby] = useState(false);
  const [showAllSimilar, setShowAllSimilar] = useState(false);
  const [sortNearbyBy, setSortNearbyBy] = useState<'distance' | 'time' | 'magnitude'>('distance');
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  const region = getRegionById(earthquake.region);
  const magnitudeColor = getMagnitudeColor(earthquake.magnitude);
  const magnitudeLabel = getMagnitudeLabel(earthquake.magnitude);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude);
  
  // Find nearby earthquakes (within 25km and 30 days)
  const nearbyEarthquakes = useMemo(() => {
    if (allEarthquakes.length === 0) return [];
    
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    return allEarthquakes
      .filter(eq => {
        if (eq.id === earthquake.id) return false;
        const distance = getDistanceKm(
          earthquake.latitude, earthquake.longitude,
          eq.latitude, eq.longitude
        );
        const timeDiff = Math.abs(earthquake.timestamp - eq.timestamp);
        return distance <= 25 && timeDiff <= thirtyDaysMs;
      })
      .map(eq => ({
        ...eq,
        distance: getDistanceKm(
          earthquake.latitude, earthquake.longitude,
          eq.latitude, eq.longitude
        ),
      }))
      .sort((a, b) => {
        switch (sortNearbyBy) {
          case 'distance': return a.distance - b.distance;
          case 'time': return Math.abs(earthquake.timestamp - a.timestamp) - Math.abs(earthquake.timestamp - b.timestamp);
          case 'magnitude': return b.magnitude - a.magnitude;
          default: return a.distance - b.distance;
        }
      });
  }, [allEarthquakes, earthquake, sortNearbyBy]);
  
  // Find similar magnitude earthquakes in the same region
  const similarEarthquakes = useMemo(() => {
    if (allEarthquakes.length === 0) return [];
    
    const magRange = 0.5;
    
    return allEarthquakes
      .filter(eq => {
        if (eq.id === earthquake.id) return false;
        if (eq.region !== earthquake.region) return false;
        return Math.abs(eq.magnitude - earthquake.magnitude) <= magRange;
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  }, [allEarthquakes, earthquake]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const regionQuakes = allEarthquakes.filter(eq => eq.region === earthquake.region);
    const largerInRegion = regionQuakes.filter(eq => eq.magnitude > earthquake.magnitude).length;
    const percentile = regionQuakes.length > 0 
      ? Math.round(((regionQuakes.length - largerInRegion) / regionQuakes.length) * 100)
      : 0;
    
    // Energy calculation (Gutenberg-Richter)
    const energyJoules = Math.pow(10, 1.5 * earthquake.magnitude + 4.8);
    const tntKg = energyJoules / 4.184e6; // Convert to kg of TNT
    
    // Estimated felt radius (rough approximation)
    const feltRadiusKm = earthquake.magnitude >= 3 
      ? Math.pow(10, 0.5 * earthquake.magnitude - 0.5) * (earthquake.depth < 20 ? 1.5 : 1)
      : 0;
    
    return {
      percentile,
      energyJoules,
      tntKg,
      feltRadiusKm,
      nearbyCount: nearbyEarthquakes.length,
      similarCount: similarEarthquakes.length,
    };
  }, [allEarthquakes, earthquake, nearbyEarthquakes.length, similarEarthquakes.length]);
  
  // Determine severity level
  const getSeverityInfo = () => {
    if (earthquake.magnitude >= 5) return { level: 'Significant', color: 'red', desc: 'Can cause damage', icon: '🔴' };
    if (earthquake.magnitude >= 4) return { level: 'Moderate', color: 'orange', desc: 'Felt widely', icon: '🟠' };
    if (earthquake.magnitude >= 3) return { level: 'Minor', color: 'yellow', desc: 'Often felt', icon: '🟡' };
    if (earthquake.magnitude >= 2) return { level: 'Micro', color: 'lime', desc: 'Rarely felt', icon: '🟢' };
    return { level: 'Trace', color: 'green', desc: 'Not felt', icon: '⚪' };
  };
  
  const severity = getSeverityInfo();
  
  // Format energy for display
  const formatEnergy = (tntKg: number): string => {
    if (tntKg >= 1e9) return `${(tntKg / 1e9).toFixed(1)} megatons TNT`;
    if (tntKg >= 1e6) return `${(tntKg / 1e6).toFixed(1)} kilotons TNT`;
    if (tntKg >= 1e3) return `${(tntKg / 1e3).toFixed(1)} tons TNT`;
    return `${tntKg.toFixed(0)} kg TNT`;
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-4xl m-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Datadog Style Breadcrumb */}
        <div className="bg-neutral-900 border border-white/10 rounded-t-2xl p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {breadcrumb}
            </button>
            <ChevronRight className="w-4 h-4" />
            {region && (
              <>
                <span className="text-neutral-300">{region.name}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-white font-medium">M{earthquake.magnitude.toFixed(1)} Earthquake</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Large Magnitude Badge */}
              <div 
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center relative"
                style={{ backgroundColor: magnitudeColor + '25' }}
              >
                <span 
                  className="text-3xl font-bold"
                  style={{ color: magnitudeColor }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-400 uppercase">{magnitudeLabel}</span>
                
                {/* Pulsing indicator for recent quakes */}
                {Date.now() - earthquake.timestamp < 3600000 && (
                  <span 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                    style={{ backgroundColor: magnitudeColor }}
                  />
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {locationContext.formattedLocation || earthquake.place}
                </h2>
                {locationContext.formattedLocation && (
                  <p className="text-sm text-neutral-400 mb-1">{earthquake.place}</p>
                )}
                <p className="text-sm text-neutral-500">
                  {format(earthquake.time, 'EEEE, MMMM d, yyyy')} at {format(earthquake.time, 'h:mm:ss a')}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {formatDistanceToNow(earthquake.time, { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Severity Banner */}
        <div 
          className={`px-4 py-3 border-x border-white/10 flex items-center justify-between`}
          style={{ 
            backgroundColor: magnitudeColor + '15',
            borderTop: `2px solid ${magnitudeColor}`
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: magnitudeColor }} />
            <span className="font-medium" style={{ color: magnitudeColor }}>{severity.level} Earthquake</span>
            <span className="text-neutral-400">—</span>
            <span className="text-neutral-400 text-sm">{severity.desc}</span>
          </div>
          <div className="flex items-center gap-3">
            {earthquake.felt && earthquake.felt > 0 && (
              <span className="px-2 py-1 rounded-full bg-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                {earthquake.felt} felt this
              </span>
            )}
            {stats.percentile >= 90 && (
              <span className="px-2 py-1 rounded-full bg-white/10 text-neutral-300 text-xs font-medium">
                Top {100 - stats.percentile}% for region
              </span>
            )}
          </div>
        </div>
        
        {/* Map Section */}
        <div className="bg-neutral-900/80 border-x border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Epicenter Location
            </h3>
            {nearbyEarthquakes.length > 0 && (
              <span className="text-xs text-neutral-500">
                Showing {Math.min(nearbyEarthquakes.length, 50)} nearby events
              </span>
            )}
          </div>
          <EarthquakeDetailMap 
            earthquake={earthquake}
            nearbyEarthquakes={nearbyEarthquakes.slice(0, 50)}
            className="h-[280px] rounded-xl overflow-hidden"
          />
        </div>
        
        {/* Key Metrics Grid - Datadog Style */}
        <div className="bg-neutral-900/80 border-x border-white/10 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Magnitude"
              value={earthquake.magnitude.toFixed(2)}
              color={magnitudeColor}
            />
            <MetricCard
              icon={<Layers className="w-4 h-4" />}
              label="Depth"
              value={`${earthquake.depth.toFixed(1)} km`}
              subtext={earthquake.depth < 10 ? 'Shallow' : earthquake.depth < 70 ? 'Intermediate' : 'Deep'}
            />
            <MetricCard
              icon={<Target className="w-4 h-4" />}
              label="Latitude"
              value={`${earthquake.latitude.toFixed(4)}°`}
            />
            <MetricCard
              icon={<Navigation className="w-4 h-4" />}
              label="Longitude"
              value={`${earthquake.longitude.toFixed(4)}°`}
            />
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              label="Significance"
              value={earthquake.significance.toString()}
              subtext="USGS Score"
            />
            <MetricCard
              icon={<Ruler className="w-4 h-4" />}
              label="Energy"
              value={formatEnergy(stats.tntKg)}
              subtext="Equivalent"
            />
          </div>
        </div>
        
        {/* Region Info */}
        {region && (
          <div className="bg-neutral-800/50 border-x border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: region.color }}
              />
              <span 
                className="px-2 py-1 text-sm font-mono rounded-md flex-shrink-0"
                style={{ 
                  backgroundColor: region.color + '20',
                  color: region.color,
                  border: `1px solid ${region.color}40`
                }}
              >
                {region.areaCode}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{region.name}</div>
                <div className="text-sm text-neutral-500">{region.county} County • {region.description}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-neutral-500">Fault Line</div>
                <div className="text-sm text-neutral-300">{region.faultLine}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Community Comments Section - Prominent Position */}
        <div className="bg-white/[0.02] border-x border-white/10 p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-neutral-400" />
            Did you feel this earthquake? Share your experience!
          </h3>
          <CommentThread 
            earthquakeId={earthquake.id}
            earthquakePlace={earthquake.place}
          />
        </div>
        
        {/* Nearby Earthquakes Section */}
        {nearbyEarthquakes.length > 0 && (
          <div className="bg-neutral-900/60 border-x border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Nearby Activity (within 25km, 30 days)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Sort by:</span>
                <select
                  value={sortNearbyBy}
                  onChange={(e) => setSortNearbyBy(e.target.value as 'distance' | 'time' | 'magnitude')}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs focus:outline-none focus:border-white/30"
                >
                  <option value="distance">Distance</option>
                  <option value="time">Time</option>
                  <option value="magnitude">Magnitude</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              {nearbyEarthquakes
                .slice(0, showAllNearby ? 20 : 5)
                .map((eq, idx) => (
                  <div 
                    key={`${eq.id}-${idx}`}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: getMagnitudeColor(eq.magnitude) + '30',
                        color: getMagnitudeColor(eq.magnitude)
                      }}
                    >
                      {eq.magnitude.toFixed(1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{eq.place}</div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span>{format(eq.time, 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{(eq as typeof eq & { distance: number }).distance.toFixed(1)} km away</span>
                        <span>•</span>
                        <span>{eq.depth.toFixed(0)} km deep</span>
                      </div>
                    </div>
                    <a
                      href={eq.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-neutral-500" />
                    </a>
                  </div>
                ))}
            </div>
            
            {nearbyEarthquakes.length > 5 && (
              <button
                onClick={() => setShowAllNearby(!showAllNearby)}
                className="mt-3 w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {showAllNearby ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show {Math.min(nearbyEarthquakes.length - 5, 15)} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Similar Earthquakes Section */}
        {similarEarthquakes.length > 0 && (
          <div className="bg-neutral-900/60 border-x border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Similar Magnitude in {region?.name || 'Region'} (±0.5)
              </h3>
              <span className="text-xs text-neutral-500">
                {similarEarthquakes.length} events found
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {similarEarthquakes
                .slice(0, showAllSimilar ? 15 : 8)
                .map((eq, idx) => (
                  <a
                    key={`similar-${eq.id}-${idx}`}
                    href={eq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg hover:bg-white/[0.06] transition-colors border border-white/5"
                    title={eq.place}
                  >
                    <span 
                      className="text-xs font-bold"
                      style={{ color: getMagnitudeColor(eq.magnitude) }}
                    >
                      M{eq.magnitude.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {format(eq.time, 'MMM yyyy')}
                    </span>
                  </a>
                ))}
            </div>
            
            {similarEarthquakes.length > 8 && (
              <button
                onClick={() => setShowAllSimilar(!showAllSimilar)}
                className="mt-3 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                {showAllSimilar ? 'Show less' : `+${similarEarthquakes.length - 8} more`}
              </button>
            )}
          </div>
        )}
        
        {/* What This Means Section */}
        <div className="bg-neutral-900/60 border-x border-white/10 p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What This Means
          </h3>
          <div className="space-y-3 text-sm text-neutral-300">
            {earthquake.magnitude >= 4 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is considered <span className="font-medium" style={{ color: magnitudeColor }}>{magnitudeLabel.toLowerCase()}</span> and 
                would typically be felt by most people in the area. Indoor objects may shake or rattle.
                {stats.feltRadiusKm > 0 && ` It could potentially be felt up to ${stats.feltRadiusKm.toFixed(0)} km from the epicenter.`}
              </p>
            ) : earthquake.magnitude >= 3 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is often felt by people indoors, especially 
                on upper floors. It may feel like a truck passing by.
              </p>
            ) : earthquake.magnitude >= 2 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is rarely felt by people but is recorded 
                by seismometers. These small earthquakes are very common.
              </p>
            ) : (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is typically not felt and is only detected 
                by sensitive instruments. Thousands of these occur daily worldwide.
              </p>
            )}
            
            {earthquake.depth < 10 && (
              <div className="flex items-start gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <p className="text-neutral-300">
                  This was a <span className="font-medium">shallow earthquake</span> ({earthquake.depth.toFixed(1)}km deep), which can feel stronger 
                  at the surface than deeper earthquakes of the same magnitude.
                </p>
              </div>
            )}
            
            {nearbyEarthquakes.length >= 5 && (
              <div className="flex items-start gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-lg">
                <Activity className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <p className="text-neutral-300">
                  There have been <span className="font-medium">{nearbyEarthquakes.length} other earthquakes</span> within 25km 
                  in the past 30 days, suggesting this may be part of a cluster or swarm event.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="bg-neutral-900 border border-white/10 rounded-b-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href={earthquake.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View on USGS
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(earthquake.url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-neutral-400 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${earthquake.latitude},${earthquake.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-neutral-400 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              <MapPin className="w-4 h-4" />
              Google Maps
            </a>
          </div>
          
          <div className="text-xs text-neutral-600 text-right">
            <div>Event ID: {earthquake.id}</div>
            <div className="text-neutral-700">Data source: USGS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  subtext,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
      <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold" style={{ color }}>{value}</div>
      {subtext && <div className="text-xs text-neutral-500">{subtext}</div>}
    </div>
  );
}
