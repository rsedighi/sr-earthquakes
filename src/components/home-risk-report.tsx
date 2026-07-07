'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Home,
  HardHat,
  Package,
  ChevronRight,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Download,
  ExternalLink,
  Activity,
  Waves,
  Mountain,
  MapPin,
} from 'lucide-react';
import type { RiskReport, ZoneFinding } from '@/lib/risk-report';
import type { LeadCategory } from '@/lib/d1';

interface UserLocation {
  lat: number;
  lon: number;
  address: string;
}

interface HomeRiskReportProps {
  userLocation: UserLocation;
  visitorId?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function track(action: string, data: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as any).DD_RUM) {
    (window as any).DD_RUM.addAction(action, data);
  }
}

const BAND_STYLES: Record<RiskReport['band'], { text: string; bg: string; border: string; chip: string }> = {
  'Moderate': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', chip: 'bg-amber-500/15' },
  'High': { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', chip: 'bg-orange-500/15' },
  'Very High': { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', chip: 'bg-red-500/15' },
};

// One dominant CTA per band. Secondary paths are quiet text links.
const CTA_BY_BAND: Record<RiskReport['band'], Exclude<LeadCategory, 'general'>> = {
  'Very High': 'retrofit',
  'High': 'insurance',
  'Moderate': 'preparedness',
};

const CTA_CONTENT: Record<Exclude<LeadCategory, 'general'>, {
  icon: typeof Shield;
  title: string;
  subtitle: string;
  button: string;
}> = {
  retrofit: {
    icon: HardHat,
    title: 'Is your home structurally ready?',
    subtitle:
      'Homes near active faults built before 1980 often need bracing & bolting. A retrofit can qualify for a $3,000 CA Earthquake Brace + Bolt rebate.',
    button: 'Check retrofit & rebate eligibility',
  },
  insurance: {
    icon: Shield,
    title: 'Most home policies exclude earthquakes',
    subtitle:
      'Standard homeowners insurance does not cover earthquake damage. See what coverage costs for a home with your risk profile.',
    button: 'Get my free insurance quote',
  },
  preparedness: {
    icon: Package,
    title: 'Get your home prepared',
    subtitle:
      'A preparedness plan and supply checklist tailored to your neighborhood’s risk profile.',
    button: 'Build my free plan',
  },
};

export function HomeRiskReport({ userLocation, visitorId, className = '' }: HomeRiskReportProps) {
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Exclude<LeadCategory, 'general'> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReport(null);

    fetch(`/api/risk-report?lat=${userLocation.lat.toFixed(4)}&lon=${userLocation.lon.toFixed(4)}`)
      .then(async res => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || 'Could not build a report for this location.');
        }
        return res.json() as Promise<{ report: RiskReport }>;
      })
      .then(data => {
        if (cancelled) return;
        setReport(data.report);
        track('risk_report_viewed', {
          band: data.report.band,
          nearestFault: data.report.nearestFault.name ?? null,
          liquefaction: data.report.liquefactionZone.status,
        });
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation.lat, userLocation.lon]);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex items-center gap-3 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        <div>
          <p className="text-sm font-medium text-neutral-200">Checking state hazard maps for your address…</p>
          <p className="text-xs text-neutral-500 mt-0.5">CGS earthquake zones · USGS fault database</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-neutral-400 ${className}`}>
        {error ?? 'Report unavailable right now — the map and history below still work.'}
      </div>
    );
  }

  const primaryCta = CTA_BY_BAND[report.band];

  const openForm = (category: Exclude<LeadCategory, 'general'>) => {
    track('lead_cta_clicked', { category, band: report.band });
    setActiveCategory(category);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <ReportCard report={report} address={userLocation.address} />

      <PrimaryCtaCard category={primaryCta} onClick={() => openForm(primaryCta)} />

      {/* Quiet secondary paths */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-neutral-500">
        {(Object.keys(CTA_CONTENT) as Array<Exclude<LeadCategory, 'general'>>)
          .filter(c => c !== primaryCta)
          .map(c => (
            <button
              key={c}
              onClick={() => openForm(c)}
              className="inline-flex items-center gap-1 hover:text-neutral-300 transition-colors"
            >
              {CTA_CONTENT[c].button}
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
      </div>

      <DownloadGate report={report} userLocation={userLocation} visitorId={visitorId} />

      {activeCategory && (
        <LeadFormModal
          category={activeCategory}
          report={report}
          userLocation={userLocation}
          visitorId={visitorId}
          onClose={() => setActiveCategory(null)}
        />
      )}
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ report, address }: { report: RiskReport; address: string }) {
  const colors = BAND_STYLES[report.band];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Home className="w-4 h-4 text-neutral-400" />
            <span className="text-xs uppercase tracking-wider text-neutral-400">
              Home Seismic Risk Report
            </span>
          </div>
          <p className="text-sm text-neutral-300">{address}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${colors.chip} ${colors.text}`}>
          {report.band} Risk
        </span>
      </div>

      {/* Why this band */}
      <ul className="space-y-1.5 mb-5">
        {report.reasons.map(r => (
          <li key={r} className="flex items-start gap-2 text-sm text-neutral-200">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
            {r}
          </li>
        ))}
      </ul>

      {/* Findings */}
      <div className="divide-y divide-white/5 border-t border-white/5">
        <FaultRow report={report} />
        <ZoneRow
          icon={Waves}
          label="Liquefaction zone"
          finding={report.liquefactionZone}
          inZoneText="Yes — state-designated zone"
          outText="No — outside mapped zones"
        />
        <ZoneRow
          icon={Mountain}
          label="Earthquake-induced landslide zone"
          finding={report.landslideZone}
          inZoneText="Yes — state-designated zone"
          outText="No — outside mapped zones"
        />
        <ZoneRow
          icon={MapPin}
          label="Fault rupture zone (Alquist-Priolo)"
          finding={report.faultRuptureZone}
          inZoneText="Yes — regulatory fault zone"
          outText="No"
        />
        {report.tsunamiZone.status === 'in-zone' && (
          <ZoneRow
            icon={Waves}
            label="Tsunami hazard area"
            finding={report.tsunamiZone}
            inZoneText="Yes — inside the evacuation planning area"
            outText="No"
          />
        )}
        <HistoryRow report={report} />
      </div>

      <p className="text-[10px] text-neutral-600 mt-4 leading-relaxed">
        Sources: California Geological Survey Earthquake Zones of Required Investigation ·
        USGS Quaternary Fault Database · USGS earthquake catalog. Zone findings are the
        official state designations used in California real-estate disclosure. This report is
        informational, not an engineering evaluation of your specific structure.
      </p>
    </div>
  );
}

