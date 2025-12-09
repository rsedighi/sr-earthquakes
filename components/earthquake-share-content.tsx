'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ArrowLeft,
  Clock, 
  MapPin, 
  Activity, 
  ExternalLink, 
  Waves,
  AlertTriangle,
  Zap,
  Layers,
  Target,
  Navigation,
  Ruler,
  Users,
  MessageCircle,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Info,
  ChevronRight,
  Loader2,
  Globe,
} from 'lucide-react';
import { CommentThread } from './comment-thread';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getRegionById, getLocationContext } from '@/lib/regions';

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

interface EarthquakeData {
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

interface EarthquakeShareContentProps {
  earthquake: EarthquakeData;
}

export function EarthquakeShareContent({ earthquake }: EarthquakeShareContentProps) {
  const [copied, setCopied] = useState(false);
  
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
  
  // Energy calculation (Gutenberg-Richter)
  const energyJoules = Math.pow(10, 1.5 * earthquake.magnitude + 4.8);
  const tntKg = energyJoules / 4.184e6;
  
  // Format energy for display
  const formatEnergy = (tntKg: number): string => {
    if (tntKg >= 1e9) return `${(tntKg / 1e9).toFixed(1)} megatons TNT`;
    if (tntKg >= 1e6) return `${(tntKg / 1e6).toFixed(1)} kilotons TNT`;
    if (tntKg >= 1e3) return `${(tntKg / 1e3).toFixed(1)} tons TNT`;
    return `${tntKg.toFixed(0)} kg TNT`;
  };
  
  // Determine severity level
  const getSeverityInfo = () => {
    if (earthquake.magnitude >= 5) return { level: 'Significant', color: 'red', desc: 'Can cause damage' };
    if (earthquake.magnitude >= 4) return { level: 'Moderate', color: 'orange', desc: 'Felt widely' };
    if (earthquake.magnitude >= 3) return { level: 'Minor', color: 'yellow', desc: 'Often felt' };
    if (earthquake.magnitude >= 2) return { level: 'Micro', color: 'lime', desc: 'Rarely felt' };
    return { level: 'Trace', color: 'green', desc: 'Not felt' };
  };
  
  const severity = getSeverityInfo();

  const formattedDate = format(earthquake.time, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(earthquake.time, 'h:mm:ss a');
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Card */}
      <div className="bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Magnitude Badge */}
            <div 
              className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative"
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
              {/* Pulsing indicator for recent quakes */}
              {Date.now() - earthquake.timestamp < 3600000 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                  style={{ backgroundColor: magnitudeColor }}
                />
              )}
            </div>
            
            {/* Title & Location */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                {locationContext.formattedLocation || earthquake.place}
              </h1>
              {locationContext.formattedLocation && (
                <p className="text-neutral-400">{earthquake.place}</p>
              )}
              <p className="text-sm text-neutral-500 mt-1">
                {formattedDate} at {formattedTime}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {formatDistanceToNow(earthquake.time, { addSuffix: true })}
              </p>
              {region && (
                <div className="flex items-center gap-2 mt-3">
                  <span 
                    className="font-mono font-bold px-2 py-0.5 rounded text-sm"
                    style={{ 
                      backgroundColor: region.color + '20',
                      color: region.color,
                      border: `1px solid ${region.color}40`
                    }}
                  >
                    {region.areaCode}
                  </span>
                  <span className="text-sm text-neutral-300">{region.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Severity Banner */}
        <div 
          className="px-6 py-3 flex items-center justify-between"
          style={{ 
            backgroundColor: magnitudeColor + '15',
            borderBottom: `1px solid ${magnitudeColor}30`
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
          </div>
        </div>
        
        {/* PROMINENT CALL TO ACTION - Did You Feel It? */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <MessageCircle className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Did you feel this earthquake?</h2>
              <p className="text-neutral-300 mb-1">
                Share your experience with the community! Your report helps others understand how this earthquake was felt in different areas.
              </p>
              <p className="text-sm text-neutral-500">
                Scroll down to add your report or check out what others experienced.
              </p>
            </div>
          </div>
        </div>
        
        {/* Share This Earthquake */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-neutral-300" />
              <div>
                <h3 className="text-sm font-medium text-white">Share this earthquake</h3>
                <p className="text-xs text-neutral-400">Let your neighbors know about this event</p>
              </div>
            </div>
            
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
              
              {/* Message/SMS */}
              <a
                href={smsShareUrl}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                title="Send as message"
              >
                <MessageSquare className="w-4 h-4 text-white" />
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
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Epicenter Location
            </h3>
          </div>
          <EarthquakeDetailMap 
            earthquake={{
              ...earthquake,
              time: new Date(earthquake.timestamp),
              url: earthquake.url || '',
            }}
            nearbyEarthquakes={[]}
            className="h-[280px] rounded-xl overflow-hidden"
          />
        </div>
        
        {/* Key Metrics Grid */}
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
              value={formatEnergy(tntKg)}
              subtext="Equivalent"
            />
          </div>
        </div>
        
        {/* Region Info */}
        {region && (
          <div className="bg-neutral-800/50 border-b border-white/10 p-4">
            <div className="flex items-center gap-3 flex-wrap">
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
        
        {/* Community Comments Section - PROMINENT */}
        <div className="bg-gradient-to-b from-amber-500/10 to-neutral-900 p-6" id="comments">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <MessageCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Community Reports</h3>
              <p className="text-sm text-neutral-400">
                Share your experience! Tell us where you were and what you felt. Your report helps others understand the impact of this earthquake.
              </p>
            </div>
          </div>
          <CommentThread 
            earthquakeId={earthquake.id}
            earthquakePlace={earthquake.place}
          />
        </div>
        
        {/* What This Means Section */}
        <div className="p-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What This Means
          </h3>
          <div className="space-y-3 text-sm text-neutral-300">
            {earthquake.magnitude >= 4 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is considered <span className="font-medium" style={{ color: magnitudeColor }}>{magnitudeLabel.toLowerCase()}</span> and 
                would typically be felt by most people in the area. Indoor objects may shake or rattle.
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
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {earthquake.url && (
              <a
                href={earthquake.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View on USGS
              </a>
            )}
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
      
      {/* Explore More CTA */}
      <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Want to see more earthquakes?</h3>
            <p className="text-sm text-neutral-400">
              Explore the live earthquake map and track all recent seismic activity in the Bay Area.
            </p>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
          >
            Explore Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
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

