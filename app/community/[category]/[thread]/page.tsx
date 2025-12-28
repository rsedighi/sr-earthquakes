import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { generateHistoricalSummary } from '@/lib/server-data';
import { DashboardLoading } from '@/components/dashboard-loading';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Valid forum categories
const VALID_CATEGORIES = ['earthquake', 'general', 'neighborhood', 'preparedness', 'science'] as const;
type ForumCategory = typeof VALID_CATEGORIES[number];

interface Props {
  params: Promise<{ category: string; thread: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, thread } = await params;
  
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) {
    return { title: 'Not Found' };
  }
  
  // Format thread slug for title
  const threadTitle = thread
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: threadTitle,
    description: `Discussion thread in the Bay Tremor community forum.`,
    openGraph: {
      title: `${threadTitle} | Bay Tremor Community`,
      description: `Join the discussion in the Bay Tremor earthquake community.`,
    },
  };
}

export default async function ThreadPage({ params }: Props) {
  const { category, thread } = await params;
  
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
        forumThread={thread}
      />
    </Suspense>
  );
}

export const revalidate = 3600;