/** "0.0 km" reads like an error — show meters below 1 km. */
function formatFaultDistance(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round(km * 1000 / 10) * 10)} m`;
  return `${km.toFixed(1)} km`;
}

function statusColor(status: ZoneFinding['status']): string {
  switch (status) {
    case 'in-zone': return 'text-orange-300';
    case 'not-in-zone': return 'text-green-400/90';
    default: return 'text-neutral-400';
  }
}

function ZoneRow({
  icon: Icon,
  label,
  finding,
  inZoneText,
  outText,
}: {
  icon: typeof Waves;
  label: string;
  finding: ZoneFinding;
  inZoneText: string;
  outText: string;
}) {
  const value =
    finding.status === 'in-zone' ? inZoneText
    : finding.status === 'not-in-zone' ? outText
    : finding.status === 'not-evaluated' ? 'Not yet mapped by the state'
    : 'Unavailable';

  const sourceUrl = finding.mapUrl ?? finding.reportUrl;

  return (
    <div className="py-2.5 flex items-center gap-3">
      <Icon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className={`text-sm ${statusColor(finding.status)}`}>{value}</div>
      </div>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors flex-shrink-0"
        >
          CGS map
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function FaultRow({ report }: { report: RiskReport }) {
  const f = report.nearestFault;
  const value =
    f.status === 'found'
      ? `${f.name}${f.section ? ` (${f.section})` : ''} — ${formatFaultDistance(f.distanceKm!)} away`
      : f.status === 'none-within-radius'
      ? 'No mapped Quaternary fault within 30 km'
      : 'Unavailable';

  return (
    <div className="py-2.5 flex items-center gap-3">
      <Activity className="w-4 h-4 text-neutral-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500">Nearest mapped fault</div>
        <div className="text-sm text-neutral-200">{value}</div>
        {f.status === 'found' && (f.age || f.slipRate) && (
          <div className="text-xs text-neutral-500 mt-0.5">
            {[f.age && `activity: ${f.age}`, f.slipRate && f.slipRate !== 'Unspecified' && `slip rate: ${f.slipRate}`]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}
      </div>
      {f.status === 'found' && f.faultUrl && (
        <a
          href={f.faultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors flex-shrink-0"
        >
          USGS
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function HistoryRow({ report }: { report: RiskReport }) {
  const h = report.quakeHistory;
  if (h.status !== 'found') return null;

  const parts: string[] = [];
  if (h.feltCount != null) {
    parts.push(`${h.feltCount.toLocaleString()} felt by people${h.sinceYear ? ` since ${h.sinceYear}` : ''}`);
  }
  if (h.largest) {
    parts.push(`largest: M${h.largest.magnitude.toFixed(1)} (${new Date(h.largest.timestamp).getFullYear()})`);
  }

  return (
    <div className="py-2.5 flex items-center gap-3">
      <Activity className="w-4 h-4 text-neutral-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500">
          Earthquakes within {h.radiusKm} km
        </div>
        <div className="text-sm text-neutral-200">
          {h.totalCount === 0 ? 'None on record in our dataset' : parts.join(' · ')}
        </div>
      </div>
    </div>
  );
}

// ── Primary CTA ───────────────────────────────────────────────────────────────

function PrimaryCtaCard({
  category,
  onClick,
}: {
  category: Exclude<LeadCategory, 'general'>;
  onClick: () => void;
}) {
  const content = CTA_CONTENT[category];
  const Icon = content.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white">{content.title}</h4>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{content.subtitle}</p>
      </div>
      <button
        onClick={onClick}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors whitespace-nowrap"
      >
        {content.button}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── PDF download gate ─────────────────────────────────────────────────────────

const DOWNLOAD_CONSENT =
  'Send me my report and occasional Bay Area earthquake updates from Bay Tremor. Unsubscribe anytime.';

function DownloadGate({
  report,
  userLocation,
  visitorId,
}: {
  report: RiskReport;
  userLocation: UserLocation;
  visitorId?: string;
}) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const download = useCallback(() => {
    track('report_downloaded', { band: report.band });
    openPrintableReport(report, userLocation.address);
  }, [report, userLocation.address]);

  const submit = useCallback(async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
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
          email,
          address: userLocation.address,
          city,
          lat: userLocation.lat,
          lon: userLocation.lon,
          category: 'general',
          riskBand: report.band,
          nearestFault: report.nearestFault.name,
          consent: true,
          consentText: DOWNLOAD_CONSENT,
          source: 'report-download',
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Something went wrong.');
      }
      setUnlocked(true);
      download();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }, [email, website, visitorId, userLocation, report, download]);

  if (unlocked) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
        <p className="text-sm text-neutral-300 flex-1">
          Report ready — use your browser&apos;s dialog to save it as a PDF.
        </p>
        <button
          onClick={download}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Open again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <Download className="w-4 h-4 text-neutral-400" />
        <h4 className="text-sm font-semibold text-white">Keep this report</h4>
      </div>
      <p className="text-xs text-neutral-400 mb-3">
        Get a printable PDF of your report — useful for insurance conversations,
        contractors, and disclosure paperwork.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px]"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="you@email.com"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-60 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <p className="text-[10px] text-neutral-600 mt-2 leading-relaxed">{DOWNLOAD_CONSENT}</p>
    </div>
  );
}

// ── Printable report (browser print → save as PDF) ───────────────────────────

function zoneText(finding: ZoneFinding): string {
  switch (finding.status) {
    case 'in-zone': return 'YES — inside the state-designated zone';
    case 'not-in-zone': return 'No — outside mapped zones';
    case 'not-evaluated': return 'Not yet mapped by the state';
    default: return 'Unavailable';
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function openPrintableReport(report: RiskReport, address: string) {
  const f = report.nearestFault;
  const faultLine =
    f.status === 'found'
      ? `${f.name}${f.section ? ` (${f.section})` : ''} — ${formatFaultDistance(f.distanceKm!)}` +
        (f.age ? ` · activity: ${f.age}` : '')
      : 'No mapped Quaternary fault within 30 km';

  const h = report.quakeHistory;
  const historyLine =
    h.status === 'found' && h.totalCount != null
      ? h.totalCount === 0
        ? 'None on record in our dataset'
        : `${h.totalCount.toLocaleString()} earthquakes within ${h.radiusKm} km` +
          (h.feltCount ? `, ${h.feltCount.toLocaleString()} felt by people` : '') +
          (h.largest ? `. Largest: M${h.largest.magnitude.toFixed(1)} (${new Date(h.largest.timestamp).getFullYear()})` : '')
      : 'Unavailable';

  const rows: [string, string][] = [
    ['Nearest mapped fault', faultLine],
    ['Alquist-Priolo fault rupture zone', zoneText(report.faultRuptureZone)],
    ['Liquefaction zone', zoneText(report.liquefactionZone)],
    ['Earthquake-induced landslide zone', zoneText(report.landslideZone)],
    ['Tsunami hazard area', zoneText(report.tsunamiZone)],
    ['Earthquake history', historyLine],
  ];

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Home Seismic Risk Report — ${esc(address)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; margin: 40px auto; max-width: 700px; padding: 0 24px; }
  .brand { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #71717a; }
  h1 { font-size: 22px; margin: 6px 0 2px; }
  .address { color: #52525b; font-size: 14px; margin-bottom: 18px; }
  .band { display: inline-block; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 15px; margin-bottom: 6px;
    ${report.band === 'Very High' ? 'background:#fee2e2;color:#b91c1c;' : report.band === 'High' ? 'background:#ffedd5;color:#c2410c;' : 'background:#fef3c7;color:#b45309;'} }
  ul.reasons { margin: 8px 0 20px; padding-left: 18px; color: #3f3f46; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 9px 4px; border-top: 1px solid #e4e4e7; vertical-align: top; }
  td:first-child { color: #71717a; width: 44%; }
  .footer { margin-top: 24px; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
  @media print { body { margin: 0 auto; } }
</style>
</head>
<body>
  <div class="brand">BayTremor.com</div>
  <h1>Home Seismic Risk Report</h1>
  <div class="address">${esc(address)} · Generated ${new Date(report.generatedAt).toLocaleDateString()}</div>
  <div class="band">${report.band} Risk</div>
  <ul class="reasons">${report.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
  <div class="footer">
    Sources: California Geological Survey Earthquake Zones of Required Investigation ·
    USGS Quaternary Fault Database · USGS earthquake catalog. Zone findings are the official
    state designations used in California real-estate disclosure. This report is informational,
    not an engineering evaluation of a specific structure.<br>
    Get a live version of this report at baytremor.com/my-area
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

// ── Lead form modal ───────────────────────────────────────────────────────────

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

interface CategoryForm {
  title: string;
  blurb: string;
  showPhone: boolean;
  showOwnership: boolean;
  showHomeAge: boolean;
  showFoundation: boolean;
  showInsurance: boolean;
  consentText: string;
  submitLabel: string;
}

const CATEGORY_FORMS: Record<Exclude<LeadCategory, 'general'>, CategoryForm> = {
  retrofit: {
    title: 'Retrofit & rebate eligibility check',
    blurb: 'Tell us about your home and we’ll connect you with a licensed Bay Area retrofit contractor and check your $3,000 Brace + Bolt rebate eligibility.',
    showPhone: true,
    showOwnership: true,
    showHomeAge: true,
    showFoundation: true,
    showInsurance: false,
    consentText:
      'I agree that Bay Tremor may share my request with matched, licensed Bay Area retrofit contractors who can contact me about my home. I can opt out anytime.',
    submitLabel: 'Check my eligibility',
  },
  insurance: {
    title: 'Free earthquake insurance quote',
    blurb: 'Tell us a bit about your home and we’ll match you with earthquake coverage options.',
    showPhone: false,
    showOwnership: true,
    showHomeAge: true,
    showFoundation: false,
    showInsurance: true,
    consentText:
      'I agree that Bay Tremor may share my request with earthquake insurance providers to prepare quote options for me. I can opt out anytime.',
    submitLabel: 'Get my quote options',
  },
  preparedness: {
    title: 'Your personalized preparedness plan',
    blurb: 'We’ll send a free plan and kit checklist tailored to your home’s risk profile.',
    showPhone: false,
    showOwnership: false,
    showHomeAge: false,
    showFoundation: false,
    showInsurance: false,
    consentText:
      'Send me my preparedness plan and occasional Bay Area earthquake updates from Bay Tremor. Unsubscribe anytime.',
    submitLabel: 'Send my plan',
  },
};

function LeadFormModal({
  category,
  report,
  userLocation,
  visitorId,
  onClose,
}: {
  category: Exclude<LeadCategory, 'general'>;
  report: RiskReport;
  userLocation: UserLocation;
  visitorId?: string;
  onClose: () => void;
}) {
  const form = CATEGORY_FORMS[category];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ownership, setOwnership] = useState('');
  const [homeAge, setHomeAge] = useState('');
  const [foundationType, setFoundationType] = useState('');
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
          riskBand: report.band,
          nearestFault: report.nearestFault.name,
          ownership: ownership || undefined,
          homeAge: homeAge || undefined,
          foundationType: foundationType || undefined,
          hasInsurance: hasInsurance ?? undefined,
          consent: true,
          consentText: form.consentText,
          source: 'my-area',
          website,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Something went wrong.');
      }

      track('lead_submitted', { category, band: report.band });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }, [
    email, consent, name, phone, ownership, homeAge, foundationType, hasInsurance,
    category, report, userLocation, visitorId, form.consentText, website,
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
            <h3 className="text-base font-semibold text-white">{form.title}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{form.blurb}</p>
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
              We&apos;ve received your request and will follow up by email. In the meantime,
              your full risk report above is free to explore and share.
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
                Your home&apos;s risk band: <span className="font-semibold text-white">{report.band}</span>
                {report.nearestFault.status === 'found'
                  ? ` — ${formatFaultDistance(report.nearestFault.distanceKm!)} from the ${report.nearestFault.name}`
                  : ''}.
              </span>
            </div>

            {/* Honeypot field — visually hidden, excluded from tab order */}
            <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
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
              {form.showPhone && (
                <Field label="Phone (optional — for contractor callbacks)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>

            {form.showOwnership && (
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
            )}

            {(form.showHomeAge || form.showFoundation) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {form.showHomeAge && (
                  <Field label="When was your home built?">
                    <select value={homeAge} onChange={e => setHomeAge(e.target.value)} className={inputCls}>
                      <option value="">Select…</option>
                      {HOME_AGE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {form.showFoundation && (
                  <Field label="Foundation type">
                    <select value={foundationType} onChange={e => setFoundationType(e.target.value)} className={inputCls}>
                      <option value="">Select…</option>
                      {FOUNDATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            )}

            {form.showInsurance && (
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
            )}

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500 flex-shrink-0"
              />
              <span className="text-[11px] text-neutral-400 leading-relaxed">{form.consentText}</span>
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {submitting ? 'Submitting…' : form.submitLabel}
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
