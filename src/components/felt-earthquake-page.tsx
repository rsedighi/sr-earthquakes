'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { getMagnitudeColor } from '@/lib/analysis';
import { BAY_AREA_LANDMARKS } from '@/lib/regions';

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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 0.621371;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function getNearestCityName(lat: number, lon: number): string {
  const cities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  let nearest = cities[0];
  let minDist = Infinity;
  for (const city of cities) {
    const dist = haversineDistance(lat, lon, city.lat, city.lon);
    if (dist < minDist) { minDist = dist; nearest = city; }
  }
  return nearest?.name || 'Bay Area';
}

interface EarthquakeWithDistance {
  id: string;
  magnitude: number;
  place: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  distance?: number;
}

export function FeltEarthquakePage() {
  const { earthquakes, isLoading } = useRealtimeEarthquakes();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [selectedEarthquake, setSelectedEarthquake] = useState<string | null>(null);

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
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationError('Unable to get your location. Please enable location services.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const hasDeclinedLocation = localStorage.getItem('declinedLocation');
    if (!hasDeclinedLocation && navigator.geolocation) requestLocation();
  }, []);

  const sortedEarthquakes = useMemo((): EarthquakeWithDistance[] => {
    if (!earthquakes) return [];
    let sorted = [...earthquakes].sort((a, b) => b.timestamp - a.timestamp);
    if (userLocation) {
      sorted = sorted.map(eq => ({ ...eq, distance: haversineDistance(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude) }));
    }
    return sorted;
  }, [earthquakes, userLocation]);

  const mostRecentQuake = sortedEarthquakes[0];

  const recentFeltQuakes = useMemo(() => {
    const dayAgo = Date.now() - 86400000;
    return sortedEarthquakes.filter(eq => eq.magnitude >= 2.5 && eq.timestamp > dayAgo).slice(0, 10);
  }, [sortedEarthquakes]);

  const nearbyQuakes = useMemo(() => {
    if (!userLocation) return [];
    return sortedEarthquakes.filter(eq => eq.distance !== undefined && eq.distance < 50).slice(0, 10);
  }, [sortedEarthquakes, userLocation]);

  const handleSubmitReport = () => {
    if (!selectedIntensity || !selectedEarthquake) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setSelectedIntensity(null);
      setReportComment('');
      setSelectedEarthquake(null);
    }, 3000);
  };

  const userCityName = userLocation ? getNearestCityName(userLocation.lat, userLocation.lon) : null;
  const displayQuakes = userLocation ? nearbyQuakes : recentFeltQuakes;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
            <li>/</li>
            <li className="text-white">Did You Feel It?</li>
          </ol>
        </nav>

        <a href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Dashboard
        </a>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
              <svg className="w-4 h-4 text-red-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
              <span className="text-sm text-red-400 font-medium">LIVE</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Did You Feel an Earthquake?</h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {mostRecentQuake ? (
              <>Most recent: <span className="text-white font-semibold">M{mostRecentQuake.magnitude.toFixed(1)}</span> {formatTimeAgo(mostRecentQuake.timestamp)} near <span className="text-white">{mostRecentQuake.place.split(',')[0]}</span></>
            ) : 'Check recent earthquakes and report what you felt'}
          </p>
        </header>

        {/* Location Card */}
        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-1">Your Location</h2>
                {userLocation ? (
                  <p className="text-neutral-400">Near <span className="text-white">{userCityName}</span></p>
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
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                )}
                {locationLoading ? 'Finding...' : 'Find Me'}
              </button>
            )}
          </div>
        </div>

        {/* Recent significant quake alert */}
        {mostRecentQuake && mostRecentQuake.magnitude >= 3.0 && (Date.now() - mostRecentQuake.timestamp) < 3600000 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <svg className="w-8 h-8 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">Recent Earthquake Detected</h2>
                <p className="text-neutral-300 mb-3">
                  A <strong className="text-white">M{mostRecentQuake.magnitude.toFixed(1)}</strong> earthquake occurred {formatTimeAgo(mostRecentQuake.timestamp)} near <strong className="text-white">{mostRecentQuake.place}</strong>.
                </p>
                <a href={`/earthquake/${mostRecentQuake.id}`} className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium">
                  View earthquake details
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Earthquake List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{userLocation ? 'Earthquakes Near You' : 'Recent Earthquakes'}</h2>
            <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <svg className="w-8 h-8 animate-spin mx-auto text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <p className="text-neutral-500 mt-2">Loading earthquakes...</p>
                </div>
              ) : displayQuakes.length > 0 ? (
                <ul className="divide-y divide-white/5">
                  {displayQuakes.map(eq => {
                    const color = getMagnitudeColor(eq.magnitude);
                    return (
                      <li key={eq.id}>
                        <button
                          onClick={() => setSelectedEarthquake(eq.id)}
                          className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left ${selectedEarthquake === eq.id ? 'bg-white/10' : ''}`}
                        >
                          <div className="w-14 h-14 rounded-lg flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: color + '20', color }}>
                            <span className="text-lg">{eq.magnitude.toFixed(1)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{eq.place}</div>
                            <div className="text-sm text-neutral-500">
                              {formatTimeAgo(eq.timestamp)}
                              {eq.distance !== undefined && <span className="ml-2">{eq.distance.toFixed(1)} mi away</span>}
                            </div>
                          </div>
                          {selectedEarthquake === eq.id && (
                            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <p>No felt earthquakes in the last 24 hours.</p>
                </div>
              )}
            </div>
            <a href="/today" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-4 text-sm">
              View all earthquakes today
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>

          {/* Right: Report Form */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Report What You Felt</h2>
            <div className="bg-neutral-900 rounded-xl border border-white/10 p-6">
              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Thank You!</h3>
                  <p className="text-neutral-400">Your report helps scientists understand earthquake effects in your area.</p>
                </div>
              ) : !selectedEarthquake ? (
                <div className="text-center py-8 text-neutral-500">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <p>Select an earthquake from the list to report what you felt.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-400 mb-3">How strong was the shaking?</label>
                    <div className="grid grid-cols-5 gap-2">
                      {INTENSITY_LEVELS.map((intensity) => (
                        <button
                          key={intensity.level}
                          onClick={() => setSelectedIntensity(intensity.level)}
                          className={`p-3 rounded-lg border transition-all ${selectedIntensity === intensity.level ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                        >
                          <div className="text-2xl font-bold mb-1" style={{ color: intensity.color }}>{intensity.level}</div>
                          <div className="text-xs text-neutral-400">{intensity.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedIntensity && (
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                      <div className="font-bold mb-1" style={{ color: INTENSITY_LEVELS[selectedIntensity - 1].color }}>
                        Intensity {selectedIntensity}: {INTENSITY_LEVELS[selectedIntensity - 1].label}
                      </div>
                      <p className="text-sm text-neutral-400">{INTENSITY_LEVELS[selectedIntensity - 1].description}</p>
                    </div>
                  )}

                  <textarea
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Describe what you experienced (optional)..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none mb-4"
                    rows={3}
                  />

                  <button
                    onClick={handleSubmitReport}
                    disabled={!selectedIntensity}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Submit Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Intensity Scale */}
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
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold" style={{ backgroundColor: intensity.color + '20', color: intensity.color }}>{intensity.level}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{intensity.label}</td>
                      <td className="px-4 py-3 text-neutral-400 text-sm">{intensity.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-4">Based on the <strong>Modified Mercalli Intensity (MMI)</strong> scale, used by the USGS.</p>
        </section>

        {/* SEO Content */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-4">Just Felt an Earthquake in the Bay Area?</h2>
          <p className="text-neutral-300 mb-4">If you just felt shaking in San Francisco, Oakland, San Jose, or anywhere in the Bay Area, you're in the right place. The Bay Area sits along the <a href="/san-andreas-fault" className="text-blue-400 hover:text-blue-300">San Andreas Fault</a> and <a href="/hayward-fault" className="text-blue-400 hover:text-blue-300">Hayward Fault</a>, making earthquakes a regular occurrence.</p>
          <p className="text-neutral-300">Your reports help USGS scientists better understand how earthquakes affect different areas and improve hazard assessments.</p>
        </section>

        {/* Related Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/today', label: "Today's Earthquakes", desc: 'See all Bay Area earthquakes today', color: 'text-red-400' },
            { href: '/earthquake-preparedness', label: 'Preparedness Guide', desc: 'Learn how to prepare for earthquakes', color: 'text-emerald-400' },
            { href: '/faq', label: 'FAQ', desc: 'Common earthquake questions answered', color: 'text-blue-400' },
          ].map(({ href, label, desc, color }) => (
            <a key={href} href={href} className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group">
              <h3 className={`font-semibold mb-1 group-hover:${color} transition-colors`}>{label}</h3>
              <p className="text-sm text-neutral-400">{desc}</p>
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}
