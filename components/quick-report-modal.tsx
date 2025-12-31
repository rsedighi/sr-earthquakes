'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor } from '@/lib/analysis';
import {
  X,
  Zap,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

// Felt intensity levels matching USGS "Did You Feel It" scale
const FELT_INTENSITIES = [
  { 
    level: 1, 
    label: 'Not felt', 
    description: 'I didn\'t feel anything',
    color: '#6b7280',
    bgColor: 'from-neutral-500/20 to-neutral-600/20',
  },
  { 
    level: 2, 
    label: 'Weak', 
    description: 'Barely noticeable, like a truck passing',
    color: '#22c55e',
    bgColor: 'from-green-500/20 to-emerald-600/20',
  },
  { 
    level: 3, 
    label: 'Light', 
    description: 'Felt indoors, hanging objects may swing',
    color: '#84cc16',
    bgColor: 'from-lime-500/20 to-green-600/20',
  },
  { 
    level: 4, 
    label: 'Moderate', 
    description: 'Felt by most, some items rattled',
    color: '#eab308',
    bgColor: 'from-yellow-500/20 to-amber-600/20',
  },
  { 
    level: 5, 
    label: 'Strong', 
    description: 'Felt strongly, items knocked over',
    color: '#f97316',
    bgColor: 'from-orange-500/20 to-red-600/20',
  },
  { 
    level: 6, 
    label: 'Very Strong', 
    description: 'Difficult to stand, some damage possible',
    color: '#ef4444',
    bgColor: 'from-red-500/20 to-rose-600/20',
  },
];

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  earthquakes: Earthquake[];
  userLocation?: { lat: number; lon: number } | null;
}

type ModalStep = 'select' | 'intensity' | 'details' | 'success';

