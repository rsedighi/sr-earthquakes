import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bay Tremor | Live Bay Area Earthquake Tracking',
    template: '%s | Bay Tremor',
  },
  description: 'Real-time earthquake tracking and analysis for the San Francisco Bay Area. Monitor seismic activity in San Ramon, Oakland, San Francisco, and surrounding regions with live USGS data.',
  keywords: ['earthquake', 'seismic', 'Bay Area', 'San Francisco', 'San Ramon', 'USGS', 'earthquake tracker', 'swarm', 'California', 'Bay Tremor'],
  authors: [{ name: 'Bay Tremor' }],
  creator: 'Bay Tremor',
  publisher: 'Bay Tremor',
  openGraph: {
    title: 'Bay Tremor | Live Bay Area Earthquake Tracking',
    description: 'Real-time earthquake tracking for the San Francisco Bay Area with live USGS data.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Bay Tremor',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Tremor',
    description: 'Real-time earthquake tracking for the San Francisco Bay Area',
    site: '@baytremor',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
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
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
