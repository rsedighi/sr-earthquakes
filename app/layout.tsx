import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { generateHomepageSchemas } from '@/lib/seo';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bay Tremor | Live Bay Area Earthquake Tracking & Seismic Monitor',
    template: '%s | Bay Tremor',
  },
  description: 'Real-time earthquake tracking for the San Francisco Bay Area. Live USGS seismic data for San Ramon, Oakland, San Jose, San Francisco & more. Monitor earthquake swarms, view historical data, and stay informed about Bay Area seismic activity.',
  keywords: [
    // Primary keywords
    'Bay Area earthquakes',
    'San Francisco earthquake tracker',
    'Bay Area seismic activity',
    'California earthquake monitor',
    // Location-specific (high search volume)
    'San Ramon earthquake',
    'Oakland earthquake today',
    'San Jose earthquake',
    'Berkeley earthquake',
    'Hayward fault earthquake',
    'San Andreas fault',
    'Calaveras fault earthquake',
    // Action keywords
    'earthquake tracker',
    'live earthquake map',
    'real-time earthquake data',
    'earthquake near me California',
    // Informational keywords
    'earthquake swarm Bay Area',
    'Bay Area fault lines',
    'USGS earthquake data',
    'did I feel an earthquake',
    'earthquake history Bay Area',
    // Long-tail keywords
    'earthquakes today San Francisco Bay Area',
    'recent earthquakes California Bay Area',
    'earthquake activity near San Ramon',
  ],
  authors: [{ name: 'Bay Tremor', url: baseUrl }],
  creator: 'Bay Tremor',
  publisher: 'Bay Tremor',
  category: 'Science & Technology',
  classification: 'Earthquake Monitoring Service',
  openGraph: {
    title: 'Bay Tremor | Live Bay Area Earthquake Tracking',
    description: 'Real-time earthquake tracking for the San Francisco Bay Area. Monitor seismic activity with live USGS data, swarm detection, and historical analysis.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Bay Tremor',
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Bay Tremor - Live Bay Area Earthquake Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Tremor | Live Bay Area Earthquake Tracking',
    description: 'Real-time earthquake tracking for the San Francisco Bay Area with live USGS data.',
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
      'application/rss+xml': `${baseUrl}/feed.xml`,
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
        
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas),
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
