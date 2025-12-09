import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'NorCal Quake Tracker | Live Earthquake Monitoring',
  description: 'Real-time earthquake tracking and analysis for Northern California. Monitor seismic activity in San Ramon, Oakland, San Francisco, and the Bay Area with live USGS data.',
  keywords: ['earthquake', 'seismic', 'Northern California', 'Bay Area', 'San Ramon', 'USGS', 'earthquake tracker', 'swarm'],
  authors: [{ name: 'NorCal Quake Tracker' }],
  openGraph: {
    title: 'NorCal Quake Tracker | Live Earthquake Monitoring',
    description: 'Real-time earthquake tracking for Northern California with live USGS data.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NorCal Quake Tracker',
    description: 'Real-time earthquake tracking for Northern California',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

