'use client';

import { UnitProvider } from '@/lib/unit-context';
import { NavBar } from '@/components/dashboard/components/nav-bar';

interface NavBarWithProvidersProps {
  currentPath?: string;
  earthquakeCount?: number;
}

export function NavBarWithProviders(props: NavBarWithProvidersProps) {
  return (
    <UnitProvider>
      <NavBar {...props} />
    </UnitProvider>
  );
}
