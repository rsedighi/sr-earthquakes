import { Metadata } from 'next';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Did You Feel an Earthquake? | Bay Area Earthquake Reports',
  description: 'Just felt an earthquake in San Francisco, Oakland, or the Bay Area? Check recent earthquakes near you and report what you felt. Real-time USGS data updated every minute.',
  keywords: [
    'did i feel an earthquake',
    'earthquake just now',
    'earthquake just now california',
    'did you feel that earthquake',
    'did i just feel an earthquake',
    'earthquake near me',
    'earthquake bay area just now',
    'san francisco earthquake just now',
    'oakland earthquake today',
    'earthquake felt',
    'earthquake report',
    'felt earthquake bay area',
    'earthquake shaking',
    'was there an earthquake',
    'earthquake california today',
  ],
  openGraph: {
    title: 'Did You Feel an Earthquake? | Report Bay Area Earthquakes',
    description: 'Just felt shaking? Check the latest earthquakes and report what you experienced. Real-time Bay Area earthquake data.',
    type: 'website',
    url: `${baseUrl}/felt-earthquake`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Bay Area Earthquake - Did You Feel It?',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Did You Feel an Earthquake? | Bay Area',
    description: 'Just felt shaking? Check the latest earthquakes and report what you experienced.',
  },
  alternates: {
    canonical: `${baseUrl}/felt-earthquake`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Generate structured data
function generateFeltEarthquakeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Did You Feel an Earthquake? - Bay Area Earthquake Reports',
    description: 'Report earthquake shaking intensity and view recent earthquakes near you in the San Francisco Bay Area.',
    url: `${baseUrl}/felt-earthquake`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    about: {
      '@type': 'Thing',
      name: 'Earthquake Felt Reports',
      description: 'Community reports of earthquake shaking intensity',
    },
    potentialAction: {
      '@type': 'ReportAction',
      name: 'Report Earthquake',
      description: 'Submit a report about earthquake shaking you experienced',
    },
  };
}

export default function FeltEarthquakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Did You Feel It?', url: `${baseUrl}/felt-earthquake` },
  ]);
  
  const pageSchema = generateFeltEarthquakeSchema();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, pageSchema]),
        }}
      />
      {children}
    </>
  );
}
