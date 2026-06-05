'use client';

import { UnitProvider } from '@/lib/unit-context';
import { Dashboard } from '@/components/dashboard';
import type { DashboardProps } from '@/components/dashboard/types';

export function DashboardWithProviders(props: DashboardProps) {
  return (
    <UnitProvider>
      <Dashboard {...props} />
    </UnitProvider>
  );
}
