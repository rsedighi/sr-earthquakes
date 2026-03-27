'use client';

import { useState, useEffect, useMemo } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Radio,
  Locate,
  ChevronRight,
  MessageCircle,
  Users,
  Zap,
  ThumbsUp,
  Send,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { BAY_AREA_LANDMARKS } from '@/lib/regions';

// Intensity descriptions based on Modified Mercalli Intensity scale
const INTENSITY_LEVELS = [
  { level: 1, label: 'Not felt', description: 'Not felt except by very few under favorable conditions', color: '#94a3b8' },
  { level: 2, label: 'Weak', description: 'Felt by few people at rest, especially on upper floors', color: '#60a5fa' },
  { level: 3, label: 'Weak', description: 'Felt noticeably indoors, like a truck passing', color: '#34d399' },
  { level: 4, label: 'Light', description: 'Felt by many indoors, dishes and windows rattle', color: '#a3e635' },
  { level: 5, label: 'Moderate', description: 'Felt by nearly everyone, some dishes break, unstable objects tip', color: '#fbbf24' },
  { level: 6, label: 'Strong', description: 'Felt by all, furniture moves, slight damage', color: '#fb923c' },
  { level: 7, label: 'Very Strong', description: 'Difficult to stand, moderate damage to buildings', color: '#f87171' },
  { level: 8, label: 'Severe', description: 'Considerable damage, chimneys fall', color: '#ef4444' },
  { level: 9, label: 'Violent', description: 'Well-built buildings damaged considerably', color: '#dc2626' },
  { level: 10, label: 'Extreme', description: 'Most buildings destroyed', color: '#991b1b' },
];

// Calculate distance between two points using Haversine formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371; // Convert to miles
}

