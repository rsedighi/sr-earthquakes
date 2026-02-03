import { Suspense } from 'react';
import { BayTremorCommunity } from '@/components/bay-tremor-community';
import { NavBar } from '@/components/dashboard/components/nav-bar';
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
    title: `${name} | r/baytremor`,
    description,
    openGraph: {
      title: `${name} | r/baytremor Community`,
      description,
    },
  };
}

function CommunityLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-32 bg-gradient-to-r from-orange-600/50 to-amber-500/50" />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-neutral-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) {
    notFound();
  }
  
  return (
    <>
      <NavBar currentPath={`/community/${category}`} />
      <Suspense fallback={<CommunityLoading />}>
        <BayTremorCommunity />
      </Suspense>
    </>
  );
}

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export const revalidate = 60;
