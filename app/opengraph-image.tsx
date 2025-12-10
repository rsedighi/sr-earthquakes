import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Bay Tremor - Live Bay Area Earthquake Tracking';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)',
        }}
      >
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '24px',
              backgroundColor: '#10b981',
              marginBottom: '30px',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12h4l3-9 6 18 3-9h4"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '-2px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Bay Tremor
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '28px',
              color: '#a3a3a3',
              marginTop: '20px',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Live Bay Area Earthquake Tracking
          </div>

          {/* Stats/Features */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 30px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
              }}
            >
              <span style={{ fontSize: '24px', color: '#22c55e', fontFamily: 'system-ui' }}>Real-Time</span>
              <span style={{ fontSize: '16px', color: '#737373', fontFamily: 'system-ui' }}>USGS Data</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 30px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
              }}
            >
              <span style={{ fontSize: '24px', color: '#f59e0b', fontFamily: 'system-ui' }}>12 Regions</span>
              <span style={{ fontSize: '16px', color: '#737373', fontFamily: 'system-ui' }}>Bay Area</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 30px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
              }}
            >
              <span style={{ fontSize: '24px', color: '#3b82f6', fontFamily: 'system-ui' }}>Swarm</span>
              <span style={{ fontSize: '16px', color: '#737373', fontFamily: 'system-ui' }}>Detection</span>
            </div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '20px',
            color: '#525252',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          baytremor.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
