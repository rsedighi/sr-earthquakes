'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Home,
  HardHat,
  Package,
  ChevronRight,
  X,
  Check,
  Loader2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import type { Earthquake } from '@/lib/types';
import { computeRiskScore, bandColors, type RiskScore } from '@/lib/risk-score';
import type { LeadCategory } from '@/lib/d1';

interface UserLocation {
  lat: number;
  lon: number;
  address: string;
}

interface HomeRiskReportProps {
  userLocation: UserLocation;
  historicalEarthquakes: Earthquake[];
  visitorId?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function track(action: string, data: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as any).DD_RUM) {
    (window as any).DD_RUM.addAction(action, data);
  }
}

// ── CTA definitions (map to lead categories / buyers) ──
const CTAS: {
  category: Exclude<LeadCategory, 'general'>;
  icon: typeof Shield;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
  iconBg: string;
}[] = [
  {
    category: 'insurance',
    icon: Shield,
    title: 'Earthquake insurance quote',
    subtitle: 'See if you qualify for coverage — most home policies exclude earthquakes.',
    cta: 'Get my free quote',
    accent: 'border-blue-500/30 hover:border-blue-400/60',
    iconBg: 'bg-blue-500/15 text-blue-400',
  },
  {
    category: 'retrofit',
    icon: HardHat,
    title: 'Retrofit & foundation check',
    subtitle: 'Bracing & bolting can qualify for a $3,000 CA Brace + Bolt rebate.',
    cta: 'Check rebate eligibility',
    accent: 'border-amber-500/30 hover:border-amber-400/60',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  {
    category: 'preparedness',
    icon: Package,
    title: 'Get your home prepared',
    subtitle: 'A personalized preparedness plan and essential kit for your area.',
    cta: 'Build my plan',
    accent: 'border-green-500/30 hover:border-green-400/60',
    iconBg: 'bg-green-500/15 text-green-400',
  },
];

export function HomeRiskReport({
  userLocation,
  historicalEarthquakes,
  visitorId,
  className = '',
}: HomeRiskReportProps) {
  const [activeCategory, setActiveCategory] = useState<LeadCategory | null>(null);

  const risk = useMemo(
    () => computeRiskScore(userLocation.lat, userLocation.lon, historicalEarthquakes),
    [userLocation.lat, userLocation.lon, historicalEarthquakes]
  );

  useEffect(() => {
    track('risk_score_viewed', {
      score: risk.score,
      band: risk.band,
      nearestFault: risk.nearestFault?.name ?? null,
    });
  }, [risk.score, risk.band, risk.nearestFault?.name]);

  const openForm = (category: LeadCategory) => {
    track('lead_cta_clicked', { category, score: risk.score, band: risk.band });
    setActiveCategory(category);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <RiskScoreCard risk={risk} onPrimaryCta={() => openForm('insurance')} />

      {/* Segmented CTAs */}
      <div className="grid gap-3 sm:grid-cols-3">
        {CTAS.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.category}
              onClick={() => openForm(c.category)}
              className={`group flex flex-col items-start text-left p-4 rounded-2xl bg-white/[0.03] border ${c.accent} transition-all hover:-translate-y-0.5`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">{c.title}</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed flex-1">{c.subtitle}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white group-hover:gap-2 transition-all">
                {c.cta}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <LeadFormModal
          category={activeCategory}
          risk={risk}
          userLocation={userLocation}
          visitorId={visitorId}
          onClose={() => setActiveCategory(null)}
        />
      )}
    </div>
  );
}

// ── Risk Score card with circular gauge ──
function RiskScoreCard({ risk, onPrimaryCta }: { risk: RiskScore; onPrimaryCta: () => void }) {
  const colors = bandColors(risk.band);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (risk.score / 100) * circumference;

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Home className="w-4 h-4 text-neutral-400" />
        <span className="text-xs uppercase tracking-wider text-neutral-400">
          Home Seismic Risk Score
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Gauge */}
        <div className="relative flex-shrink-0 mx-auto sm:mx-0" style={{ width: 128, height: 128 }}>
          <svg width={128} height={128} className="-rotate-90">
            <circle
              cx={64}
              cy={64}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={10}
              className="text-white/10"
            />
            <circle
              cx={64}
              cy={64}
              r={radius}
              fill="none"
              strokeWidth={10}
              strokeLinecap="round"
              className={colors.ring}
              stroke="currentColor"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${colors.text}`}>{risk.score}</span>
            <span className="text-[10px] text-neutral-500">out of 100</span>
          </div>
        </div>

        {/* Headline + summary */}
        <div className="flex-1">
          <div className={`inline-block text-sm font-semibold ${colors.text} mb-1`}>
            {risk.headline}
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">{risk.summary}</p>

          {risk.nearestFault && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              Nearest fault: <span className="text-neutral-200 font-medium">{risk.nearestFault.name}</span>
              <span className="text-neutral-500">
                ({risk.nearestFault.distanceKm.toFixed(1)} km)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="mt-5 space-y-2.5">
        {risk.factors.map(f => (
          <div key={f.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-300">{f.label}</span>
              <span className="text-neutral-500">{f.points}/{f.maxPoints}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.ring.replace('stroke', 'bg')}`}
                style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {(risk.band === 'Very High' || risk.band === 'High') && (
        <button
          onClick={onPrimaryCta}
          className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Get your free Home Risk Report
        </button>
      )}

      <p className="text-[10px] text-neutral-600 mt-3 leading-relaxed">
        This is a relative-exposure indicator for the Bay Area based on fault proximity and
        historical activity — not an official USGS hazard forecast.
      </p>
    </div>
  );
}

