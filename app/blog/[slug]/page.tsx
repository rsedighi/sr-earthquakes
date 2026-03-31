import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, TrendingUp, AlertTriangle, Zap, BarChart3, 
  Share2, Clock, MapPin, ChevronRight, Activity, Users, ExternalLink,
  Shield, Bell, Home as HomeIcon, Info, FileText
} from 'lucide-react';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getAllBlogPosts, getBlogPostBySlug, BlogPost } from '@/lib/blog-generator';
import { generateBreadcrumbSchema } from '@/lib/seo';
import HeroImageGenerator from '@/components/HeroImageGenerator';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getCategoryIcon(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return <Calendar className="w-5 h-5" />;
    case 'monthly-report':
      return <BarChart3 className="w-5 h-5" />;
    case 'breaking':
      return <AlertTriangle className="w-5 h-5" />;
    case 'swarm-alert':
      return <Zap className="w-5 h-5" />;
    default:
      return <TrendingUp className="w-5 h-5" />;
  }
}

function getCategoryColor(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'monthly-report':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'breaking':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'swarm-alert':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  }
}

function getCategoryGradient(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return 'from-blue-500/10 via-transparent to-transparent';
    case 'monthly-report':
      return 'from-purple-500/10 via-transparent to-transparent';
    case 'breaking':
      return 'from-red-500/10 via-transparent to-transparent';
    case 'swarm-alert':
      return 'from-amber-500/10 via-transparent to-transparent';
    default:
      return 'from-neutral-500/10 via-transparent to-transparent';
  }
}

function getCategoryLabel(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return 'Weekly Roundup';
    case 'monthly-report':
      return 'Monthly Report';
    case 'breaking':
      return 'Breaking News';
    case 'swarm-alert':
      return 'Swarm Alert';
    default:
      return 'Analysis';
  }
}


async function getCachedBlogPosts() {
  'use cache';
  cacheLife('hours');

  const earthquakes = await loadAllEarthquakes();
  return getAllBlogPosts(earthquakes);
}

async function getCachedBlogPostBySlug(slug: string) {
  'use cache';
  cacheLife('hours');

  const earthquakes = await loadAllEarthquakes();
  return getBlogPostBySlug(earthquakes, slug);
}

export async function generateStaticParams() {
  const posts = await getCachedBlogPosts();
  
  return posts.slice(0, 50).map(post => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getCachedBlogPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return { title: 'Post Not Found' };
  }
  
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date.toISOString(),
      modifiedTime: post.date.toISOString(),
      url: `${baseUrl}/blog/${post.slug}`,
      images: [{
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: post.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

// Parse content into structured sections
interface ContentSection {
  type: 'heading' | 'paragraph' | 'table' | 'list' | 'link-card' | 'stat-box' | 'divider' | 'callout';
  level?: number;
  text?: string;
  items?: string[];
  rows?: string[][];
  href?: string;
  variant?: 'info' | 'warning' | 'success';
}

function parseContent(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = markdown.split('\n');
  let currentList: string[] = [];
  let currentTable: string[][] = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // Flush current list if any
      if (currentList.length > 0) {
        sections.push({ type: 'list', items: [...currentList] });
        currentList = [];
      }
      // Flush current table if any
      if (currentTable.length > 0) {
        sections.push({ type: 'table', rows: [...currentTable] });
        currentTable = [];
        inTable = false;
      }
      continue;
    }
    
    // Horizontal rule
    if (line === '---') {
      if (currentList.length > 0) {
        sections.push({ type: 'list', items: [...currentList] });
        currentList = [];
      }
      sections.push({ type: 'divider' });
      continue;
    }
    
    // Headers
    if (line.startsWith('### ')) {
      if (currentList.length > 0) {
        sections.push({ type: 'list', items: [...currentList] });
        currentList = [];
      }
      sections.push({ type: 'heading', level: 3, text: line.slice(4) });
      continue;
    }
    if (line.startsWith('## ')) {
      if (currentList.length > 0) {
        sections.push({ type: 'list', items: [...currentList] });
        currentList = [];
      }
      sections.push({ type: 'heading', level: 2, text: line.slice(3) });
      continue;
    }
    
    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Skip separator rows
      if (cells.every(c => c.match(/^-+$/))) {
        continue;
      }
      currentTable.push(cells);
      inTable = true;
      continue;
    }
    
    // Flush table if we hit a non-table line while in table
    if (inTable && currentTable.length > 0) {
      sections.push({ type: 'table', rows: [...currentTable] });
      currentTable = [];
      inTable = false;
    }
    
    // List items
    if (line.startsWith('- ')) {
      currentList.push(line.slice(2));
      continue;
    }
    
    // Flush list if we hit a non-list line
    if (currentList.length > 0) {
      sections.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
    
    // Link cards (special format: [text →](url))
    if (line.match(/\[.+→\]\(.+\)/)) {
      const match = line.match(/\[(.+?)→?\]\((.+?)\)/);
      if (match) {
        sections.push({ type: 'link-card', text: match[1].trim(), href: match[2] });
        continue;
      }
    }
    
    // Regular paragraphs
    if (line && !line.startsWith('*This')) {
      sections.push({ type: 'paragraph', text: line });
    }
  }
  
  // Flush remaining items
  if (currentList.length > 0) {
    sections.push({ type: 'list', items: currentList });
  }
  if (currentTable.length > 0) {
    sections.push({ type: 'table', rows: currentTable });
  }
  
  return sections;
}

// Format text with inline styles
function formatInlineText(text: string): React.ReactNode {
  // Replace bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Handle links
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [, linkText, href] = linkMatch;
      const before = part.slice(0, part.indexOf('['));
      const after = part.slice(part.indexOf(')') + 1);
      return (
        <span key={i}>
          {before}
          <Link prefetch={false} href={href} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
            {linkText}
          </Link>
          {after}
        </span>
      );
    }
    return part;
  });
}

