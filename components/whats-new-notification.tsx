'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  MessageSquare,
  Activity,
  Zap,
  MapPin,
  Users,
  ChevronRight,
  PartyPopper,
  Newspaper,
  Star,
} from 'lucide-react';

const STORAGE_KEY = 'baytremor-whats-new-dismissed-v3';

// Auto-expire this notification after 5 days from launch
// Update this date whenever you want to show a new "What's New" notification
// Format: new Date('YYYY-MM-DDTHH:MM:SS') or simply add days to a launch date
const NOTIFICATION_LAUNCH_DATE = new Date('2026-02-03'); // Today's launch
const NOTIFICATION_EXPIRES_DAYS = 5;
const NOTIFICATION_EXPIRES_AT = new Date(
  NOTIFICATION_LAUNCH_DATE.getTime() + NOTIFICATION_EXPIRES_DAYS * 24 * 60 * 60 * 1000
);

const updates = [
  {
    icon: MessageSquare,
    title: 'r/baytremor Community Hub',
    description: 'A familiar, Reddit-style discussion forum to share earthquake experiences with neighbors',
    isNew: true,
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Activity,
    title: 'Enhanced Earthquake Details',
    description: 'Richer insights with nearby earthquake clusters, energy comparisons, and "felt" reports',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: MapPin,
    title: 'Improved Location Context',
    description: 'Better neighborhood identification and proximity to known fault lines',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Community Comments',
    description: 'Share your experience directly on any earthquake - "Did you feel it?"',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Faster Real-Time Updates',
    description: 'Optimized data pipeline for quicker earthquake notifications',
    color: 'from-yellow-500 to-orange-500',
  },
];

export function WhatsNewNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  useEffect(() => {
    // Check if notification has expired (past the 5-day window)
    const now = new Date();
    if (now > NOTIFICATION_EXPIRES_AT) {
      // Notification has expired - don't show to anyone
      return;
    }

    // Check if user has already dismissed this notification
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Slight delay before showing for smoother page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setHasAnimatedIn(true), 50);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : hasAnimatedIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />
      
      {/* Notification Card */}
      <div 
        className={`fixed inset-x-4 top-1/2 z-[9999] -translate-y-1/2 mx-auto max-w-lg transition-all duration-500 ${
          isClosing 
            ? 'opacity-0 scale-95 translate-y-[-45%]' 
            : hasAnimatedIn 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95 translate-y-[-45%]'
        }`}
      >
        <div 
          className="relative bg-[#0f0f0f] rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden cursor-pointer group"
          onClick={handleDismiss}
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Sparkle accents */}
          <div className="absolute top-4 right-16 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-150" />
          <div className="absolute top-6 right-24 w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-300" />
          
          {/* Header */}
          <div className="relative p-6 pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <PartyPopper className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0f0f0f]">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">What&apos;s New</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full">
                      Fresh
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-0.5">Bay Tremor just got better</p>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-neutral-500 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="relative p-6 pt-4">
            {/* Highlight Banner */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Introducing <span className="text-orange-400 font-bold">r/baytremor</span> - a familiar way to discuss earthquakes
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Share experiences, connect with neighbors, and stay informed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Updates List */}
            <div className="space-y-3 mb-5">
              {updates.map((update, index) => {
                const Icon = update.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: hasAnimatedIn ? 'slide-up 0.4s ease-out forwards' : 'none',
                      opacity: hasAnimatedIn ? 1 : 0,
                    }}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${update.color} flex items-center justify-center flex-shrink-0 opacity-90`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{update.title}</span>
                        {update.isNew && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-green-500/20 text-green-400 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{update.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/community"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl transition-all font-semibold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Explore r/baytremor</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="px-5 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
              >
                Maybe later
              </button>
            </div>
          </div>
          
          {/* Click anywhere hint */}
          <div className="px-6 pb-4 pt-0">
            <p className="text-[10px] text-neutral-600 text-center">
              Click anywhere to dismiss
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full blur-2xl" />
        </div>
      </div>
    </>
  );
}
