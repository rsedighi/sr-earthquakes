import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
        {/* Seismic wave decoration */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.1,
          }}
        >
          <svg width="800" height="200" viewBox="0 0 800 200">
            <path
              d="M0,100 Q50,50 100,100 T200,100 T300,100 T400,100 T500,100 T600,100 T700,100 T800,100"
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

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
              backgroundColor: 'rgba(255,255,255,0.1)',
              marginBottom: '30px',
            }}
          >
            <span style={{ fontSize: '60px' }}>🌊</span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-2px',
            }}
          >
            Bay Tremor
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '28px',
              color: '#a3a3a3',
              margin: '20px 0 0 0',
              textAlign: 'center',
            }}
          >
            Live Bay Area Earthquake Tracking
          </p>

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
              <span style={{ fontSize: '24px', color: '#22c55e' }}>Real-Time</span>
              <span style={{ fontSize: '16px', color: '#737373' }}>USGS Data</span>
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
              <span style={{ fontSize: '24px', color: '#f59e0b' }}>8 Regions</span>
              <span style={{ fontSize: '16px', color: '#737373' }}>Bay Area</span>
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
              <span style={{ fontSize: '24px', color: '#3b82f6' }}>Swarm</span>
              <span style={{ fontSize: '16px', color: '#737373' }}>Detection</span>
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

