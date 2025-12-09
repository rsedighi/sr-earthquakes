import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';

// Load lightweight summary at build time - NOT the full earthquake array
// Full earthquake data stays on the server and is fetched on-demand via API
export default async function Home() {
  const summary = generateHistoricalSummary();
  
  return <Dashboard historicalSummary={summary} />;
}

// Revalidate every hour
export const revalidate = 3600;
