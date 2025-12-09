'use client';

import { useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Earthquake } from '@/lib/types';
import { getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import {
  X,
  Clock,
  MapPin,
  Zap,
  Activity,
  ExternalLink,
  Waves,
  Users,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface EarthquakeDetailModalProps {
  earthquake: Earthquake;
  onClose: () => void;
  breadcrumb?: string;
  allEarthquakes?: Earthquake[];
}

export function EarthquakeDetailModal({ 
  earthquake, 
  onClose, 
  breadcrumb = 'Earthquakes',
}: EarthquakeDetailModalProps) {
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude);
  const magnitudeColor = getMagnitudeColor(earthquake.magnitude);
  const magnitudeLabel = getMagnitudeLabel(earthquake.magnitude);
  
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
  
  const formattedDate = format(earthquake.time, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(earthquake.time, 'h:mm:ss a');
  const relativeTime = formatDistanceToNow(earthquake.time, { addSuffix: true });
  
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Breadcrumb */}
        <div className="p-4 border-b border-white/10 bg-neutral-900">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {breadcrumb}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">M{earthquake.magnitude.toFixed(1)} Event</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Magnitude Badge */}
              <div 
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: magnitudeColor + '20',
                  border: `2px solid ${magnitudeColor}40`
                }}
              >
                <span 
                  className="text-2xl font-bold leading-none"
                  style={{ color: magnitudeColor }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  {magnitudeLabel}
                </span>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold">
                  {locationContext.formattedLocation || earthquake.place}
                </h2>
                {locationContext.formattedLocation && (
                  <p className="text-sm text-neutral-400">{earthquake.place}</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.02]">
          <div className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Time</span>
            </div>
            <div className="text-sm font-medium">{formattedTime}</div>
            <div className="text-xs text-neutral-500">{formattedDate}</div>
            <div className="text-xs text-neutral-600 mt-1">{relativeTime}</div>
          </div>
          
          <div className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Waves className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Depth</span>
            </div>
            <div className="text-sm font-medium">{earthquake.depth.toFixed(1)} km</div>
            <div className="text-xs text-neutral-500">
              {earthquake.depth < 10 ? 'Shallow' : earthquake.depth < 30 ? 'Intermediate' : 'Deep'}
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Coordinates</span>
            </div>
            <div className="text-sm font-medium font-mono">
              {earthquake.latitude.toFixed(4)}°N
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {Math.abs(earthquake.longitude).toFixed(4)}°W
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Felt Reports</span>
            </div>
            <div className="text-sm font-medium">
              {earthquake.felt ? earthquake.felt.toLocaleString() : 'No reports'}
            </div>
            <div className="text-xs text-neutral-500">
              {earthquake.felt && earthquake.felt > 0 ? 'DYFI responses' : 'No DYFI responses'}
            </div>
          </div>
        </div>
        
        {/* Region Info */}
        {region && (
          <div className="px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              <span className="text-sm">{region.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-400 font-mono">
                {region.areaCode}
              </span>
              <span className="text-xs text-neutral-500 ml-auto">{region.faultLine}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex flex-wrap gap-2">
          {earthquake.url && (
            <a
              href={earthquake.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View on USGS
            </a>
          )}
          <a
            href={`https://www.google.com/maps?q=${earthquake.latitude},${earthquake.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            <MapPin className="w-4 h-4" />
            Google Maps
          </a>
          <a
            href={`/earthquake/${earthquake.id}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm ml-auto"
          >
            <Activity className="w-4 h-4" />
            Full Details
          </a>
        </div>
        
        {/* Event ID Footer */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 text-center">
          <span className="text-[10px] text-neutral-600">
            Event ID: <code className="font-mono">{earthquake.id}</code>
          </span>
        </div>
      </div>
    </div>
  );
}
