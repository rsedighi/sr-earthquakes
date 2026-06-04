'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  MapPin,
  House,
  X,
  Loader2,
  Activity,
  Globe,
  ChevronRight,
} from 'lucide-react';

import type { Earthquake } from '@/lib/types';
import { getLocationContext } from '@/lib/regions';
import { getMagnitudeColor } from '@/lib/analysis';
import { useUnits } from '@/lib/unit-context';

const ONBOARDING_STEPS = [
  {
    icon: Activity,
    iconGradient: 'from-blue-500/20 to-cyan-500/20',
    iconBorder: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    title: 'Welcome to Bay Tremor',
    subtitle: 'Real-time Bay Area earthquake monitoring',
    body: 'Track every Bay Area earthquake as it happens. A live map, detailed stats, and community reports — all in one place, updated continuously.',
  },
  {
    icon: Globe,
    iconGradient: 'from-green-500/20 to-emerald-500/20',
    iconBorder: 'border-green-500/30',
    iconColor: 'text-green-400',
    title: 'Explore the Live Map',
    subtitle: 'Color-coded by magnitude',
    body: 'Each dot on the map is an earthquake, color-coded from green (minor) to red (significant). Tap any dot or feed item to see depth, felt reports, and nearby activity.',
  },
  {
    icon: House,
    iconGradient: 'from-purple-500/20 to-violet-500/20',
    iconBorder: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    title: 'Personalize for Your City',
    subtitle: 'Get local stats and distances',
    body: 'Set your city to see how many earthquakes happened near you this week, distances to each event, and whether seismic activity in your area is elevated.',
  },
] as const;

export function FirstVisitPrompt({
  onSetCity,
  onDismiss,
}: {
  onSetCity: () => void;
  onDismiss: () => void;
}) {
  const [step, setStep] = useState(0);

  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        {/* Progress + close */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-white' : i < step ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/15'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-neutral-500 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.iconGradient} border ${current.iconBorder} flex items-center justify-center mb-4`}
        >
          <Icon className={`w-8 h-8 ${current.iconColor}`} />
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-white mb-1">{current.title}</h2>
        <p className="text-sm text-neutral-400 mb-3">{current.subtitle}</p>
        <p className="text-sm text-neutral-300 leading-relaxed mb-6">{current.body}</p>

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          {isLast ? (
            <>
              <button
                onClick={onSetCity}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Set My City
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-colors"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[10px] text-neutral-600 text-center mt-4">
          Step {step + 1} of {ONBOARDING_STEPS.length} · Your location is stored locally and never shared.
        </p>
      </div>
    </div>
  );
}

export function FeltItPrompt({
  earthquake,
  onReport,
  onDismiss,
}: {
  earthquake: Earthquake;
  onReport: () => void;
  onDismiss: () => void;
}) {
  const { unitSystem } = useUnits();
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
  useEffect(() => {
    const timer = setTimeout(onDismiss, 20000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up max-w-sm w-full mx-4">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: getMagnitudeColor(earthquake.magnitude) + '20',
              border: `2px solid ${getMagnitudeColor(earthquake.magnitude)}50`,
            }}
          >
            <span 
              className="text-lg font-bold"
              style={{ color: getMagnitudeColor(earthquake.magnitude) }}
            >
              {earthquake.magnitude.toFixed(1)}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-white">Did you feel that?</div>
            <div className="text-xs text-neutral-300">
              {locationContext.formattedLocation || earthquake.place?.split(',')[0] || 'Bay Area'}
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="ml-auto p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReport}
            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Yes, I felt it!
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-neutral-300 text-sm rounded-lg transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewEarthquakeToast({ 
  newQuakes, 
  onDismiss,
  onViewFeed 
}: { 
  newQuakes: Earthquake[];
  onDismiss: () => void;
  onViewFeed: () => void;
}) {
  const { unitSystem } = useUnits();
  
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  if (newQuakes.length === 0) return null;
  
  const largest = newQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max);
  const hasSignificant = largest.magnitude >= 2.5;
  const largestLocationContext = getLocationContext(largest.latitude, largest.longitude, unitSystem);
  
  return (
    <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up ${
      hasSignificant ? 'max-w-sm' : 'max-w-xs'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${
        hasSignificant 
          ? 'bg-amber-500/20 border-amber-500/40' 
          : 'bg-green-500/20 border-green-500/40'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          hasSignificant ? 'bg-amber-400' : 'bg-green-400'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">
            {newQuakes.length === 1 
              ? `New M${largest.magnitude.toFixed(1)} earthquake` 
              : `${newQuakes.length} new earthquakes`
            }
          </div>
          {hasSignificant && (
            <div className="text-xs text-neutral-300 truncate">
              {largestLocationContext.formattedLocation || largest.place?.split(',')[0] || 'Bay Area'}
            </div>
          )}
        </div>
        <button 
          onClick={onViewFeed}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            hasSignificant 
              ? 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40' 
              : 'bg-green-500/30 text-green-200 hover:bg-green-500/40'
          }`}
        >
          View
        </button>
        <button 
          onClick={onDismiss}
          className="p-1 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function LiveTimestamp({ lastUpdated, isRefreshing }: { lastUpdated: Date | null; isRefreshing: boolean }) {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  if (!lastUpdated) return null;
  
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  
  let timeText: string;
  if (secondsAgo < 5) {
    timeText = 'just now';
  } else if (secondsAgo < 60) {
    timeText = `${secondsAgo}s ago`;
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    timeText = `${minutes}m ago`;
  } else {
    timeText = format(lastUpdated, 'h:mm a');
  }
  
  return (
    <span className="hidden md:flex items-center gap-1.5 text-sm text-neutral-500" suppressHydrationWarning>
      <span className={`transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
        Updated {timeText}
      </span>
      {isRefreshing && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
    </span>
  );
}

export function IOSAppBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  
  useEffect(() => {
    const dismissedAt = localStorage.getItem('baytremor-ios-banner-dismissed-at');
    
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed <= 7) {
        setIsVisible(false);
      }
    }
    setIsChecked(true);
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('baytremor-ios-banner-dismissed-at', Date.now().toString());
  };
  
  if (isChecked && !isVisible) return null;
  
  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link prefetch={false} 
            href="/ios" 
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-orange-300/90 whitespace-nowrap">
                📱 iOS App Coming Soon
              </span>
              <span className="hidden sm:inline text-xs text-neutral-400">
                — Real-time alerts, widgets & more
              </span>
              <span className="text-xs text-orange-400/80 group-hover:text-orange-300 transition-colors whitespace-nowrap">
                Join waitlist →
              </span>
            </div>
          </Link>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDismiss();
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors text-neutral-500 hover:text-neutral-300 flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
