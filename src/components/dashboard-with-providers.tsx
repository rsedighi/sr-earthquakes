'use client';

import { UnitProvider } from '@/lib/unit-context';
import { Dashboard } from '@/components/dashboard';
import { ErrorBoundary } from '@/components/error-boundary';
import type { DashboardProps } from '@/components/dashboard/types';

export function DashboardWithProviders(props: DashboardProps) {
  return (
    <ErrorBoundary>
      <UnitProvider>
        <Dashboard {...props} />
      </UnitProvider>
    </ErrorBoundary>
  );
}