// ── Lead form modal ──
const HOME_AGE_OPTIONS = [
  { value: 'pre-1980', label: 'Before 1980' },
  { value: '1980-2000', label: '1980 – 2000' },
  { value: 'post-2000', label: 'After 2000' },
  { value: 'unknown', label: 'Not sure' },
];

const FOUNDATION_OPTIONS = [
  { value: 'raised', label: 'Raised / crawl space' },
  { value: 'slab', label: 'Concrete slab' },
  { value: 'unknown', label: 'Not sure' },
];

const CATEGORY_COPY: Record<Exclude<LeadCategory, 'general'>, { title: string; blurb: string }> = {
  insurance: {
    title: 'Free earthquake insurance quote',
    blurb: 'Tell us a bit about your home and we\u2019ll match you with earthquake coverage options.',
  },
  retrofit: {
    title: 'Retrofit & rebate eligibility check',
    blurb: 'Find out if your home qualifies for a seismic retrofit and the $3,000 Brace + Bolt rebate.',
  },
  preparedness: {
    title: 'Your personalized preparedness plan',
    blurb: 'We\u2019ll send a free plan and kit checklist tailored to your home\u2019s risk profile.',
  },
};

function LeadFormModal({
  category,
  risk,
  userLocation,
  visitorId,
  onClose,
}: {
  category: LeadCategory;
  risk: RiskScore;
  userLocation: UserLocation;
  visitorId?: string;
  onClose: () => void;
}) {
  const copy = CATEGORY_COPY[category as Exclude<LeadCategory, 'general'>] ?? {
    title: 'Get your free Home Risk Report',
    blurb: 'Tell us about your home and we\u2019ll follow up with tailored options.',
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ownership, setOwnership] = useState('');
  const [homeAge, setHomeAge] = useState('');
  const [foundationType, setFoundationType] = useState('');
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const consentText =
    'I agree to be contacted by Bay Tremor and its partners (insurance providers, ' +
    'licensed contractors, and preparedness services) by email, phone, or text about ' +
    'my earthquake risk. Consent is not a condition of purchase. I can opt out anytime.';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = useCallback(async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Please accept the consent notice to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const city = userLocation.address.split(',')[0]?.trim();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          name: name || undefined,
          email,
          phone: phone || undefined,
          address: userLocation.address,
          city,
          lat: userLocation.lat,
          lon: userLocation.lon,
          category,
          riskScore: risk.score,
          riskBand: risk.band,
          nearestFault: risk.nearestFault?.name,
          ownership: ownership || undefined,
          homeAge: homeAge || undefined,
          foundationType: foundationType || undefined,
          hasInsurance: hasInsurance ?? undefined,
          consent: true,
          consentText,
          source: 'my-area',
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Something went wrong.');
      }

      track('lead_submitted', { category, score: risk.score, band: risk.band });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }, [
    email, consent, name, phone, ownership, homeAge, foundationType, hasInsurance,
    category, risk, userLocation, visitorId, consentText,
  ]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#0f0f0f] border border-white/10 rounded-t-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-white/5 px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">{copy.title}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{copy.blurb}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-green-500/15 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">You&apos;re all set</h4>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              We&apos;ve received your request. Expect your personalized Home Risk Report and
              matched options by email shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Risk context banner */}
            <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-white/[0.03] border border-white/10">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-neutral-300">
                Your home scored <span className="font-semibold text-white">{risk.score}/100</span>{' '}
                ({risk.band}){risk.nearestFault ? ` \u2014 ${risk.nearestFault.distanceKm.toFixed(1)} km from the ${risk.nearestFault.name}` : ''}.
              </span>
            </div>

            <Field label="Full name">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                className={inputCls}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Do you own or rent?">
              <div className="flex gap-2">
                {['own', 'rent'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOwnership(v)}
                    className={pillCls(ownership === v)}
                  >
                    {v === 'own' ? 'I own' : 'I rent'}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="When was your home built?">
                <select value={homeAge} onChange={e => setHomeAge(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  {HOME_AGE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Foundation type">
                <select value={foundationType} onChange={e => setFoundationType(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  {FOUNDATION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Do you currently have earthquake insurance?">
              <div className="flex gap-2">
                {[
                  { v: true, l: 'Yes' },
                  { v: false, l: 'No' },
                ].map(o => (
                  <button
                    key={o.l}
                    type="button"
                    onClick={() => setHasInsurance(o.v)}
                    className={pillCls(hasInsurance === o.v)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500 flex-shrink-0"
              />
              <span className="text-[11px] text-neutral-400 leading-relaxed">{consentText}</span>
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Get my free report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30';

function pillCls(active: boolean) {
  return `flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
    active
      ? 'bg-white text-black border-white'
      : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:border-white/30'
  }`;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
