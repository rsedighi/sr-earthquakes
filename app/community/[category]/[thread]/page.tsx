import { Suspense } from 'react';
import { ThreadDetailView } from '@/components/bay-tremor-community';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

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
    title: `${threadTitle} | Bay Tremor Community`,
    description: `Discussion thread in the Bay Tremor community.`,
    openGraph: {
      title: `${threadTitle} | Bay Tremor Community`,
      description: `Join the discussion in the Bay Area earthquake community.`,
    },
  };
}

function ThreadLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );
}

export default async function ThreadPage({ params }: Props) {
  const { category, thread } = await params;
  
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) {
    notFound();
  }
  
  return (
    <div className="pb-20 md:pb-0">
      <Suspense fallback={<ThreadLoading />}>
        <ThreadDetailView slug={thread} category={category as ForumCategory} />
      </Suspense>
    </div>
  );
}
