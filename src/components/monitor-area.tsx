'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, X } from 'lucide-react';
import { trackAction } from '@/lib/telemetry';

const PREFS_KEY = 'bt-alert-prefs';
const RADIUS_OPTIONS = [10, 25, 50] as const;
const MAGNITUDE_OPTIONS = [2.5, 3.0, 3.5, 4.0] as const;
const DEFAULT_RADIUS = 25;
const DEFAULT_MAGNITUDE = 3.0;

interface AlertPrefs {
  city: string;
  radiusMiles: number;
  minMagnitude: number;
}

type Support = 'checking' | 'supported' | 'needs-install' | 'unsupported';

interface MonitorAreaCardProps {
  cities: Array<{ name: string }>;
  currentCity: string | null;
  onCityChange: (cityName: string) => void;
  source: string;
  headline?: string;
}

function readPrefs(): AlertPrefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as AlertPrefs) : null;
  } catch {
    return null;
  }
}

function detectSupport(): Support {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (supported) return 'supported';
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return isIOS ? 'needs-install' : 'unsupported';
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

export function MonitorAreaCard({ cities, currentCity, onCityChange, source, headline }: MonitorAreaCardProps) {
  const [support, setSupport] = useState<Support>('checking');
  const [activePrefs, setActivePrefs] = useState<AlertPrefs | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState(currentCity ?? '');
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS);
  const [minMagnitude, setMinMagnitude] = useState<number>(DEFAULT_MAGNITUDE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detected = detectSupport();
    setSupport(detected);
    const saved = readPrefs();
    if (saved && detected === 'supported' && Notification.permission === 'granted') {
      setActivePrefs(saved);
    } else if (saved) {
      localStorage.removeItem(PREFS_KEY);
    }
    trackAction('alert_offer_viewed', { source, support: detected, active: Boolean(saved) });
  }, [source]);

  useEffect(() => {
    if (!isOpen && currentCity) setCity(currentCity);
  }, [currentCity, isOpen]);

  const openSheet = useCallback(() => {
    const prefs = activePrefs;
    setCity(prefs?.city ?? currentCity ?? '');
    setRadiusMiles(prefs?.radiusMiles ?? DEFAULT_RADIUS);
    setMinMagnitude(prefs?.minMagnitude ?? DEFAULT_MAGNITUDE);
    setError(null);
    setIsOpen(true);
    trackAction('city_selector_opened', { source: `${source}_alerts`, hasCity: Boolean(currentCity) });
  }, [activePrefs, currentCity, source]);

  const enable = useCallback(async () => {
    if (!city) {
      setError('Choose a city first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      trackAction('alert_permission_requested', { source });
      const permission = await Notification.requestPermission();
      trackAction('alert_permission_result', { source, result: permission });
      if (permission !== 'granted') {
        setError(permission === 'denied'
          ? 'Notifications are blocked for this site. Allow them in your browser settings, then try again.'
          : 'Notification permission was not granted.');
        return;
      }

      const [registration, config] = await Promise.all([
        getRegistration(),
        fetch('/api/alerts').then((res) => res.json() as Promise<{ vapidPublicKey: string | null }>),
      ]);
      if (!config.vapidPublicKey) throw new Error('Alerts are temporarily unavailable.');

      const subscription = (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(config.vapidPublicKey),
        }));

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), city, radiusMiles, minMagnitude }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; isNew?: boolean };
      if (!res.ok) throw new Error(data.error || 'Could not turn on alerts.');

      const prefs = { city, radiusMiles, minMagnitude };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setActivePrefs(prefs);
      onCityChange(city);
      setIsOpen(false);

      const context = { source, city, radiusMiles, minMagnitude, channel: 'browser_push', isNew: Boolean(data.isNew) };
      trackAction('alert_preferences_saved', context);
      trackAction('area_activated', context);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not turn on alerts.';
      trackAction('alert_subscribe_failed', { source, message });
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [city, minMagnitude, onCityChange, radiusMiles, source]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/alerts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      localStorage.removeItem(PREFS_KEY);
      setActivePrefs(null);
      setIsOpen(false);
      trackAction('alert_disabled', { source });
    } catch {
      setError('Could not turn off alerts. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [source]);

  if (support === 'unsupported') return null;
  // Same footprint as the card so server-rendered pages don't shift on hydration.
  if (support === 'checking') return <div className="card min-h-[84px]" aria-hidden="true" />;

  return (
    <>
      <div className="card min-h-[84px] p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${activePrefs ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
          <Bell className={`w-5 h-5 ${activePrefs ? 'text-green-400' : 'text-blue-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          {activePrefs ? (
            <>
              <div className="font-medium text-white text-sm">Alerts on for {activePrefs.city}</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                M{activePrefs.minMagnitude.toFixed(1)}+ within {activePrefs.radiusMiles} mi · browser notifications
              </div>
            </>
          ) : support === 'needs-install' ? (
            <>
              <div className="font-medium text-white text-sm">Get earthquake alerts on iPhone</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Tap Share, then Add to Home Screen. Open BayTremor from your home screen to turn on alerts.
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-white text-sm">
                {headline ?? `Monitor ${currentCity ?? 'my area'}`}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Get a notification when a nearby earthquake happens
              </div>
            </>
          )}
        </div>
        {support === 'supported' && (
          <button
            onClick={openSheet}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${activePrefs ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-blue-500 hover:bg-blue-400 text-white'}`}
          >
            {activePrefs ? 'Edit' : 'Turn on'}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="monitor-area-title">
          <div className="bg-neutral-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id="monitor-area-title" className="text-lg font-semibold text-white">Monitor my area</h2>
                <p className="text-sm text-neutral-400 mt-1">Choose where and how strong before we notify you.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="monitor-area-city">City</label>
            <select
              id="monitor-area-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                trackAction('city_selected', { method: 'alert_sheet', city: e.target.value });
              }}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 mb-4"
            >
              <option value="" disabled>Select a Bay Area city</option>
              {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>

            <div className="text-xs font-medium text-neutral-400 mb-1.5">Distance</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} onClick={() => setRadiusMiles(r)} aria-pressed={radiusMiles === r}
                  className={`py-2 rounded-lg text-sm border transition-colors ${radiusMiles === r ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}>
                  {r} mi
                </button>
              ))}
            </div>

            <div className="text-xs font-medium text-neutral-400 mb-1.5">Minimum magnitude</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MAGNITUDE_OPTIONS.map((m) => (
                <button key={m} onClick={() => setMinMagnitude(m)} aria-pressed={minMagnitude === m}
                  className={`py-2 rounded-lg text-sm border transition-colors ${minMagnitude === m ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}>
                  M{m.toFixed(1)}+
                </button>
              ))}
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              Your browser will ask to allow notifications. We store only the city you pick, never your precise location.
              Alerts arrive after USGS publishes an event and are <strong className="text-neutral-300">not an official earthquake early warning</strong>.
              For early warning, use the MyShake app.
            </p>

            {error && <p className="text-sm text-red-400 mb-3" role="alert">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={enable}
                disabled={busy || !city}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {activePrefs ? 'Save alerts' : 'Turn on alerts'}
              </button>
              {activePrefs && (
                <button
                  onClick={disable}
                  disabled={busy}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl transition-colors flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  Turn off
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
