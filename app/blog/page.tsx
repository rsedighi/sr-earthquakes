import { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { Calendar, TrendingUp, AlertTriangle, Zap, BarChart3, ChevronRight, Newspaper, Activity, ArrowRight, Clock, MapPin, Flame } from 'lucide-react';
import { getBlogImagesBySlugs } from '@/lib/mongodb';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getAllBlogPosts, BlogPost } from '@/lib/blog-generator';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { getTimeOfDay } from '@/lib/image-prompts';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Bay Area Earthquake News & Reports | Bay Tremor',
  description: 'Breaking earthquake news, weekly roundups, monthly seismic reports, and swarm alerts for the San Francisco Bay Area. Stay informed with the latest seismic activity.',
  keywords: [
    'bay area earthquake news',
    'california earthquake news',
    'san francisco earthquake report',
    'earthquake weekly roundup',
    'seismic activity report',
    'earthquake swarm news',
    'bay area seismic news',
    'san ramon earthquake',
  ],
  openGraph: {
    title: 'Bay Area Earthquake News & Reports',
    description: 'Breaking earthquake news, weekly roundups, and alerts for the San Francisco Bay Area.',
    type: 'website',
    url: `${baseUrl}/blog`,
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
};

function getCategoryIcon(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return <Calendar className="w-4 h-4" />;
    case 'monthly-report':
      return <BarChart3 className="w-4 h-4" />;
    case 'breaking':
      return <AlertTriangle className="w-4 h-4" />;
    case 'swarm-alert':
      return <Zap className="w-4 h-4" />;
    default:
      return <TrendingUp className="w-4 h-4" />;
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

function getCategoryBgGradient(category: BlogPost['category']) {
  switch (category) {
    case 'weekly-roundup':
      return 'from-blue-500/5 to-transparent';
    case 'monthly-report':
      return 'from-purple-500/5 to-transparent';
    case 'breaking':
      return 'from-red-500/5 to-transparent';
    case 'swarm-alert':
      return 'from-amber-500/5 to-transparent';
    default:
      return 'from-neutral-500/5 to-transparent';
  }
}

// Time-based background gradients for cards
function getTimeBasedGradient(timestamp: number, category: BlogPost['category']) {
  const timeOfDay = getTimeOfDay(timestamp);
  
  // Category-specific base colors combined with time of day
  const categoryBase = {
    'breaking': { primary: 'red', secondary: 'orange' },
    'swarm-alert': { primary: 'amber', secondary: 'yellow' },
    'monthly-report': { primary: 'purple', secondary: 'indigo' },
    'weekly-roundup': { primary: 'blue', secondary: 'cyan' },
    'analysis': { primary: 'neutral', secondary: 'slate' },
  }[category] || { primary: 'blue', secondary: 'cyan' };
  
  // Time-based lighting effects
  const timeLighting = {
    dawn: 'via-orange-500/20',
    morning: 'via-yellow-400/15',
    midday: 'via-white/10',
    afternoon: 'via-amber-400/15',
    dusk: 'via-pink-500/25',
    evening: 'via-purple-500/20',
    night: 'via-indigo-900/30',
  }[timeOfDay];
  
  return `from-${categoryBase.primary}-900/90 ${timeLighting} to-${categoryBase.secondary}-900/70`;
}

// Get time of day emoji for display
function getTimeEmoji(timestamp: number): string {
  const timeOfDay = getTimeOfDay(timestamp);
  const emojis = {
    dawn: '🌅',
    morning: '🌤️',
    midday: '☀️',
    afternoon: '🌤️',
    dusk: '🌇',
    evening: '🌆',
    night: '🌃',
  };
  return emojis[timeOfDay];
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

export default async function BlogPage() {
  'use cache';
  cacheLife('hours');

  const allPosts = await getCachedBlogPosts();
  
  // Separate featured and regular posts
  const featuredPosts = allPosts.filter(p => p.featured).slice(0, 3);
  const recentPosts = allPosts.slice(0, 20);
  
  // Fetch existing blog images from database for featured posts
  const featuredSlugs = featuredPosts.map(p => p.slug);
  const blogImages = await getBlogImagesBySlugs(featuredSlugs);
  
  // Group posts by category for sidebar
  const postsByCategory = allPosts.reduce((acc, post) => {
    if (!acc[post.category]) acc[post.category] = [];
    acc[post.category].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
  ]);
  
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Bay Tremor Earthquake News',
    description: 'Breaking earthquake news, weekly roundups, and seismic reports for the San Francisco Bay Area.',
    url: `${baseUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    blogPost: recentPosts.slice(0, 10).map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date.toISOString(),
      url: `${baseUrl}/blog/${post.slug}`,
    })),
  };
  
  // Get breaking news for ticker
  const breakingNews = allPosts.filter(p => p.category === 'breaking' || (p.maxMagnitude && p.maxMagnitude >= 4.0)).slice(0, 3);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, blogSchema]),
        }}
      />
      
      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-red-600 text-white py-2 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <span className="flex-shrink-0 font-bold text-xs uppercase tracking-wider bg-white text-red-600 px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Breaking
            </span>
            <div className="overflow-hidden flex-1">
              <div className="flex gap-8 animate-marquee whitespace-nowrap">
                {breakingNews.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="hover:underline inline-flex items-center gap-2">
                    <span className="font-semibold">{post.maxMagnitude && post.maxMagnitude >= 4.0 ? `M${post.maxMagnitude.toFixed(1)}` : ''}</span>
                    <span>{post.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero gradient */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-red-500/10 via-orange-500/5 to-transparent pointer-events-none"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-white">Blog</li>
          </ol>
        </nav>
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl border border-white/10">
              <Newspaper className="w-8 h-8 text-red-400" />
            </div>
            <span className="text-sm text-neutral-500 font-medium">
              San Francisco Bay Area
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Earthquake News
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              & Reports
            </span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed">
            Comprehensive earthquake coverage for the San Francisco Bay Area. Breaking news, 
            weekly roundups, monthly reports, and swarm alerts.
          </p>
          
          {/* Latest Update Callout */}
          {allPosts[0] && (
            <Link 
              href={`/blog/${allPosts[0].slug}`}
              className="group block mt-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Latest Update</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-xs text-neutral-400">
                      {allPosts[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {allPosts[0].title}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{allPosts[0].description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          )}
        </header>
        
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              Top Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => {
                const timestamp = post.imageContext?.timestamp || post.date.getTime();
                const city = post.imageContext?.primaryCity || post.affectedCities?.[0] || 'Bay Area';
                const dbImage = blogImages.get(post.slug);
                const heroImageUrl = dbImage?.imageUrl;
                
                return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={`group relative rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-black/30 transition-all ${
                    index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  {/* Hero image from database if available, otherwise gradient */}
                  {heroImageUrl ? (
                    <div className="absolute inset-0">
                      <img 
                        src={heroImageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    </div>
                  ) : (
                    <div className={`absolute inset-0 ${
                      post.category === 'breaking' 
                        ? 'bg-gradient-to-br from-red-900/90 via-red-800/80 to-orange-900/70' 
                        : post.category === 'swarm-alert'
                        ? 'bg-gradient-to-br from-amber-900/90 via-orange-800/80 to-yellow-900/70'
                        : post.category === 'monthly-report'
                        ? 'bg-gradient-to-br from-purple-900/90 via-indigo-800/80 to-blue-900/70'
                        : 'bg-gradient-to-br from-blue-900/90 via-cyan-800/80 to-teal-900/70'
                    }`}>
                      {/* Seismic wave pattern overlay */}
                      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 400">
                        <defs>
                          <pattern id={`waves-${index}`} patternUnits="userSpaceOnUse" width="100" height="100">
                            <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="50" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="70" fill="none" stroke="white" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="400" height="400" fill={`url(#waves-${index})`} />
                      </svg>
                      {/* Time of day indicator */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-white/80">
                        <span>{getTimeEmoji(timestamp)}</span>
                        <span>{city}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className={`relative p-6 h-full flex flex-col ${index === 0 ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
                    {/* Breaking badge */}
                    {post.category === 'breaking' && (
                      <div className="absolute top-0 right-0 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                        Breaking
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/20 text-white`}>
                        {getCategoryIcon(post.category)}
                        {getCategoryLabel(post.category)}
                      </span>
                      {post.maxMagnitude && post.maxMagnitude >= 3.5 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-600/90 text-white flex items-center gap-1 shadow-lg">
                          <Activity className="w-3 h-3" />
                          M{post.maxMagnitude.toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1"></div>
                    
                    <h3 className={`font-bold mb-3 text-white group-hover:text-yellow-200 transition-colors leading-tight drop-shadow-lg ${
                      index === 0 ? 'text-2xl md:text-4xl' : 'text-lg'
                    }`}>
                      {post.title}
                    </h3>
                    
                    <p className={`text-white/80 mb-4 ${index === 0 ? 'text-base' : 'line-clamp-2 text-sm'}`}>
                      {post.description}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-white/70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {post.earthquakeCount && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5" />
                            {post.earthquakeCount} quakes
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-white font-semibold bg-white/20 px-3 py-1 rounded-full group-hover:bg-white/30 transition-all">
                        Read <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
              })}
            </div>
          </section>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Recent Posts
            </h2>
            <div className="space-y-4">
              {recentPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-neutral-900/50 rounded-xl border border-white/10 p-5 hover:border-white/20 hover:bg-neutral-900 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${getCategoryColor(post.category)}`}>
                          {getCategoryIcon(post.category)}
                          {getCategoryLabel(post.category)}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-neutral-400 line-clamp-2">
                        {post.description}
                      </p>
                      {post.affectedCities && post.affectedCities.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                          <MapPin className="w-3 h-3" />
                          {post.affectedCities.slice(0, 3).join(', ')}
                          {post.affectedCities.length > 3 && ` +${post.affectedCities.length - 3}`}
                        </div>
                      )}
                    </div>
                    {post.earthquakeCount && (
                      <div className="text-right flex-shrink-0 bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="text-2xl font-bold">{post.earthquakeCount}</div>
                        <div className="text-xs text-neutral-500">quakes</div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Categories */}
              <div className="bg-neutral-900 rounded-2xl border border-white/10 p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Categories
                </h3>
                <ul className="space-y-3">
                  {Object.entries(postsByCategory).map(([category, posts]) => (
                    <li key={category}>
                      <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className={`flex items-center gap-2 ${getCategoryColor(category as BlogPost['category']).split(' ')[1]}`}>
                          {getCategoryIcon(category as BlogPost['category'])}
                          {getCategoryLabel(category as BlogPost['category'])}
                        </span>
                        <span className="text-neutral-500 bg-white/5 px-2 py-0.5 rounded">{posts.length}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Quick Links */}
              <div className="bg-neutral-900 rounded-2xl border border-white/10 p-5">
                <h3 className="font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Live Earthquake Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/felt-earthquake" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Did You Feel It?
                    </Link>
                  </li>
                  <li>
                    <Link href="/earthquake-preparedness" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                      <Calendar className="w-4 h-4 text-green-400" />
                      Preparedness Guide
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* iOS App CTA */}
              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-5 relative overflow-hidden">
                {/* Subtle glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">Coming Soon</span>
                  </div>
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    📱 iOS App
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-3">
                    Real-time alerts, widgets & maps. Be first to get notified when we launch.
                  </p>
                  <Link href="/ios" className="block w-full text-center py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-orange-500/20">
                    Join Waitlist →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

