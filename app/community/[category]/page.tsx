import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Valid forum categories
const VALID_CATEGORIES = ['earthquake', 'general', 'neighborhood', 'preparedness', 'science'] as const;
type ForumCategory = typeof VALID_CATEGORIES[number];

const CATEGORY_NAMES: Record<ForumCategory, string> = {
  earthquake: 'Earthquake Discussions',
  general: 'General Discussion',
  neighborhood: 'Neighborhood',
  preparedness: 'Preparedness & Safety',
  science: 'Science & Research',
};

const CATEGORY_DESCRIPTIONS: Record<ForumCategory, string> = {
  earthquake: 'Discuss recent earthquakes, share your experiences, and learn from others in the Bay Area community.',
  general: 'Anything earthquake or Bay Area related. Connect with your community.',
  neighborhood: 'Local discussions by area. Find and connect with neighbors near you.',
  preparedness: 'Tips, emergency kits, and planning for earthquakes. Be prepared.',
  science: 'Seismology, geology, and earthquake research discussions.',
};

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) {
    return { title: 'Not Found' };
  }
  
  const name = CATEGORY_NAMES[category as ForumCategory];
  const description = CATEGORY_DESCRIPTIONS[category as ForumCategory];
  
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Bay Tremor Community`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) {
    notFound();
  }
  
  const summary = generateHistoricalSummary();
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard 
        historicalSummary={summary} 
        initialTab="community"
        forumCategory={category as ForumCategory}
      />
    </Suspense>
  );
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export const revalidate = 3600;


