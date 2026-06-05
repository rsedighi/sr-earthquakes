'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function IOSComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [isAlreadySignedUp, setIsAlreadySignedUp] = useState(false);

  useEffect(() => {
    fetch('/api/ios-waitlist')
      .then(res => res.json())
      .then((data: unknown) => { const d = data as { totalSignups?: number }; if (d.totalSignups) setWaitlistCount(d.totalSignups); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/ios-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'website' }),
      });
      const data = await res.json() as { error?: string; message: string; isNew: boolean };
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');
      setStatus('success');
      setMessage(data.message);
      setIsAlreadySignedUp(!data.isNew);
      if (data.isNew && waitlistCount !== null) setWaitlistCount(waitlistCount + 1);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent rounded-full blur-[120px] animate-pulse-gentle" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link prefetch={false} href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <SeismicBridgeLogo />
            </div>
            <span className="text-lg font-semibold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">Bay Tremor</span>
          </Link>
          <Link prefetch={false} href="/" className="text-sm text-white/60 hover:text-white transition-colors">← Back to Dashboard</Link>
        </nav>
      </header>

      <main className="relative z-10 px-6 pt-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="text-sm font-medium text-orange-300/90">iOS App Coming Soon</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  <span className="block text-white">Earthquakes.</span>
                  <span className="block bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">In your pocket.</span>
                </h1>
                <p className="text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed">
                  Real-time Bay Area earthquake alerts, interactive maps, and personalized notifications. Native iOS experience with home screen widgets.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: '⚡', title: 'Instant Alerts', desc: 'Push notifications within seconds' },
                  { icon: '📍', title: 'Location-Based', desc: 'Track quakes near you' },
                  { icon: '🗺️', title: 'Interactive Maps', desc: 'Visualize seismic activity' },
                  { icon: '📱', title: 'Home Widgets', desc: 'Latest quakes at a glance' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <div className="font-medium text-white/90">{f.title}</div>
                      <div className="text-sm text-white/50">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                {status === 'success' ? (
                  <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-green-300">{isAlreadySignedUp ? "You're already on the list!" : "You're in!"}</div>
                      <div className="text-sm text-green-300/70">{message}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email" required disabled={status === 'loading'}
                        className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50"
                      />
                      <button type="submit" disabled={status === 'loading'}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-400 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {status === 'loading' ? 'Joining…' : 'Notify Me'}
                      </button>
                    </div>
                    {status === 'error' && <p className="text-sm text-red-400">{message}</p>}
                    <p className="text-xs text-white/40">No spam, ever. We&apos;ll only email you when the app is ready.</p>
                  </form>
                )}
                {waitlistCount !== null && waitlistCount > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(4, waitlistCount))].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-[#030303] flex items-center justify-center text-xs font-medium">
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
            <div className="relative hidden lg:block"><IPhoneMockup size="large" /></div>
          </div>
          <div className="mt-16 lg:hidden flex justify-center"><IPhoneMockup size="small" /></div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">© {new Date().getFullYear()} Bay Tremor. Real-time earthquake tracking for the Bay Area.</p>
          <div className="flex items-center gap-6">
            <Link prefetch={false} href="/privacy" className="text-sm text-white/40 hover:text-white/60 transition-colors">Privacy</Link>
            <Link prefetch={false} href="/" className="text-sm text-white/40 hover:text-white/60 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function IPhoneMockup({ size = 'large' }: { size?: 'large' | 'small' }) {
  const s = size === 'small';
  return (
    <div className={`relative mx-auto ${s ? 'w-[200px]' : 'w-[320px]'}`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/30 via-amber-500/20 to-transparent ${s ? 'blur-[40px] scale-125' : 'blur-[60px] scale-150'}`} />
      <div className="relative">
        <div className={`relative bg-[#1a1a1a] ${s ? 'rounded-[32px] p-2' : 'rounded-[50px] p-3'} shadow-2xl shadow-black/50 border border-white/10`}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${s ? 'w-[75px] h-[22px]' : 'w-[120px] h-[34px]'} bg-black rounded-b-3xl z-20`} />
          <div className={`relative bg-[#0a0a0a] ${s ? 'rounded-[26px]' : 'rounded-[40px]'} overflow-hidden aspect-[9/19.5]`}>
            <div className={`absolute inset-0 ${s ? 'p-2.5 pt-8' : 'p-4 pt-12'}`}>
              <div className={`flex justify-between items-center ${s ? 'mb-2 px-1' : 'mb-4 px-2'}`}>
                <span className={`${s ? 'text-[8px]' : 'text-xs'} font-medium text-white/70`}>9:41</span>
                <div className="flex items-center gap-1"><div className={`${s ? 'w-2.5 h-1.5' : 'w-4 h-2'} bg-white/70 rounded-sm`} /></div>
              </div>
              <div className={`flex items-center ${s ? 'gap-2 mb-3' : 'gap-3 mb-6'}`}>
                <div className={`${s ? 'w-6 h-6 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-white flex items-center justify-center`}>
                  <SeismicBridgeLogo size={s ? 'small' : 'normal'} />
                </div>
                <div>
                  <div className={`${s ? 'text-[9px]' : 'text-sm'} font-semibold text-white`}>Bay Tremor</div>
                  <div className={`${s ? 'text-[7px]' : 'text-xs'} text-white/50`}>Last 24 hours</div>
                </div>
              </div>
              <div className={`${s ? 'space-y-1.5' : 'space-y-3'}`}>
                {[
                  { mag: 3.2, place: 'San Jose', time: '2 min ago', color: 'from-yellow-500/20 to-yellow-500/5' },
                  { mag: 2.8, place: 'Fremont', time: '18 min ago', color: 'from-green-500/20 to-green-500/5' },
                  { mag: 4.1, place: 'San Ramon', time: '1 hour ago', color: 'from-orange-500/20 to-orange-500/5' },
                ].map((q, i) => (
                  <div key={i} className={`${s ? 'p-1.5 rounded-lg' : 'p-3 rounded-xl'} bg-gradient-to-r ${q.color} border border-white/5`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center ${s ? 'gap-1.5' : 'gap-2'}`}>
                        <div className={`${s ? 'w-5 h-5 rounded text-[8px]' : 'w-8 h-8 rounded-lg text-sm'} flex items-center justify-center font-bold ${q.mag >= 4 ? 'bg-orange-500/30 text-orange-300' : q.mag >= 3 ? 'bg-yellow-500/30 text-yellow-300' : 'bg-green-500/30 text-green-300'}`}>
                          {q.mag}
                        </div>
                        <div>
                          <div className={`${s ? 'text-[8px]' : 'text-xs'} font-medium text-white`}>{q.place}</div>
                          <div className={`${s ? 'text-[6px]' : 'text-[10px]'} text-white/40`}>{q.time}</div>
                        </div>
                      </div>
                      <svg className={`${s ? 'w-2.5 h-2.5' : 'w-4 h-4'} text-white/30`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeismicBridgeLogo({ size = 'normal' }: { size?: 'normal' | 'small' }) {
  const s = size === 'small';
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={s ? 'w-4 h-4' : 'w-6 h-6'}>
      <circle cx="20" cy="28" r="18" fill="none" stroke="#000" strokeWidth="0.3" opacity="0.15" />
      <circle cx="20" cy="28" r="14" fill="none" stroke="#000" strokeWidth="0.4" opacity="0.25" />
      <circle cx="20" cy="28" r="10" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.35" />
      <circle cx="20" cy="28" r="6" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.5" />
      <rect x="4" y="24" width="32" height="1.5" fill="#000" />
      <rect x="10" y="14" width="2" height="11" fill="#000" />
      <rect x="9" y="12" width="4" height="3" fill="#000" />
      <rect x="28" y="14" width="2" height="11" fill="#000" />
      <rect x="27" y="12" width="4" height="3" fill="#000" />
      <path d="M4 20 Q11 25 11 14" stroke="#000" strokeWidth="0.8" fill="none" />
      <path d="M11 14 Q20 22 29 14" stroke="#000" strokeWidth="0.8" fill="none" />
      <path d="M29 14 Q29 25 36 20" stroke="#000" strokeWidth="0.8" fill="none" />
      <circle cx="20" cy="28" r="1.5" fill="#000" />
    </svg>
  );
}
