'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/lib/types';
import { getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDepth, formatDistance, kmToMiles, getDepthDescription } from '@/lib/units';
import {
  X,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Zap,
  Users,
  Layers,
  Activity,
  AlertTriangle,
  Share2,
  Ruler,
  Navigation,
  Globe,
  Target,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Copy,
  Check,
  MessageSquare,
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

// Social share icons as SVG components
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function NextdoorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
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
  const [copied, setCopied] = useState(false);
  
  // Handle ESC key press and lock body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Lock body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
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
  
  // Share URLs
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/earthquake/${earthquake.id}`
    : `/earthquake/${earthquake.id}`;
  const shareTitle = `M${earthquake.magnitude.toFixed(1)} Earthquake near ${earthquake.place}`;
  const shareText = `Just ${formatDistanceToNow(earthquake.time, { addSuffix: false })} ago - ${shareTitle}. Did you feel it?`;
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
  const nextdoorShareUrl = `https://nextdoor.com/share/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`;
  const smsShareUrl = `sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  
  // Copy link handler
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
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
    if (earthquake.magnitude >= 5) return { level: 'Significant', color: 'red', desc: 'Can cause damage' };
    if (earthquake.magnitude >= 4) return { level: 'Moderate', color: 'orange', desc: 'Felt widely' };
    if (earthquake.magnitude >= 3) return { level: 'Minor', color: 'yellow', desc: 'Often felt' };
    if (earthquake.magnitude >= 2) return { level: 'Micro', color: 'lime', desc: 'Rarely felt' };
    return { level: 'Trace', color: 'green', desc: 'Not felt' };
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
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/95 backdrop-blur-md animate-fade-in overscroll-contain"
      onClick={handleBackdropClick}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-4xl m-4 my-8 relative"
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
        
        {/* Share This Earthquake - Prominent Section */}
        <div className="bg-neutral-900 bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-purple-500/30 border-x border-white/10 p-5">
          {/* Main Share Button - Native Share */}
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                  });
                } catch (err) {
                  // User cancelled or error - fallback to copy
                  if ((err as Error).name !== 'AbortError') {
                    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }
              } else {
                // Fallback for browsers without Web Share API
                await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="w-full mb-4 py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 group"
          >
            <Share2 className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="text-lg font-bold text-white">Share This Earthquake</span>
            <MessageSquare className="w-5 h-5 text-white/80" />
          </button>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">Or share directly on:</p>
            
            <div className="flex items-center gap-2">
              {/* X (Twitter) */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-black hover:bg-neutral-900 rounded-lg transition-colors group"
                title="Share on X"
              >
                <XIcon className="w-4 h-4 text-white" />
              </a>
              
              {/* Facebook */}
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-[#1877F2] hover:bg-[#1864D9] rounded-lg transition-colors"
                title="Share on Facebook"
              >
                <FacebookIcon className="w-4 h-4 text-white" />
              </a>
              
              {/* Nextdoor */}
              <a
                href={nextdoorShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-[#00B246] hover:bg-[#009E3E] rounded-lg transition-colors"
                title="Share on Nextdoor"
              >
                <NextdoorIcon className="w-4 h-4 text-white" />
              </a>
              
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                }`}
                title="Copy link"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-xs font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Map Section */}
        <div className="bg-neutral-900 border-x border-white/10 p-4">
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
        <div className="bg-neutral-900 border-x border-white/10 p-4">
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
              value={formatDepth(earthquake.depth)}
              subtext={getDepthDescription(earthquake.depth)}
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
              <span 
                className="px-3 py-1.5 text-lg font-mono font-bold rounded-lg flex-shrink-0"
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
        
        {/* Community Comments Section - Prominent & Engaging */}
        <div className="bg-neutral-900 bg-gradient-to-b from-amber-500/20 to-neutral-900 border-x border-white/10 p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <MessageCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Did you feel this earthquake?</h3>
              <p className="text-sm text-neutral-400">
                Share your experience with the community! Your report helps others understand how this earthquake was felt in different areas.
              </p>
            </div>
          </div>
          <CommentThread 
            earthquakeId={earthquake.id}
            earthquakePlace={earthquake.place}
          />
        </div>
        
        {/* Nearby Earthquakes Section */}
        {nearbyEarthquakes.length > 0 && (
          <div className="bg-neutral-900 border-x border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Nearby Activity (within 15 mi / 25 km, 30 days)
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
                        <span>{formatDistance((eq as typeof eq & { distance: number }).distance)} away</span>
                        <span>•</span>
                        <span>{formatDepth(eq.depth)} deep</span>
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
          <div className="bg-neutral-900 border-x border-white/10 p-4">
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
        <div className="bg-neutral-900 border-x border-white/10 p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What This Means
          </h3>
          <div className="space-y-3 text-sm text-neutral-300">
            {earthquake.magnitude >= 4 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is considered <span className="font-medium" style={{ color: magnitudeColor }}>{magnitudeLabel.toLowerCase()}</span> and 
                would typically be felt by most people in the area. Indoor objects may shake or rattle.
                {stats.feltRadiusKm > 0 && ` It could potentially be felt up to ${kmToMiles(stats.feltRadiusKm).toFixed(0)} miles (${stats.feltRadiusKm.toFixed(0)} km) from the epicenter.`}
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
                  This was a <span className="font-medium">shallow earthquake</span> ({formatDepth(earthquake.depth)} deep), which can feel stronger 
                  at the surface than deeper earthquakes of the same magnitude.
                </p>
              </div>
            )}
            
            {nearbyEarthquakes.length >= 5 && (
              <div className="flex items-start gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-lg">
                <Activity className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <p className="text-neutral-300">
                  There have been <span className="font-medium">{nearbyEarthquakes.length} other earthquakes</span> within 15 miles (25 km) 
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
