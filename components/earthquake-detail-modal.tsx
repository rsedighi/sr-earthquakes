'use client';

import { useEffect, useCallback, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Earthquake } from '@/lib/types';
import { getRegionById } from '@/lib/regions';
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
  Ruler
} from 'lucide-react';

interface EarthquakeDetailModalProps {
  earthquake: Earthquake;
  onClose: () => void;
  breadcrumb?: string;
}

export function EarthquakeDetailModal({ earthquake, onClose, breadcrumb = 'Earthquakes' }: EarthquakeDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
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
  
  // Determine severity level
  const getSeverityInfo = () => {
    if (earthquake.magnitude >= 5) return { level: 'Significant', color: 'red', desc: 'Can cause damage' };
    if (earthquake.magnitude >= 4) return { level: 'Moderate', color: 'orange', desc: 'Felt widely' };
    if (earthquake.magnitude >= 3) return { level: 'Minor', color: 'yellow', desc: 'Often felt' };
    if (earthquake.magnitude >= 2) return { level: 'Micro', color: 'lime', desc: 'Rarely felt' };
    return { level: 'Trace', color: 'green', desc: 'Not felt' };
  };
  
  const severity = getSeverityInfo();
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl m-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Breadcrumb Style */}
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
            <span className="text-white font-medium">Earthquake Detail</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Large Magnitude Badge */}
              <div 
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                style={{ backgroundColor: magnitudeColor + '25' }}
              >
                <span 
                  className="text-3xl font-bold"
                  style={{ color: magnitudeColor }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-400 uppercase">{magnitudeLabel}</span>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-1">{earthquake.place}</h2>
                <p className="text-sm text-neutral-500">
                  {format(earthquake.time, 'PPP')} at {format(earthquake.time, 'p')}
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
          {earthquake.felt && earthquake.felt > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {earthquake.felt} people felt this
            </span>
          )}
        </div>
        
        {/* Details Grid */}
        <div className="bg-neutral-900/80 border-x border-white/10 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailCard
              icon={<Zap className="w-4 h-4" />}
              label="Magnitude"
              value={earthquake.magnitude.toFixed(2)}
              color={magnitudeColor}
            />
            <DetailCard
              icon={<Layers className="w-4 h-4" />}
              label="Depth"
              value={`${earthquake.depth.toFixed(1)} km`}
              subtext={earthquake.depth < 10 ? 'Shallow' : earthquake.depth < 70 ? 'Intermediate' : 'Deep'}
            />
            <DetailCard
              icon={<MapPin className="w-4 h-4" />}
              label="Coordinates"
              value={`${earthquake.latitude.toFixed(3)}°`}
              subtext={`${earthquake.longitude.toFixed(3)}°`}
            />
            <DetailCard
              icon={<Activity className="w-4 h-4" />}
              label="Significance"
              value={earthquake.significance.toString()}
              subtext="USGS Score"
            />
          </div>
        </div>
        
        {/* Region Info */}
        {region && (
          <div className="bg-neutral-800/50 border-x border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              <div className="flex-1">
                <div className="font-medium">{region.name}</div>
                <div className="text-sm text-neutral-500">{region.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Fault Line</div>
                <div className="text-sm text-neutral-300">{region.faultLine}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* What This Means Section */}
        <div className="bg-neutral-900/60 border-x border-white/10 p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">What This Means</h3>
          <div className="space-y-2 text-sm text-neutral-300">
            {earthquake.magnitude >= 4 ? (
              <p>
                A magnitude {earthquake.magnitude.toFixed(1)} earthquake is considered {magnitudeLabel.toLowerCase()} and 
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
              <p className="text-amber-400/80">
                ⚠️ This was a shallow earthquake ({earthquake.depth.toFixed(1)}km deep), which can feel stronger 
                at the surface than deeper earthquakes of the same magnitude.
              </p>
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
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
          </div>
          
          <div className="text-xs text-neutral-600">
            Event ID: {earthquake.id}
          </div>
        </div>
      </div>
    </div>
  );
}

// Detail Card Component
function DetailCard({ 
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