// Render content sections as styled components
function ContentRenderer({ sections, category }: { sections: ContentSection[]; category: BlogPost['category'] }) {
  const categoryAccent = {
    'weekly-roundup': 'blue',
    'monthly-report': 'purple',
    'breaking': 'red',
    'swarm-alert': 'amber',
    'analysis': 'neutral',
  }[category] || 'blue';
  
  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        switch (section.type) {
          case 'heading':
            if (section.level === 2) {
              return (
                <h2 key={index} className="text-2xl font-bold text-white mt-10 mb-4 pb-3 border-b border-white/10 flex items-center gap-3">
                  <span className={`w-1 h-6 rounded-full bg-${categoryAccent}-500`}></span>
                  {section.text}
                </h2>
              );
            }
            return (
              <h3 key={index} className="text-xl font-semibold text-white mt-8 mb-3">
                {section.text}
              </h3>
            );
          
          case 'paragraph':
            return (
              <p key={index} className="text-neutral-300 leading-relaxed">
                {formatInlineText(section.text || '')}
              </p>
            );
          
          case 'table':
            if (!section.rows || section.rows.length === 0) return null;
            return (
              <div key={index} className="overflow-x-auto my-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/20">
                      {section.rows[0].map((cell, cellIndex) => (
                        <th 
                          key={cellIndex} 
                          className="text-left py-3 px-4 text-neutral-400 font-medium text-sm uppercase tracking-wide"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.slice(1).map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex} 
                            className="py-3 px-4 text-neutral-300"
                          >
                            {formatInlineText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          
          case 'list':
            if (!section.items || section.items.length === 0) return null;
            return (
              <ul key={index} className="space-y-2 my-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3 text-neutral-300">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${categoryAccent}-400 mt-2.5 flex-shrink-0`}></span>
                    <span>{formatInlineText(item)}</span>
                  </li>
                ))}
              </ul>
            );
          
          case 'link-card':
            return (
              <Link
                prefetch={false}
                key={index}
                href={section.href || '#'}
                className="block p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] hover:border-white/20 transition-all group my-4"
              >
                <span className="flex items-center justify-between text-blue-400 group-hover:text-blue-300">
                  <span className="font-medium">{section.text}</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          
          case 'divider':
            return (
              <div key={index} className="my-10 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <Activity className={`w-4 h-4 text-${categoryAccent}-500/50`} />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = await getCachedBlogPostBySlug(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }
  
  // Parse content into sections
  const contentSections = parseContent(post.content);
  
  // Get related posts (same category, different slug)
  const allPosts = await getCachedBlogPosts();
  const relatedPosts = allPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);
  
  // Get recent posts for sidebar
  const recentPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 5);
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
  ]);
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.description,
    datePublished: post.date.toISOString(),
    dateModified: post.date.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/android-chrome-512x512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    image: `${baseUrl}/og-image.png`,
    keywords: post.tags.join(', '),
    articleSection: getCategoryLabel(post.category),
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, articleSchema]),
        }}
      />
      
      {/* Hero gradient background */}
      <div className={`absolute inset-x-0 top-0 h-96 bg-gradient-to-b ${getCategoryGradient(post.category)} pointer-events-none`}></div>
      
      <article className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
            <li><Link prefetch={false} href="/" className="hover:text-white transition-colors flex items-center gap-1"><HomeIcon className="w-3.5 h-3.5" /> Home</Link></li>
            <li className="text-neutral-600">/</li>
            <li><Link prefetch={false} href="/blog" className="hover:text-white transition-colors flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Blog</Link></li>
            <li className="text-neutral-600">/</li>
            <li className="text-neutral-300">{getCategoryLabel(post.category)}</li>
          </ol>
        </nav>
        
        {/* Back Link */}
        <Link prefetch={false} 
          href="/blog"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Blog
        </Link>
        
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border ${getCategoryColor(post.category)}`}>
              {getCategoryIcon(post.category)}
              {getCategoryLabel(post.category)}
            </span>
            {post.maxMagnitude && post.maxMagnitude >= 3.5 && (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                M{post.maxMagnitude.toFixed(1)} Peak
              </span>
            )}
            {post.earthquakeCount && (
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-neutral-300 border border-white/10">
                {post.earthquakeCount} earthquakes
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight bg-clip-text">
            {post.title}
          </h1>
          
          <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
            {post.description}
          </p>
          
          {/* Meta info bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 bg-white/[0.02] rounded-xl p-4 border border-white/5">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>
                <span className="text-neutral-500">Updated </span>
                <span className="text-neutral-300">
                  {post.date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}, {post.date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} PT
                </span>
              </span>
            </span>
            {post.affectedCities && post.affectedCities.length > 0 && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-300">
                  {post.affectedCities.slice(0, 3).join(', ')}
                  {post.affectedCities.length > 3 && <span className="text-neutral-500"> +{post.affectedCities.length - 3} more</span>}
                </span>
              </span>
            )}
          </div>
        </header>
        
        {/* Hero Image Section - Interactive AI Generation */}
        <HeroImageGenerator 
          imageContext={post.imageContext}
          title={post.title}
          category={post.category}
          slug={post.slug}
          date={post.date}
        />
        
        {/* Key Stats Cards (for roundups and reports) */}
        {(post.category === 'weekly-roundup' || post.category === 'monthly-report') && post.earthquakeCount && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">{post.earthquakeCount}</div>
              <div className="text-sm text-neutral-500">Total Earthquakes</div>
            </div>
            {post.maxMagnitude && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-white mb-1">M{post.maxMagnitude.toFixed(1)}</div>
                <div className="text-sm text-neutral-500">Largest Magnitude</div>
              </div>
            )}
            {post.affectedCities && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-white mb-1">{post.affectedCities.length}</div>
                <div className="text-sm text-neutral-500">Cities Affected</div>
              </div>
            )}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="text-lg font-bold text-white mb-1">
                {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm text-neutral-500">Updated</div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="bg-neutral-900/50 rounded-2xl border border-white/10 p-6 md:p-10 mb-10">
          <ContentRenderer sections={contentSections} category={post.category} />
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link prefetch={false} 
            href="/"
            className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors group"
          >
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Live Map</div>
              <div className="text-sm text-neutral-500">View real-time data</div>
            </div>
          </Link>
          <Link prefetch={false} 
            href="/felt-earthquake"
            className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors group"
          >
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">Report Shaking</div>
              <div className="text-sm text-neutral-500">Did you feel it?</div>
            </div>
          </Link>
          <Link prefetch={false} 
            href="/earthquake-preparedness"
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors group"
          >
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-green-400 transition-colors">Be Prepared</div>
              <div className="text-sm text-neutral-500">Safety guide</div>
            </div>
          </Link>
        </div>
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-medium text-neutral-500 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Topics covered
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-sm bg-white/5 text-neutral-400 px-4 py-2 rounded-full border border-white/5 hover:border-white/10 transition-colors">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Share */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 p-6 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Found this useful?</h3>
                <p className="text-sm text-neutral-400">Share this report with friends and family</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${baseUrl}/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="Share on Twitter"
              >
                <Share2 className="w-5 h-5" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${baseUrl}/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="Share on Facebook"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-neutral-500" />
              Related Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map(related => (
                <Link
                  prefetch={false}
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-neutral-900 rounded-xl border border-white/10 p-5 hover:border-white/20 hover:bg-neutral-900/80 transition-all group"
                >
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(related.category)}`}>
                    {getCategoryLabel(related.category)}
                  </span>
                  <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {related.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{related.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {related.earthquakeCount && <span>{related.earthquakeCount} quakes</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Recent Posts */}
        <section className="bg-neutral-900 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            More from Bay Tremor
          </h2>
          <ul className="space-y-3">
            {recentPosts.map(recent => (
              <li key={recent.slug}>
                <Link
                  prefetch={false}
                  href={`/blog/${recent.slug}`}
                  className="flex items-center justify-between gap-4 p-3 -mx-3 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      recent.category === 'breaking' ? 'bg-red-400' :
                      recent.category === 'swarm-alert' ? 'bg-amber-400' :
                      recent.category === 'monthly-report' ? 'bg-purple-400' :
                      'bg-blue-400'
                    }`}></span>
                    <span className="truncate">{recent.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
          <Link prefetch={false} 
            href="/blog"
            className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            View all posts
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </section>
        
        {/* Data source attribution */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-neutral-500">
            Data source: 
            <a href="https://earthquake.usgs.gov" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              USGS Earthquake Hazards Program
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