// Format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Find nearest city to coordinates
function getNearestCityName(lat: number, lon: number): string {
  const cities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  let nearest = cities[0];
  let minDist = Infinity;
  
  for (const city of cities) {
    const dist = haversineDistance(lat, lon, city.lat, city.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  
  return nearest?.name || 'Bay Area';
}

export default function FeltEarthquakePage() {
  const { earthquakes, isLoading } = useRealtimeEarthquakes();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [selectedEarthquake, setSelectedEarthquake] = useState<string | null>(null);
  
  // Get user's location
  const requestLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location services.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  // Auto-request location on mount
  useEffect(() => {
    // Only auto-request if user hasn't explicitly denied before
    const hasDeclinedLocation = localStorage.getItem('declinedLocation');
    if (!hasDeclinedLocation && navigator.geolocation) {
      requestLocation();
    }
  }, []);
  
  // Sort and filter earthquakes
  const sortedEarthquakes = useMemo(() => {
    if (!earthquakes) return [];
    
    let sorted = [...earthquakes].sort((a, b) => b.timestamp - a.timestamp);
    
    // If user has location, add distance and sort by proximity for recent ones
    if (userLocation) {
      sorted = sorted.map(eq => ({
        ...eq,
        distance: haversineDistance(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude),
      }));
    }
    
    return sorted;
  }, [earthquakes, userLocation]);
  
  // Most recent earthquake (likely what user felt)
  const mostRecentQuake = sortedEarthquakes[0];
  
  // Recent felt earthquakes (M2.5+ in last 24 hours)
  const recentFeltQuakes = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return sortedEarthquakes
      .filter(eq => eq.magnitude >= 2.5 && eq.timestamp > dayAgo)
      .slice(0, 10);
  }, [sortedEarthquakes]);
  
  // Nearby earthquakes (if location available)
  const nearbyQuakes = useMemo(() => {
    if (!userLocation) return [];
    return sortedEarthquakes
      .filter(eq => (eq as any).distance && (eq as any).distance < 50)
      .slice(0, 10);
  }, [sortedEarthquakes, userLocation]);
  
  // Handle report submission
  const handleSubmitReport = async () => {
    if (!selectedIntensity || !selectedEarthquake) return;
    
    // In a real implementation, this would POST to an API
    // For now, just show success
    setReportSubmitted(true);
    
    // Reset after delay
    setTimeout(() => {
      setReportSubmitted(false);
      setSelectedIntensity(null);
      setReportComment('');
      setSelectedEarthquake(null);
    }, 3000);
  };
  
  const userCityName = userLocation ? getNearestCityName(userLocation.lat, userLocation.lon) : null;
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li><Link prefetch={false} href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-white">Did You Feel It?</li>
          </ol>
        </nav>
        
        {/* Back Navigation */}
        <Link prefetch={false} 
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-red-400 font-medium">LIVE</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Did You Feel an Earthquake?
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {mostRecentQuake ? (
              <>
                Most recent earthquake: <span className="text-white font-semibold">
                  M{mostRecentQuake.magnitude.toFixed(1)}
                </span> {formatTimeAgo(mostRecentQuake.timestamp)} near{' '}
                <span className="text-white">{mostRecentQuake.place.split(',')[0]}</span>
              </>
            ) : (
              'Check recent earthquakes and report what you felt'
            )}
          </p>
        </header>
        
        {/* Location Card */}
        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-1">Your Location</h2>
                {userLocation ? (
                  <p className="text-neutral-400">
                    Near <span className="text-white">{userCityName}</span>
                  </p>
                ) : locationError ? (
                  <p className="text-red-400 text-sm">{locationError}</p>
                ) : (
                  <p className="text-neutral-500">Enable location for nearby earthquakes</p>
                )}
              </div>
            </div>
            
            {!userLocation && (
              <button
                onClick={requestLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg font-medium transition-colors"
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Locate className="w-4 h-4" />
                )}
                {locationLoading ? 'Finding...' : 'Find Me'}
              </button>
            )}
          </div>
        </div>
        
        {/* Alert Banner for Recent Significant Earthquake */}
        {mostRecentQuake && mostRecentQuake.magnitude >= 3.0 && 
         (Date.now() - mostRecentQuake.timestamp) < 60 * 60 * 1000 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">
                  Recent Earthquake Detected
                </h2>
                <p className="text-neutral-300 mb-4">
                  A <strong className="text-white">M{mostRecentQuake.magnitude.toFixed(1)}</strong> earthquake 
                  occurred {formatTimeAgo(mostRecentQuake.timestamp)} near{' '}
                  <strong className="text-white">{mostRecentQuake.place}</strong>.
                  {userLocation && (mostRecentQuake as any).distance && (
                    <> It was <strong className="text-white">{(mostRecentQuake as any).distance.toFixed(1)} miles</strong> from your location.</>
                  )}
                </p>
                <Link prefetch={false} 
                  href={`/earthquake/${mostRecentQuake.id}`}
                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium"
                >
                  View earthquake details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Recent Earthquakes */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-400" />
              {userLocation ? 'Earthquakes Near You' : 'Recent Earthquakes'}
            </h2>
            
            <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" />
                  <p className="text-neutral-500 mt-2">Loading earthquakes...</p>
                </div>
              ) : (userLocation ? nearbyQuakes : recentFeltQuakes).length > 0 ? (
                <ul className="divide-y divide-white/5">
                  {(userLocation ? nearbyQuakes : recentFeltQuakes).map(eq => (
                    <li key={eq.id}>
                      <button
                        onClick={() => setSelectedEarthquake(eq.id)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left ${
                          selectedEarthquake === eq.id ? 'bg-white/10' : ''
                        }`}
                      >
                        <div 
                          className="w-14 h-14 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                          style={{ 
                            backgroundColor: getMagnitudeColor(eq.magnitude) + '20',
                            color: getMagnitudeColor(eq.magnitude)
                          }}
                        >
                          <span className="text-lg">{eq.magnitude.toFixed(1)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{eq.place}</div>
                          <div className="text-sm text-neutral-500 flex flex-wrap gap-x-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(eq.timestamp)}
                            </span>
                            {(eq as any).distance && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {(eq as any).distance.toFixed(1)} mi away
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedEarthquake === eq.id && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No felt earthquakes in the last 24 hours.</p>
                </div>
              )}
            </div>
            
            <Link prefetch={false} 
              href="/today"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-4 text-sm"
            >
              View all earthquakes today
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Right: Report Form */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              Report What You Felt
            </h2>
            
            <div className="bg-neutral-900 rounded-xl border border-white/10 p-6">
              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Thank You!</h3>
                  <p className="text-neutral-400">
                    Your report helps scientists understand earthquake effects in your area.
                  </p>
                </div>
              ) : (
                <>
                  {!selectedEarthquake ? (
                    <div className="text-center py-8 text-neutral-500">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select an earthquake from the list to report what you felt.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-400 mb-3">
                          How strong was the shaking?
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {INTENSITY_LEVELS.slice(0, 5).map((intensity) => (
                            <button
                              key={intensity.level}
                              onClick={() => setSelectedIntensity(intensity.level)}
                              className={`p-3 rounded-lg border transition-all ${
                                selectedIntensity === intensity.level
                                  ? 'border-white bg-white/10'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <div 
                                className="text-2xl font-bold mb-1"
                                style={{ color: intensity.color }}
                              >
                                {intensity.level}
                              </div>
                              <div className="text-xs text-neutral-400">{intensity.label}</div>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {INTENSITY_LEVELS.slice(5, 10).map((intensity) => (
                            <button
                              key={intensity.level}
                              onClick={() => setSelectedIntensity(intensity.level)}
                              className={`p-3 rounded-lg border transition-all ${
                                selectedIntensity === intensity.level
                                  ? 'border-white bg-white/10'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <div 
                                className="text-2xl font-bold mb-1"
                                style={{ color: intensity.color }}
                              >
                                {intensity.level}
                              </div>
                              <div className="text-xs text-neutral-400">{intensity.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {selectedIntensity && (
                        <div className="bg-white/5 rounded-lg p-4 mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="font-bold"
                              style={{ color: INTENSITY_LEVELS[selectedIntensity - 1].color }}
                            >
                              Intensity {selectedIntensity}: {INTENSITY_LEVELS[selectedIntensity - 1].label}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400">
                            {INTENSITY_LEVELS[selectedIntensity - 1].description}
                          </p>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                          Additional comments (optional)
                        </label>
                        <textarea
                          value={reportComment}
                          onChange={(e) => setReportComment(e.target.value)}
                          placeholder="Describe what you experienced..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <button
                        onClick={handleSubmitReport}
                        disabled={!selectedIntensity}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                      >
                        <Send className="w-5 h-5" />
                        Submit Report
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
            <p className="text-xs text-neutral-600 mt-4">
              Your reports help improve earthquake research and emergency response. 
              Location data is only used to determine proximity to earthquakes.
            </p>
          </div>
        </div>
        
        {/* Intensity Scale Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Understanding Earthquake Intensity</h2>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 text-left">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-neutral-400">Level</th>
                    <th className="px-4 py-3 text-sm font-medium text-neutral-400">Intensity</th>
                    <th className="px-4 py-3 text-sm font-medium text-neutral-400">What You Feel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {INTENSITY_LEVELS.map((intensity) => (
                    <tr key={intensity.level} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold"
                          style={{ backgroundColor: intensity.color + '20', color: intensity.color }}
                        >
                          {intensity.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{intensity.label}</td>
                      <td className="px-4 py-3 text-neutral-400 text-sm">{intensity.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <p className="text-sm text-neutral-500 mt-4">
            This scale is based on the <strong>Modified Mercalli Intensity (MMI)</strong> scale, 
            used by the USGS to measure earthquake effects on people, buildings, and the environment.
          </p>
        </section>
        
        {/* SEO Content */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-4">Just Felt an Earthquake in the Bay Area?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-300 mb-4">
              If you just felt shaking in San Francisco, Oakland, San Jose, or anywhere in the Bay Area, 
              you're in the right place. This page shows you the most recent earthquakes and lets you 
              report what you experienced.
            </p>
            <p className="text-neutral-300 mb-4">
              The San Francisco Bay Area is one of the most seismically active regions in the United States. 
              With major fault lines like the <Link prefetch={false} href="/san-andreas-fault" className="text-blue-400 hover:text-blue-300">San Andreas Fault</Link> and 
              the <Link prefetch={false} href="/hayward-fault" className="text-blue-400 hover:text-blue-300">Hayward Fault</Link> running 
              through the region, earthquakes are a regular occurrence.
            </p>
            <p className="text-neutral-300">
              Your reports are valuable! When you report what you felt, you help scientists at the USGS 
              better understand how earthquakes affect different areas. This data improves earthquake 
              hazard assessments and helps communities prepare.
            </p>
          </div>
        </section>
        
        {/* Related Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link prefetch={false} 
            href="/today"
            className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <Activity className="w-6 h-6 text-red-400 mb-3" />
            <h3 className="font-semibold mb-1 group-hover:text-red-400 transition-colors">Today's Earthquakes</h3>
            <p className="text-sm text-neutral-400">See all Bay Area earthquakes today</p>
          </Link>
          <Link prefetch={false} 
            href="/earthquake-preparedness"
            className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <AlertTriangle className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold mb-1 group-hover:text-emerald-400 transition-colors">Preparedness Guide</h3>
            <p className="text-sm text-neutral-400">Learn how to prepare for earthquakes</p>
          </Link>
          <Link prefetch={false} 
            href="/faq"
            className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <Users className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors">FAQ</h3>
            <p className="text-sm text-neutral-400">Common earthquake questions answered</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
