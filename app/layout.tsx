import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { generateHomepageSchemas } from '@/lib/seo';
import { DatadogRUM } from '@/components/datadog-rum';
import { UnitProvider } from '@/lib/unit-context';
import { NavBar } from '@/components/dashboard/components/nav-bar';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bay Area Earthquake Tracker | Live Seismic Activity Map & Alerts Today',
    template: '%s | Bay Tremor - Bay Area Earthquake Tracker',
  },
  description: '🔴 LIVE Bay Area earthquake tracker with real-time USGS data. Track earthquakes in San Francisco, Oakland, San Jose & 80+ cities. See magnitude, depth, location maps. Did you feel it? Updated every minute.',
  // Focused keywords - quality over quantity (Google largely ignores this, but keeping for Bing)
  keywords: [
    'bay area earthquake',
    'bay area earthquake today',
    'bay area earthquake tracker',
    'san francisco earthquake',
    'oakland earthquake',
    'san jose earthquake',
    'earthquake tracker',
    'did i feel an earthquake',
    'earthquake near me',
    'hayward fault',
    'san andreas fault',
    'usgs earthquake',
  ],
  // Application identity
  applicationName: 'Bay Tremor',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Bay Tremor', url: baseUrl }],
  creator: 'Bay Tremor',
  publisher: 'Bay Tremor',
  category: 'Science & Technology',
  classification: 'Earthquake Monitoring Service',
  openGraph: {
    title: 'Bay Area Earthquake Tracker | Live Seismic Activity Map',
    description: 'Track Bay Area earthquakes in real-time. Live USGS data for San Francisco, Oakland, San Jose & 80+ cities. Interactive maps, fault lines, swarm detection. Updated every minute.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Bay Tremor',
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Bay Area Earthquake Tracker - Live seismic activity map showing recent earthquakes in San Francisco Bay Area',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Area Earthquake Tracker | Live Map & Alerts',
    description: 'Track Bay Area earthquakes in real-time. Did you feel it? Check magnitude, location & depth. USGS data updated every minute.',
    site: '@baytremor',
    creator: '@baytremor',
    images: [{
      url: `${baseUrl}/og-image.png`,
      alt: 'Bay Area Earthquake Tracker - Live seismic activity map',
    }],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    types: {
      'application/rss+xml': [
        { url: `${baseUrl}/feed.xml`, title: 'Bay Tremor - Earthquake Feed' },
      ],
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: '/favicon.svg',
      },
    ],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
    },
  },
  other: {
    'geo.region': 'US-CA',
    'geo.placename': 'San Francisco Bay Area',
    'geo.position': '37.75;-122.25',
    'ICBM': '37.75, -122.25',
  },
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
  const schemas = generateHomepageSchemas();
  
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* DNS Prefetch for external resources - faster first load */}
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images-na.ssl-images-amazon.com" />
        <link rel="preconnect" href="https://images-na.ssl-images-amazon.com" crossOrigin="anonymous" />
        
        {/* Impact.com Site Verification */}
        <meta name="impact-site-verification" content="f0b61dfc-b575-4c4c-ab15-c6c6df6d9cff" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas),
          }}
        />
        
        {/* Google AdSense - using Next.js Script to avoid hydration issues */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2599154949047210"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        
        <GoogleAnalytics gaId="G-B6CYF3ZSWW" />
        
        <DatadogRUM />
        <UnitProvider>
          <Suspense>
            <NavBar />
          </Suspense>
          {children}
        </UnitProvider>
      </body>
    </html>
  );
}
