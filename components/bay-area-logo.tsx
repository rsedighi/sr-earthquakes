'use client';

interface LogoProps {
  className?: string;
  variant?: 'golden-gate' | 'bay-outline' | 'bay-bridge' | 'seismic-bridge' | 'skyline';
}

export function BayAreaLogo({ className = 'w-10 h-10', variant = 'golden-gate' }: LogoProps) {
  const logos = {
    'golden-gate': <GoldenGateLogo />,
    'bay-outline': <BayOutlineLogo />,
    'bay-bridge': <BayBridgeLogo />,
    'seismic-bridge': <SeismicBridgeLogo />,
    'skyline': <SkylineLogo />,
  };

  return (
    <div className={`${className} rounded-xl bg-white flex items-center justify-center overflow-hidden`}>
      {logos[variant]}
    </div>
  );
}

// Golden Gate Bridge - Iconic twin towers and suspension cables
function GoldenGateLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5">
      {/* Water line */}
      <path 
        d="M0 32 Q10 30 20 32 Q30 34 40 32" 
        stroke="#000" 
        strokeWidth="0.5" 
        fill="none"
        opacity="0.3"
      />
      
      {/* Road deck */}
      <rect x="2" y="24" width="36" height="2" fill="#000" rx="0.5" />
      
      {/* Left tower */}
      <rect x="8" y="10" width="2.5" height="16" fill="#000" rx="0.3" />
      <rect x="7" y="8" width="4.5" height="3" fill="#000" rx="0.3" />
      
      {/* Right tower */}
      <rect x="29.5" y="10" width="2.5" height="16" fill="#000" rx="0.3" />
      <rect x="28.5" y="8" width="4.5" height="3" fill="#000" rx="0.3" />
      
      {/* Main cables - left to right */}
      <path 
        d="M0 18 Q9 24 9.25 11" 
        stroke="#000" 
        strokeWidth="1" 
        fill="none"
      />
      <path 
        d="M9.25 11 Q20 22 30.75 11" 
        stroke="#000" 
        strokeWidth="1" 
        fill="none"
      />
      <path 
        d="M30.75 11 Q31 24 40 18" 
        stroke="#000" 
        strokeWidth="1" 
        fill="none"
      />
      
      {/* Vertical suspender cables */}
      {[12, 15, 18, 20, 22, 25, 28].map((x, i) => {
        const cableY = 11 + Math.abs(x - 20) * 0.4;
        return (
          <line 
            key={i}
            x1={x} 
            y1={cableY} 
            x2={x} 
            y2="24" 
            stroke="#000" 
            strokeWidth="0.4"
          />
        );
      })}
    </svg>
  );
}

// San Francisco Bay outline shape
function BayOutlineLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1">
      {/* Simplified SF Bay shape */}
      <path 
        d="M8 6 
           L6 12 
           L4 18 
           Q3 22 5 26 
           L8 30 
           Q12 34 18 36 
           L24 37 
           Q30 36 34 32 
           L36 28 
           Q38 24 37 20 
           L35 14 
           Q34 10 30 8 
           L24 6 
           Q18 4 12 5 
           Z"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
      />
      
      {/* SF Peninsula */}
      <path 
        d="M6 12 L12 14 L10 20 L8 18 L6 12"
        fill="#000"
        opacity="0.3"
      />
      
      {/* Oakland/East Bay */}
      <path 
        d="M30 8 L34 14 L36 20 L32 22 L28 16 L30 8"
        fill="#000"
        opacity="0.3"
      />
      
      {/* Epicenter marker */}
      <circle cx="20" cy="20" r="3" fill="none" stroke="#000" strokeWidth="1" />
      <circle cx="20" cy="20" r="1.5" fill="#000" />
      
      {/* Seismic waves */}
      <circle cx="20" cy="20" r="6" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      <circle cx="20" cy="20" r="9" fill="none" stroke="#000" strokeWidth="0.3" opacity="0.3" />
    </svg>
  );
}

// Bay Bridge style with two levels
function BayBridgeLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5">
      {/* Upper deck */}
      <rect x="2" y="20" width="36" height="1.5" fill="#000" rx="0.2" />
      
      {/* Lower deck */}
      <rect x="2" y="24" width="36" height="1.5" fill="#000" rx="0.2" />
      
      {/* Tower 1 */}
      <path d="M10 10 L12 10 L12 26 L10 26 Z" fill="#000" />
      <path d="M9 8 L13 8 L12 10 L10 10 Z" fill="#000" />
      
      {/* Tower 2 */}
      <path d="M19 12 L21 12 L21 26 L19 26 Z" fill="#000" />
      <path d="M18 10 L22 10 L21 12 L19 12 Z" fill="#000" />
      
      {/* Tower 3 */}
      <path d="M28 10 L30 10 L30 26 L28 26 Z" fill="#000" />
      <path d="M27 8 L31 8 L30 10 L28 10 Z" fill="#000" />
      
      {/* Suspension cables */}
      <path d="M2 16 Q6 20 11 10" stroke="#000" strokeWidth="0.8" fill="none" />
      <path d="M11 10 Q15 18 20 12" stroke="#000" strokeWidth="0.8" fill="none" />
      <path d="M20 12 Q25 18 29 10" stroke="#000" strokeWidth="0.8" fill="none" />
      <path d="M29 10 Q34 20 38 16" stroke="#000" strokeWidth="0.8" fill="none" />
      
      {/* Vertical cables */}
      {[5, 8, 14, 17, 23, 26, 32, 35].map((x, i) => (
        <line 
          key={i}
          x1={x} 
          y1={14 + Math.sin((x - 20) * 0.2) * 2} 
          x2={x} 
          y2="20" 
          stroke="#000" 
          strokeWidth="0.3"
        />
      ))}
      
      {/* Water reflection */}
      <path d="M0 30 Q10 28 20 30 Q30 32 40 30" stroke="#000" strokeWidth="0.3" fill="none" opacity="0.3" />
    </svg>
  );
}

// Seismic wave emanating from bridge
function SeismicBridgeLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1">
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

// SF/Oakland skyline silhouette
function SkylineLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1">
      {/* Seismic wave baseline */}
      <path 
        d="M0 32 L8 32 L10 28 L12 34 L14 26 L16 36 L18 30 L20 32 L40 32" 
        stroke="#000" 
        strokeWidth="1" 
        fill="none"
      />
      
      {/* City skyline silhouette */}
      <path 
        d="M2 26 
           L2 24 L4 24 L4 22 L6 22 L6 26
           L8 26 L8 18 L10 18 L10 14 L12 14 L12 18 L14 18 L14 26
           L16 26 L16 20 L18 20 L18 16 L19 16 L19 12 L21 12 L21 16 L22 16 L22 20 L24 20 L24 26
           L26 26 L26 22 L28 22 L28 18 L30 18 L30 22 L32 22 L32 26
           L34 26 L34 24 L36 24 L36 22 L38 22 L38 26
           L38 26"
        fill="#000"
      />
      
      {/* Transamerica pyramid accent */}
      <path d="M19 12 L20 6 L21 12" fill="#000" />
      
      {/* Salesforce tower accent */}
      <circle cx="28" cy="16" r="1" fill="white" />
      
      {/* Hills behind */}
      <path 
        d="M0 26 Q5 22 10 24 Q15 20 20 22 Q28 18 35 22 Q38 24 40 26"
        fill="none"
        stroke="#000"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

export default BayAreaLogo;

