import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getLocationContext, getRegionById, kmToMiles } from '@/lib/regions';
import type { EarthquakeDetail } from '@/lib/usgs-detail';

export const OG_SIZE = { width: 1200, height: 630 };
export const SQUARE_SIZE = { width: 1080, height: 1080 };

const TZ = 'America/Los_Angeles';
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function Logo({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M2 12h4l3-9 6 18 3-9h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Logo />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>Bay Tremor</span>
        <span style={{ color: '#737373', fontSize: 16, fontWeight: 500 }}>{subtitle}</span>
      </div>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 18px',
        borderRadius: 12,
        background: `${color}1f`,
        border: `1px solid ${color}55`,
        color,
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function Detail({ icon, text }: { icon: 'clock' | 'depth' | 'pin'; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round">
        {icon === 'clock' && <circle cx="12" cy="12" r="10" />}
        {icon === 'clock' && <path d="M12 6v6l4 2" />}
        {icon === 'depth' && <path d="M12 3v14m-5-5 5 5 5-5M5 21h14" />}
        {icon === 'pin' && <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />}
        {icon === 'pin' && <circle cx="12" cy="10" r="3" />}
      </svg>
      <span style={{ color: '#a3a3a3', fontSize: 22, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export function EarthquakeCard({ quake, square = false }: { quake: EarthquakeDetail; square?: boolean }) {
  const hasMag = typeof quake.magnitude === 'number' && !isNaN(quake.magnitude);
  const color = getMagnitudeColor(quake.magnitude);
  const label = getMagnitudeLabel(quake.magnitude);
  const region = getRegionById(quake.region);
  const context = getLocationContext(quake.latitude, quake.longitude);
  // USGS place is authoritative; our nearest-city context becomes the subline.
  const headline = truncate(quake.place || context.formattedLocation || 'Bay Area', square ? 40 : 44);
  const miles = kmToMiles(context.distanceKm);
  const subline = context.nearestCity !== 'Unknown' && !quake.place?.includes(context.nearestCity)
    ? `${miles < 1 ? 'Near' : `${miles.toFixed(1)} mi ${context.direction ? `${context.direction} of` : 'from'}`} ${context.nearestCity}`
    : null;

  const date = quake.time.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const time = quake.time.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const depth = `${quake.depth.toFixed(1)} km (${kmToMiles(quake.depth).toFixed(1)} mi) deep`;
  const coords = `${quake.latitude.toFixed(3)}°N, ${Math.abs(quake.longitude).toFixed(3)}°W`;
  const tile = square ? 300 : 220;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: square ? 72 : 56,
        fontFamily: 'Inter',
        backgroundColor: '#0a0a0a',
        backgroundImage: `radial-gradient(circle at ${square ? '50% 42%' : '18% 55%'}, ${color}33 0%, transparent ${square ? '55%' : '45%'}), linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand subtitle="Live Bay Area earthquake tracking" />
        {!square && (
          <div
            style={{
              display: 'flex',
              padding: '10px 16px',
              borderRadius: 12,
              background: '#ffffff0a',
              border: '1px solid #ffffff14',
              color: '#8a8a8a',
              fontSize: 17,
              fontWeight: 500,
            }}
          >
            {coords}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: square ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: square ? 'center' : 'flex-start',
          gap: square ? 40 : 48,
        }}
      >
        <div
          style={{
            width: tile,
            height: tile,
            flexShrink: 0,
            borderRadius: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}1a`,
            border: `4px solid ${color}66`,
          }}
        >
          <span style={{ color, fontSize: square ? 40 : 30, fontWeight: 700, lineHeight: 1, opacity: 0.85 }}>M</span>
          <span style={{ color, fontSize: square ? 140 : 104, fontWeight: 800, lineHeight: 1, letterSpacing: -4 }}>
            {hasMag ? quake.magnitude.toFixed(1) : '—'}
          </span>
          <span style={{ color: '#a3a3a3', fontSize: square ? 22 : 18, fontWeight: 700, letterSpacing: 3, marginTop: 10, textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            ...(square ? {} : { flex: 1 }),
            alignItems: square ? 'center' : 'flex-start',
            textAlign: square ? 'center' : 'left',
          }}
        >
          <span style={{ color: '#fff', fontSize: square ? 52 : 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
            {headline}
          </span>
          {subline && <span style={{ color: '#8a8a8a', fontSize: 24, fontWeight: 500 }}>{subline}</span>}
          <div
            style={{
              display: 'flex',
              flexDirection: square ? 'column' : 'row',
              flexWrap: 'wrap',
              alignItems: square ? 'center' : 'flex-start',
              gap: square ? 12 : 28,
              marginTop: 10,
            }}
          >
            <Detail icon="clock" text={`${date} · ${time}`} />
            <Detail icon="depth" text={depth} />
            {square && <Detail icon="pin" text={coords} />}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: square ? 'center' : 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: square ? 'center' : 'flex-start' }}>
          {quake.felt ? <Pill color="#a3a3a3">{`${quake.felt.toLocaleString('en-US')} felt reports`}</Pill> : null}
          {region && <Pill color={region.color}>{`${region.areaCode} · ${region.name.split(' / ')[0]}`}</Pill>}
        </div>
        {!square && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#fbbf24', fontSize: 20, fontWeight: 700 }}>Did you feel it?</span>
            <span style={{ color: '#737373', fontSize: 18, fontWeight: 500 }}>baytremor.com</span>
          </div>
        )}
      </div>
      {square && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28, fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: '#fbbf24' }}>Did you feel it?</span>
          <span style={{ color: '#737373' }}>baytremor.com</span>
        </div>
      )}
    </div>
  );
}

export function SiteCard() {
  const features: Array<[string, string, string]> = [
    ['Real-time', 'USGS data', '#22c55e'],
    ['12 regions', 'Bay Area', '#f59e0b'],
    ['Push alerts', 'For your area', '#3b82f6'],
  ];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)',
      }}
    >
      <Logo size={104} />
      <span style={{ color: '#fff', fontSize: 80, fontWeight: 800, letterSpacing: -2, marginTop: 32 }}>Bay Tremor</span>
      <span style={{ color: '#a3a3a3', fontSize: 30, fontWeight: 500, marginTop: 12 }}>Live Bay Area earthquake tracking</span>
      <div style={{ display: 'flex', gap: 28, marginTop: 44 }}>
        {features.map(([title, sub, color]) => (
          <div
            key={title}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 32px',
              borderRadius: 14,
              background: '#ffffff0d',
              border: '1px solid #ffffff14',
            }}
          >
            <span style={{ color, fontSize: 26, fontWeight: 700 }}>{title}</span>
            <span style={{ color: '#737373', fontSize: 18, fontWeight: 500 }}>{sub}</span>
          </div>
        ))}
      </div>
      <span style={{ position: 'absolute', bottom: 32, color: '#525252', fontSize: 22, fontWeight: 500 }}>baytremor.com</span>
    </div>
  );
}