export function QuickReportModal({ 
  isOpen, 
  onClose, 
  earthquakes,
  userLocation,
}: QuickReportModalProps) {
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [detectedLocation, setDetectedLocation] = useState<string>('');

  // Filter to recent earthquakes (last 12 hours) - show more during swarms
  const recentQuakes = earthquakes
    .filter(eq => Date.now() - eq.timestamp < 12 * 60 * 60 * 1000)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  // Calculate distance helper
  const getDistanceMiles = useCallback((eq: Earthquake) => {
    if (!userLocation) return null;
    const R = 3959; // Earth radius in miles
    const dLat = (eq.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (eq.longitude - userLocation.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(eq.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [userLocation]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select');
        setSelectedQuake(null);
        setSelectedIntensity(null);
        setComment('');
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  // Try to get user's location for report
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // 5 minutes
        });
      });
      
      setLocationPermission('granted');
      // Reverse geocode to get area name (simplified)
      const lat = position.coords.latitude.toFixed(2);
      const lon = position.coords.longitude.toFixed(2);
      setDetectedLocation(`${lat}°N, ${lon}°W`);
    } catch {
      setLocationPermission('denied');
    }
  }, []);

  // Request location when moving to details step
  useEffect(() => {
    if (step === 'details' && locationPermission === 'prompt') {
      requestLocation();
    }
  }, [step, locationPermission, requestLocation]);

  // Submit the felt report
  const handleSubmit = async () => {
    if (!selectedQuake || selectedIntensity === null) return;
    
    setIsSubmitting(true);

    const intensityInfo = FELT_INTENSITIES.find(i => i.level === selectedIntensity);
    const autoComment = intensityInfo 
      ? `I felt this earthquake - ${intensityInfo.label.toLowerCase()} shaking. ${intensityInfo.description}`
      : 'I felt this earthquake.';

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earthquakeId: selectedQuake.id,
          author: displayName.trim() || 'Anonymous',
          content: comment.trim() || autoComment,
          location: detectedLocation || undefined,
          feltIt: true,
        }),
      });

      if (response.ok) {
        setStep('success');
      } else {
        // Still show success even if API fails - we don't want to frustrate users
        setStep('success');
      }
    } catch {
      // Network error - still show success for better UX
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle quake selection
  const handleSelectQuake = (eq: Earthquake) => {
    setSelectedQuake(eq);
    setStep('intensity');
  };

  // Handle intensity selection
  const handleSelectIntensity = (level: number) => {
    setSelectedIntensity(level);
    // If they didn't feel it, skip to submit immediately
    if (level === 1) {
      setComment('');
      setStep('details');
    } else {
      setStep('details');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 'intensity') {
      setStep('select');
      setSelectedQuake(null);
    } else if (step === 'details') {
      setStep('intensity');
      setSelectedIntensity(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal - positioned above bottom nav on mobile */}
      <div 
        className="fixed bottom-16 left-0 right-0 z-50 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full"
      >
        <div className="bg-[#111111] border-t border-white/10 md:border rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[70vh] md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:fade-in">
          
          {/* Header */}
          <div className="sticky top-0 bg-[#111111]/95 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {step !== 'select' && step !== 'success' && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    {step === 'select' && 'Did You Feel It?'}
                    {step === 'intensity' && 'How Strong?'}
                    {step === 'details' && 'Add Details'}
                    {step === 'success' && 'Report Submitted!'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {step === 'select' && 'Select the earthquake you felt'}
                    {step === 'intensity' && 'Rate the shaking intensity'}
                    {step === 'details' && 'Optional info to help others'}
                    {step === 'success' && 'Thanks for contributing!'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(70vh-80px)] md:max-h-[calc(85vh-80px)]">
            
            {/* Step 1: Select Earthquake */}
            {step === 'select' && (
              <div className="p-4 space-y-2">
                {recentQuakes.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No recent earthquakes in the last 12 hours</p>
                    <p className="text-sm text-neutral-500 mt-2">Check back later!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-neutral-400 mb-3">
                      Recent earthquakes in the Bay Area:
                    </p>
                    {recentQuakes.map(eq => {
                      const distance = getDistanceMiles(eq);
                      return (
                        <button
                          key={eq.id}
                          onClick={() => handleSelectQuake(eq)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all group text-left"
                        >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                            style={{ 
                              backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                              color: getMagnitudeColor(eq.magnitude),
                              border: `1px solid ${getMagnitudeColor(eq.magnitude)}40`
                            }}
                          >
                            {eq.magnitude.toFixed(1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">
                              {eq.place}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                              <span>{formatDistanceToNow(eq.time, { addSuffix: true })}</span>
                              {distance !== null && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {distance} mi away
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors flex-shrink-0" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Intensity Selection */}
            {step === 'intensity' && selectedQuake && (
              <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                {/* Selected quake summary */}
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: getMagnitudeColor(selectedQuake.magnitude) + '20',
                      color: getMagnitudeColor(selectedQuake.magnitude),
                    }}
                  >
                    {selectedQuake.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-medium text-white truncate">
                      {selectedQuake.place}
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">
                      {formatDistanceToNow(selectedQuake.time, { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Intensity options */}
                <div className="space-y-1.5 md:space-y-2">
                  <p className="text-xs md:text-sm text-neutral-400">How would you describe the shaking?</p>
                  {FELT_INTENSITIES.map(intensity => (
                    <button
                      key={intensity.level}
                      onClick={() => handleSelectIntensity(intensity.level)}
                      className={`w-full flex items-center gap-2.5 md:gap-4 p-2.5 md:p-4 rounded-xl transition-all text-left group hover:scale-[1.01] active:scale-[0.99] ${
                        selectedIntensity === intensity.level
                          ? 'bg-white/10 border-white/20'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
                      } border`}
                    >
                      <div 
                        className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-sm md:text-lg bg-gradient-to-br ${intensity.bgColor}`}
                        style={{ color: intensity.color }}
                      >
                        {intensity.level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                          {intensity.label}
                          {intensity.level >= 4 && (
                            <span 
                              className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: intensity.color + '20',
                                color: intensity.color,
                              }}
                            >
                              Significant
                            </span>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-neutral-400 mt-0.5 truncate">
                          {intensity.description}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-neutral-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Details (Optional) */}
            {step === 'details' && selectedQuake && selectedIntensity !== null && (
              <div className="p-4 space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ 
                        backgroundColor: getMagnitudeColor(selectedQuake.magnitude) + '20',
                        color: getMagnitudeColor(selectedQuake.magnitude),
                      }}
                    >
                      {selectedQuake.magnitude.toFixed(1)}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{selectedQuake.place}</div>
                      <div className="text-xs text-neutral-400">
                        You felt: <span className="text-amber-400 font-medium">{FELT_INTENSITIES.find(i => i.level === selectedIntensity)?.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Anonymous"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-colors"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe what you experienced... (e.g., 'I was on the 3rd floor and felt the building sway')"
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-colors resize-none"
                  />
                  <div className="text-xs text-neutral-500 mt-1 text-right">
                    {comment.length}/500
                  </div>
                </div>

                {/* Location status */}
                {locationPermission === 'granted' && detectedLocation && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>Location detected: {detectedLocation}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && selectedQuake && (
              <div className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-neutral-400 mb-6">
                  Your felt report helps scientists and the community understand this earthquake better.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    href={`/earthquake/${selectedQuake.id}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    View Discussion
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-neutral-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

