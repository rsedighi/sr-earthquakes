import { Metadata } from 'next';
import { redirect } from 'next/navigation';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// This page redirects to /today but has its own SEO metadata for "latest earthquake" searches
export const metadata: Metadata = {
  title: 'Latest Bay Area Earthquake | Just Now - Bay Tremor',
  description: 'What was that earthquake? See the latest seismic activity in the San Francisco Bay Area. Real-time updates on the most recent earthquakes near you.',
  keywords: [
    'latest earthquake',
    'latest earthquake bay area',
    'earthquake just now',
    'what was that earthquake',
    'earthquake near me',
    'most recent earthquake california',
    'last earthquake bay area',
    'newest earthquake',
    'earthquake just happened',
    'feel earthquake just now',
  ],
  openGraph: {
    title: 'Latest Bay Area Earthquake | What Was That?',
    description: 'See the most recent earthquake in the San Francisco Bay Area. Real-time seismic data.',
    type: 'website',
    url: `${baseUrl}/latest`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latest Bay Area Earthquake',
    description: 'What was that earthquake? See the latest seismic activity.',
  },
  alternates: {
    canonical: `${baseUrl}/today`,
  },
};

// Redirect to /today - this page exists purely for SEO purposes
export default function LatestPage() {
  redirect('/today');
}


