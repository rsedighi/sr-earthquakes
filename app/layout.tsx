import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { generateHomepageSchemas } from '@/lib/seo';
import { DatadogRUM } from '@/components/datadog-rum';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bay Area Earthquake Tracker | Live Seismic Activity Today - Bay Tremor',
    template: '%s | Bay Tremor',
  },
  description: '🔴 LIVE: Track Bay Area earthquakes in real-time. See the latest seismic activity in San Francisco, Oakland, San Jose & 80+ cities. Did you feel an earthquake? Check here for live USGS data updated every minute.',
  keywords: [
    // Primary keywords - highest priority
    'bay area earthquake',
    'bay area earthquake today',
    'earthquake today',
    'san francisco earthquake',
    'did i feel an earthquake',
    // Location-specific (high search volume)
    'san francisco earthquake today',
    'oakland earthquake today',
    'san jose earthquake today',
    'berkeley earthquake',
    'san ramon earthquake',
    'fremont earthquake',
    'hayward earthquake',
    // Fault lines
    'hayward fault earthquake',
    'san andreas fault',
    'calaveras fault earthquake',
    // Action keywords
    'earthquake tracker',
    'live earthquake map',
    'earthquake near me california',
    'earthquake just now',
    'latest earthquake bay area',
    // Informational keywords
    'earthquake swarm bay area',
    'bay area fault lines',
    'usgs earthquake data',
    'earthquake history bay area',
    // Long-tail keywords
    'earthquakes today san francisco bay area',
    'recent earthquakes california',
    'earthquake activity near me',
    'what was that earthquake',
  ],
  authors: [{ name: 'Bay Tremor', url: baseUrl }],
  creator: 'Bay Tremor',
  publisher: 'Bay Tremor',
  category: 'Science & Technology',
  classification: 'Earthquake Monitoring Service',
  openGraph: {
    title: 'Bay Area Earthquake Tracker | Live Updates Today',
    description: '🔴 LIVE: Track Bay Area earthquakes in real-time. See the latest seismic activity in San Francisco, Oakland, San Jose & 80+ cities. Updated every minute.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Bay Tremor',
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Bay Area Earthquake Tracker - Live Seismic Activity Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Area Earthquake Tracker | Live Updates',
    description: '🔴 LIVE: Track Bay Area earthquakes in real-time. Did you feel an earthquake? Check here.',
    site: '@baytremor',
    creator: '@baytremor',
    images: [`${baseUrl}/og-image.png`],
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
        
        {/* Impact.com Site Verification */}
        <meta name="impact-site-verification" value="f0b61dfc-b575-4c4c-ab15-c6c6df6d9cff" />
        
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2599154949047210"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {/* JSON-LD Structured Data for SEO - placed in body to avoid AdSense conflicts */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas),
          }}
        />
        <DatadogRUM />
        {children}
      </body>
    </html>
  );
}
