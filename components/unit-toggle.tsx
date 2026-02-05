'use client';

import { useUnits, UnitSystem } from '@/lib/unit-context';
import { Ruler } from 'lucide-react';

interface UnitToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function UnitToggle({ className = '', showLabel = true, size = 'md' }: UnitToggleProps) {
  const { unitSystem, toggleUnit } = useUnits();
  
  const isImperial = unitSystem === 'imperial';
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1';
  
  return (
    <button
      onClick={toggleUnit}
      className={`flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors ${className}`}
      title={`Switch to ${isImperial ? 'metric (km)' : 'imperial (miles)'}`}
    >
      {showLabel && (
        <Ruler className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
      <div className={`flex items-center gap-0.5 font-medium ${sizeClasses}`}>
        <span 
          className={`transition-colors ${isImperial ? 'text-blue-400' : 'text-neutral-500'}`}
        >
          mi
        </span>
        <span className="text-neutral-600">/</span>
        <span 
          className={`transition-colors ${!isImperial ? 'text-blue-400' : 'text-neutral-500'}`}
        >
          km
        </span>
      </div>
    </button>
  );
}

// Compact version for tight spaces
export function UnitToggleCompact({ className = '' }: { className?: string }) {
  const { unitSystem, toggleUnit } = useUnits();
  
  return (
    <button
      onClick={toggleUnit}
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors ${className}`}
      title={`Click to switch units`}
    >
      {unitSystem === 'imperial' ? 'mi' : 'km'}
    </button>
  );
}

// Segmented control style toggle
export function UnitToggleSegmented({ className = '' }: { className?: string }) {
  const { unitSystem, setUnitSystem } = useUnits();
  
  return (
    <div className={`inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 ${className}`}>
      <button
        onClick={() => setUnitSystem('imperial')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          unitSystem === 'imperial' 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        Miles
      </button>
      <button
        onClick={() => setUnitSystem('metric')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          unitSystem === 'metric' 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        Kilometers
      </button>
    </div>
  );
}
