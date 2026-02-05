'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UnitSystem = 'imperial' | 'metric';

interface UnitContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnit: () => void;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const UNIT_STORAGE_KEY = 'baytremor_unit_system';

export function UnitProvider({ children }: { children: ReactNode }) {
  // Default to imperial (miles) for US/Bay Area users
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('imperial');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(UNIT_STORAGE_KEY);
    if (stored === 'metric' || stored === 'imperial') {
      setUnitSystemState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when changed
  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    localStorage.setItem(UNIT_STORAGE_KEY, system);
  };

  const toggleUnit = () => {
    const newSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
    setUnitSystem(newSystem);
  };

  return (
    <UnitContext.Provider value={{ unitSystem, setUnitSystem, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
}

// Optional hook that returns default values when outside provider (for SSR)
export function useUnitsOptional(): UnitContextType {
  const context = useContext(UnitContext);
  return context ?? {
    unitSystem: 'imperial',
    setUnitSystem: () => {},
    toggleUnit: () => {},
  };
}
