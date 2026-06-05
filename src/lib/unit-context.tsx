'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

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

  // Save to localStorage when changed - memoized to prevent unnecessary re-renders
  const setUnitSystem = useCallback((system: UnitSystem) => {
    setUnitSystemState(system);
    localStorage.setItem(UNIT_STORAGE_KEY, system);
  }, []);

  // Toggle using functional update to ensure we always use the latest state
  const toggleUnit = useCallback(() => {
    setUnitSystemState(prev => {
      const newSystem = prev === 'imperial' ? 'metric' : 'imperial';
      localStorage.setItem(UNIT_STORAGE_KEY, newSystem);
      return newSystem;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    unitSystem,
    setUnitSystem,
    toggleUnit,
  }), [unitSystem, setUnitSystem, toggleUnit]);

  return (
    <UnitContext.Provider value={contextValue}>
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
