'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function IOSComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [isAlreadySignedUp, setIsAlreadySignedUp] = useState(false);

  // Fetch waitlist count on mount
  useEffect(() => {
    fetch('/api/ios-waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.totalSignups) {
          setWaitlistCount(data.totalSignups);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || status === 'loading') return;
    
    setStatus('loading');
    setMessage('');
    
    try {
      const response = await fetch('/api/ios-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'website' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }
      
      setStatus('success');
      setMessage(data.message);
      setIsAlreadySignedUp(!data.isNew);
      
      if (data.isNew && waitlistCount !== null) {
        setWaitlistCount(waitlistCount + 1);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent rounded-full blur-[120px] animate-pulse-gentle" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-[80px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <SeismicBridgeLogo />
            </div>
            <span className="text-lg font-semibold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
              Bay Tremor
            </span>
          </Link>
          
          <Link 
            href="/"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-6 pt-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20"
                style={{ animationDelay: '0.1s' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-sm font-medium text-orange-300/90">iOS App Coming Soon</span>
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  <span className="block text-white">Earthquakes.</span>
                  <span className="block bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    In your pocket.
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed">
                  Real-time Bay Area earthquake alerts, interactive maps, and personalized notifications. 
                  Native iOS experience with home screen widgets.
                </p>
              </div>

              {/* Features list */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: '⚡', title: 'Instant Alerts', desc: 'Push notifications within seconds' },
                  { icon: '📍', title: 'Location-Based', desc: 'Track quakes near you' },
                  { icon: '🗺️', title: 'Interactive Maps', desc: 'Visualize seismic activity' },
                  { icon: '📱', title: 'Home Widgets', desc: 'Latest quakes at a glance' },
                ].map((feature, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                    style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <div className="font-medium text-white/90">{feature.title}</div>
                      <div className="text-sm text-white/50">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email signup */}
              <div className="space-y-4 pt-4">
                {status === 'success' ? (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-green-300">
                          {isAlreadySignedUp ? "You're already on the list!" : "You're in!"}
                        </div>
                        <div className="text-sm text-green-300/70">{message}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          disabled={status === 'loading'}
                          className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-400 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {status === 'loading' ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Joining...
                          </span>
                        ) : (
                          'Notify Me'
                        )}
                      </button>
                    </div>
                    
                    {status === 'error' && (
                      <p className="text-sm text-red-400 animate-fade-in">{message}</p>
                    )}
                    
                    <p className="text-xs text-white/40">
                      No spam, ever. We&apos;ll only email you when the app is ready.
                    </p>
                  </form>
                )}

                {/* Social proof */}
                {waitlistCount !== null && waitlistCount > 0 && (
                  <div className="flex items-center gap-3 pt-2 animate-fade-in">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(4, waitlistCount))].map((_, i) => (
                        <div 
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-[#030303] flex items-center justify-center text-xs font-medium"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-white/50">
                      <span className="text-white/80 font-medium">{waitlistCount.toLocaleString()}+</span> people on the waitlist
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: iPhone mockup - Desktop */}
            <div className="relative hidden lg:block">
              <IPhoneMockup size="large" />
            </div>
          </div>
          
          {/* Mobile iPhone mockup - shown below content on mobile/tablet */}
          <div className="mt-16 lg:hidden flex justify-center">
            <IPhoneMockup size="small" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Bay Tremor. Real-time earthquake tracking for the Bay Area.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-white/40 hover:text-white/60 transition-colors">
              Privacy
            </Link>
            <Link href="/" className="text-sm text-white/40 hover:text-white/60 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// iPhone Mockup component with size variants
function IPhoneMockup({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isSmall = size === 'small';
  
  return (
    <div className={`relative mx-auto ${isSmall ? 'w-[200px]' : 'w-[320px]'}`}>
      {/* Glow behind phone */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/30 via-amber-500/20 to-transparent ${isSmall ? 'blur-[40px] scale-125' : 'blur-[60px] scale-150'}`} />
      
      {/* iPhone frame */}
      <div className="relative">
        {/* Phone body */}
        <div className={`relative bg-[#1a1a1a] ${isSmall ? 'rounded-[32px] p-2' : 'rounded-[50px] p-3'} shadow-2xl shadow-black/50 border border-white/10`}>
          {/* Dynamic Island */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${isSmall ? 'w-[75px] h-[22px]' : 'w-[120px] h-[34px]'} bg-black rounded-b-3xl z-20`} />
          
          {/* Screen */}
          <div className={`relative bg-[#0a0a0a] ${isSmall ? 'rounded-[26px]' : 'rounded-[40px]'} overflow-hidden aspect-[9/19.5]`}>
            {/* App content simulation */}
            <div className={`absolute inset-0 ${isSmall ? 'p-2.5 pt-8' : 'p-4 pt-12'}`}>
              {/* Status bar */}
              <div className={`flex justify-between items-center ${isSmall ? 'mb-2 px-1' : 'mb-4 px-2'}`}>
                <span className={`${isSmall ? 'text-[8px]' : 'text-xs'} font-medium text-white/70`}>9:41</span>
                <div className="flex items-center gap-1">
                  <div className={`${isSmall ? 'w-2.5 h-1.5' : 'w-4 h-2'} bg-white/70 rounded-sm`} />
                </div>
              </div>
              
              {/* App header */}
              <div className={`flex items-center ${isSmall ? 'gap-2 mb-3' : 'gap-3 mb-6'}`}>
                <div className={`${isSmall ? 'w-6 h-6 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-white flex items-center justify-center`}>
                  <SeismicBridgeLogo size={isSmall ? 'small' : 'normal'} />
                </div>
                <div>
                  <div className={`${isSmall ? 'text-[9px]' : 'text-sm'} font-semibold text-white`}>Bay Tremor</div>
                  <div className={`${isSmall ? 'text-[7px]' : 'text-xs'} text-white/50`}>Last 24 hours</div>
                </div>
              </div>
              
              {/* Mock earthquake cards */}
              <div className={`${isSmall ? 'space-y-1.5' : 'space-y-3'}`}>
                {[
                  { mag: 3.2, place: 'San Jose', time: '2 min ago', color: 'from-yellow-500/20 to-yellow-500/5' },
                  { mag: 2.8, place: 'Fremont', time: '18 min ago', color: 'from-green-500/20 to-green-500/5' },
                  { mag: 4.1, place: 'San Ramon', time: '1 hour ago', color: 'from-orange-500/20 to-orange-500/5' },
                ].map((quake, i) => (
                  <div 
                    key={i}
                    className={`${isSmall ? 'p-1.5 rounded-lg' : 'p-3 rounded-xl'} bg-gradient-to-r ${quake.color} border border-white/5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center ${isSmall ? 'gap-1.5' : 'gap-2'}`}>
                        <div className={`${isSmall ? 'w-5 h-5 rounded text-[8px]' : 'w-8 h-8 rounded-lg text-sm'} flex items-center justify-center font-bold ${
                          quake.mag >= 4 ? 'bg-orange-500/30 text-orange-300' :
                          quake.mag >= 3 ? 'bg-yellow-500/30 text-yellow-300' :
                          'bg-green-500/30 text-green-300'
                        }`}>
                          {quake.mag}
                        </div>
                        <div>
                          <div className={`${isSmall ? 'text-[8px]' : 'text-xs'} font-medium text-white`}>{quake.place}</div>
                          <div className={`${isSmall ? 'text-[6px]' : 'text-[10px]'} text-white/40`}>{quake.time}</div>
                        </div>
                      </div>
                      <svg className={`${isSmall ? 'w-2.5 h-2.5' : 'w-4 h-4'} text-white/30`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Map preview */}
              <div className={`${isSmall ? 'mt-2 p-1.5 rounded-lg' : 'mt-4 p-3 rounded-xl'} bg-white/5 border border-white/5`}>
                <div className={`flex items-center ${isSmall ? 'gap-1 mb-1' : 'gap-2 mb-2'}`}>
                  <svg className={`${isSmall ? 'w-2.5 h-2.5' : 'w-4 h-4'} text-white/50`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className={`${isSmall ? 'text-[6px]' : 'text-[10px]'} text-white/50`}>Bay Area Map</span>
                </div>
                <div className={`${isSmall ? 'h-12' : 'h-20'} rounded-lg bg-[#0d0d0d] relative overflow-hidden`}>
                  {/* Mini map with dots */}
                  <div className="absolute inset-0 opacity-30">
                    <svg viewBox="0 0 100 80" className="w-full h-full">
                      <path d="M10,20 Q30,10 50,25 Q70,40 90,20" stroke="#fff" strokeWidth="0.5" fill="none" opacity="0.3" />
                      <circle cx="35" cy="35" r="3" fill="#f59e0b" opacity="0.8" />
                      <circle cx="55" cy="45" r="2" fill="#22c55e" opacity="0.8" />
                      <circle cx="65" cy="30" r="4" fill="#ef4444" opacity="0.8" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Side buttons - only show on large version */}
        {!isSmall && (
          <>
            <div className="absolute left-[-2px] top-[120px] w-[3px] h-[30px] bg-[#2a2a2a] rounded-l" />
            <div className="absolute left-[-2px] top-[170px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l" />
            <div className="absolute left-[-2px] top-[240px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l" />
            <div className="absolute right-[-2px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r" />
          </>
        )}
      </div>
    </div>
  );
}

// Seismic Bridge Logo component
function SeismicBridgeLogo({ size = 'normal' }: { size?: 'normal' | 'small' }) {
  const isSmall = size === 'small';
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={isSmall ? 'w-4 h-4' : 'w-6 h-6'}>
      {/* Seismic waves in background */}
      <circle cx="20" cy="28" r="18" fill="none" stroke="#000" strokeWidth="0.3" opacity="0.15" />
      <circle cx="20" cy="28" r="14" fill="none" stroke="#000" strokeWidth="0.4" opacity="0.25" />
      <circle cx="20" cy="28" r="10" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.35" />
      <circle cx="20" cy="28" r="6" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.5" />
      
      {/* Simplified Golden Gate silhouette */}
      {/* Road */}
      <rect x="4" y="24" width="32" height="1.5" fill="#000" />
      
      {/* Left tower */}
      <rect x="10" y="14" width="2" height="11" fill="#000" />
      <rect x="9" y="12" width="4" height="3" fill="#000" />
      
      {/* Right tower */}
      <rect x="28" y="14" width="2" height="11" fill="#000" />
      <rect x="27" y="12" width="4" height="3" fill="#000" />
      
      {/* Main cable */}
      <path 
        d="M4 20 Q11 25 11 14" 
        stroke="#000" 
        strokeWidth="0.8" 
        fill="none"
      />
      <path 
        d="M11 14 Q20 22 29 14" 
        stroke="#000" 
        strokeWidth="0.8" 
        fill="none"
      />
      <path 
        d="M29 14 Q29 25 36 20" 
        stroke="#000" 
        strokeWidth="0.8" 
        fill="none"
      />
      
      {/* Epicenter dot */}
      <circle cx="20" cy="28" r="1.5" fill="#000" />
    </svg>
  );
}
