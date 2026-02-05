import type { Metadata } from 'next';
import { IOSComingSoon } from './ios-coming-soon';

export const metadata: Metadata = {
  title: 'iOS App Coming Soon | Bay Tremor',
  description: 'Be the first to know when the Bay Tremor iOS app launches. Real-time earthquake alerts, personalized notifications, and home screen widgets for Bay Area earthquakes.',
  openGraph: {
    title: 'Bay Tremor iOS App - Coming Soon',
    description: 'Get notified when our iOS app launches. Real-time earthquake tracking for the Bay Area, right on your iPhone.',
    type: 'website',
  },
};

export default function IOSPage() {
  return <IOSComingSoon />;
}
