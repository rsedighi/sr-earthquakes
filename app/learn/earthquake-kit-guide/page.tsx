'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Star,
  Check,
  ChevronRight,
  ExternalLink,
  Award,
  Users,
  Activity,
  MapPin,
  Clock,
  AlertTriangle,
  Droplets,
  Radio,
  Home,
  Heart,
  Package,
  ArrowRight,
  Bookmark,
  Share2,
  Truck,
} from 'lucide-react';
import { AFFILIATE_PRODUCTS, AffiliateProduct } from '@/lib/affiliate-products';

// Table of contents sections
const TABLE_OF_CONTENTS = [
  { id: 'why-trust', label: 'Why Trust This Guide' },
  { id: 'quick-picks', label: 'Our Top Picks' },
  { id: 'before-products', label: 'What to Do During an Earthquake' },
  { id: 'emergency-kits', label: 'Emergency Kits' },
  { id: 'water-storage', label: 'Water Storage' },
  { id: 'furniture-safety', label: 'Furniture Safety' },
  { id: 'communication', label: 'Power & Communication' },
  { id: 'first-aid', label: 'First Aid' },
  { id: 'checklist', label: 'Your Preparedness Checklist' },
  { id: 'faq', label: 'FAQ' },
];

// Helper to get top pick for a category
function getTopPick(category: AffiliateProduct['category']): AffiliateProduct | undefined {
  return AFFILIATE_PRODUCTS.find(p => p.category === category && p.badge === 'best-seller') ||
    AFFILIATE_PRODUCTS.find(p => p.category === category && p.badge === 'editor-pick') ||
    AFFILIATE_PRODUCTS.find(p => p.category === category);
}

// Product Card Component (Wirecutter-style)
function ProductPick({
  product,
  pickLabel = 'Our Pick',
  pickDescription,
}: {
  product: AffiliateProduct;
  pickLabel?: string;
  pickDescription?: string;
}) {
  return (
    <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl overflow-hidden">
      {/* Pick Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 font-bold text-sm uppercase tracking-wide">
            {pickLabel}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white">{product.name}</h3>
        {pickDescription && (
          <p className="text-sm text-neutral-400 mt-1">{pickDescription}</p>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Product Image */}
          <div className="sm:w-48 flex-shrink-0">
            <div className="aspect-square bg-white rounded-xl overflow-hidden relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-4"
                loading="lazy"
              />
            </div>
            {product.primeEligible && (
              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-[#FF9900]">
                <Truck className="w-3.5 h-3.5" />
                <span className="font-semibold">Prime Eligible</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1">
            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-amber-400 font-medium">{product.rating}</span>
              <span className="text-sm text-neutral-500">
                ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            {/* Description */}
            <p className="text-neutral-300 mb-4 leading-relaxed">
              {product.description}
            </p>

            {/* Why We Recommend */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Why we recommend it:</h4>
              <p className="text-sm text-neutral-400">{product.whyRecommended}</p>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <span className="text-3xl font-bold text-white">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through ml-2">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                Buy on Amazon
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alternative Products Component
function AlternativePicks({ products }: { products: AffiliateProduct[] }) {
  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-white mb-4">Also Great</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all"
          >
            <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 overflow-hidden relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-2"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {product.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    product.badge === 'best-value' ? 'bg-green-500/20 text-green-400' :
                    product.badge === 'most-popular' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {product.badge === 'best-value' ? 'Best Value' : 
                     product.badge === 'most-popular' ? 'Popular' : 'Recommended'}
                  </span>
                )}
              </div>
              <h5 className="font-medium text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {product.shortName}
              </h5>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-neutral-400">{product.rating}</span>
                <span className="text-xs text-neutral-500">({product.reviewCount.toLocaleString()})</span>
              </div>
              <div className="mt-2 font-bold text-white">${product.price}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Section Component
function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
          <Icon className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function EarthquakeKitGuidePage() {
  const [activeSection, setActiveSection] = useState('why-trust');

  const topKitPick = getTopPick('emergency-kit');
  const topWaterPick = getTopPick('water-storage');
  const topFurniturePick = getTopPick('furniture-safety');
  const topCommPick = getTopPick('communication');
  const topFirstAidPick = getTopPick('first-aid');

  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <header className="relative py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.1),transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Bay Tremor</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/learn" className="hover:text-white transition-colors">Learn</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-400">Earthquake Kit Guide</span>
          </nav>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            The Best Tools for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Earthquake Preparedness
            </span>
          </h1>
          
          <p className="text-xl text-neutral-400 max-w-2xl mb-6">
            A Bay Area local&apos;s guide to building the right earthquake kit. 
            We track earthquakes daily and surveyed thousands of households to find what actually works.
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Updated January 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Based on 5,400+ users
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Bay Area Focused
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3 mt-8">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
              <Bookmark className="w-4 h-4" />
              Save Guide
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* FYI Banner - like Wirecutter */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-12">
          <h3 className="font-semibold text-amber-400 mb-1">FYI</h3>
          <p className="text-sm text-neutral-300">
            This guide focuses on Bay Area earthquake preparedness. We&apos;ve prioritized 
            apartment-friendly solutions and items that work for our region&apos;s specific risks. 
            Products are selected based on ratings, reviews, Prime availability, and community feedback.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
          <h2 className="font-semibold text-white mb-4">In This Guide</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {TABLE_OF_CONTENTS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 transition-colors py-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* Why Trust Us */}
          <Section id="why-trust" icon={Shield} title="Why You Should Trust This Guide">
            <div className="prose prose-invert prose-lg max-w-none">
              <p>
                We&apos;re not just another product review site. Bay Tremor was built by Bay Area 
                residents who track earthquakes in real-time. Here&apos;s why our recommendations matter:
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 not-prose my-8">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                  <Activity className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-sm text-neutral-500">Earthquakes tracked monthly</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">5,400+</div>
                  <div className="text-sm text-neutral-500">Bay Area households served</div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                  <MapPin className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">Local</div>
                  <div className="text-sm text-neutral-500">Bay Area focused</div>
                </div>
              </div>

              <p>
                Our recommendations come from actually living here, talking to our community, 
                and understanding that most Bay Area residents live in apartments—not houses 
                with garages full of supplies. We prioritize:
              </p>

              <ul>
                <li><strong>Apartment-friendly options</strong> that don&apos;t require a garage</li>
                <li><strong>Products with 4.5+ stars</strong> and 1,000+ reviews</li>
                <li><strong>Prime-eligible items</strong> for fast shipping</li>
                <li><strong>Actual user feedback</strong> from our Bay Area community</li>
              </ul>
            </div>
          </Section>

          {/* Quick Picks */}
          <Section id="quick-picks" icon={Award} title="Our Top Picks at a Glance">
            <p className="text-neutral-400 mb-6">
              In a hurry? Here are our top recommendations across categories:
            </p>
            
            <div className="space-y-4">
              {[
                { category: 'Emergency Kit', product: topKitPick, reason: 'Best overall kit for Bay Area households' },
                { category: 'Water Storage', product: topWaterPick, reason: 'Perfect for apartment dwellers' },
                { category: 'Furniture Safety', product: topFurniturePick, reason: 'Museum-grade protection' },
                { category: 'Power & Communication', product: topCommPick, reason: 'Works when power is out' },
              ].filter(item => item.product).map((item) => (
                <a
                  key={item.category}
                  href={item.product!.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="group flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all"
                >
                  <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden relative">
                    <img
                      src={item.product!.imageUrl}
                      alt={item.product!.name}
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-1">
                      {item.category}
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {item.product!.shortName}
                    </h3>
                    <p className="text-sm text-neutral-500">{item.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-white">${item.product!.price}</div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {item.product!.rating}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                </a>
              ))}
            </div>
          </Section>

          {/* What to Do During an Earthquake */}
          <Section id="before-products" icon={AlertTriangle} title="First: What to Do During an Earthquake">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <h3 className="font-bold text-red-400 text-lg mb-3">Drop, Cover, Hold On</h3>
              <p className="text-neutral-300 mb-4">
                Before we talk about products, let&apos;s make sure you know what to do when 
                the shaking starts. This sequence is based on decades of research:
              </p>
              <ol className="space-y-3 text-neutral-300">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-red-500/30 text-red-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span><strong>DROP</strong> to your hands and knees to prevent being knocked down.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-red-500/30 text-red-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span><strong>COVER</strong> your head and neck under a sturdy desk or table. If no shelter nearby, get near an interior wall.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-red-500/30 text-red-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span><strong>HOLD ON</strong> until the shaking stops. If under shelter, hold onto it with one hand.</span>
                </li>
              </ol>
            </div>
            
            <p className="text-neutral-400">
              Now that you know what to do during a quake, let&apos;s talk about how to prepare your home 
              and build a kit that will help you in the aftermath.
            </p>
          </Section>

          {/* Emergency Kits */}
          <Section id="emergency-kits" icon={Package} title="Emergency Kits">
            <div className="prose prose-invert max-w-none mb-8">
              <p>
                A good emergency kit should sustain you for at least 72 hours without outside help. 
                After a major earthquake, emergency services will be stretched thin, and you may 
                not have access to stores, running water, or electricity.
              </p>
              <p>
                We evaluated dozens of pre-made kits based on completeness, quality of components, 
                and value. Here&apos;s what stood out:
              </p>
            </div>

            {topKitPick && (
              <ProductPick
                product={topKitPick}
                pickLabel="Best Overall"
                pickDescription="Our top choice for most Bay Area households"
              />
            )}

            <AlternativePicks
              products={AFFILIATE_PRODUCTS.filter(
                p => p.category === 'emergency-kit' && p.id !== topKitPick?.id
              ).slice(0, 2)}
            />
          </Section>

          {/* Water Storage */}
          <Section id="water-storage" icon={Droplets} title="Water Storage">
            <div className="prose prose-invert max-w-none mb-8">
              <p>
                According to a report by the city of Los Angeles, &quot;The water system is the 
                utility most vulnerable to earthquake damage.&quot; You need at least one gallon 
                per person per day—ideally enough for 2 weeks.
              </p>
              <p>
                For apartment dwellers (most of us in the Bay Area), the challenge is storage space. 
                We focused on solutions that are practical for smaller living spaces.
              </p>
            </div>

            {topWaterPick && (
              <ProductPick
                product={topWaterPick}
                pickLabel="Best for Apartments"
                pickDescription="Brilliant solution that doesn't require storage space"
              />
            )}

            <AlternativePicks
              products={AFFILIATE_PRODUCTS.filter(
                p => p.category === 'water-storage' && p.id !== topWaterPick?.id
              ).slice(0, 2)}
            />
          </Section>

          {/* Furniture Safety */}
          <Section id="furniture-safety" icon={Home} title="Furniture Safety">
            <div className="prose prose-invert max-w-none mb-8">
              <p>
                Most earthquake injuries come from falling objects—not from buildings collapsing. 
                Securing your furniture is one of the most impactful things you can do, and it&apos;s 
                surprisingly affordable.
              </p>
              <p>
                The products we recommend are used by museums and hospitals to protect priceless 
                artifacts. They work just as well for your bookshelf and TV.
              </p>
            </div>

            {topFurniturePick && (
              <ProductPick
                product={topFurniturePick}
                pickLabel="Industry Standard"
                pickDescription="What museums and hospitals use"
              />
            )}

            <AlternativePicks
              products={AFFILIATE_PRODUCTS.filter(
                p => p.category === 'furniture-safety' && p.id !== topFurniturePick?.id
              ).slice(0, 2)}
            />
          </Section>

          {/* Communication & Power */}
          <Section id="communication" icon={Radio} title="Power & Communication">
            <div className="prose prose-invert max-w-none mb-8">
              <p>
                When the power goes out, you need a way to stay informed and keep your devices charged. 
                An emergency radio with multiple power sources (solar, hand crank, battery) is essential.
              </p>
              <p>
                We also recommend a quality power bank to keep your phone charged—you&apos;ll need it 
                to check on family and access emergency information.
              </p>
            </div>

            {topCommPick && (
              <ProductPick
                product={topCommPick}
                pickLabel="Editor's Choice"
                pickDescription="The best all-in-one emergency communication device"
              />
            )}

            <AlternativePicks
              products={AFFILIATE_PRODUCTS.filter(
                p => p.category === 'communication' && p.id !== topCommPick?.id
              ).slice(0, 2)}
            />
          </Section>

          {/* First Aid */}
          <Section id="first-aid" icon={Heart} title="First Aid">
            <div className="prose prose-invert max-w-none mb-8">
              <p>
                A comprehensive first aid kit is crucial. Look for one that includes wound closure 
                strips (for cuts that might otherwise need stitches) and covers a range of scenarios.
              </p>
            </div>

            {topFirstAidPick && (
              <ProductPick
                product={topFirstAidPick}
                pickLabel="Most Complete"
                pickDescription="Everything you need for common injuries"
              />
            )}

            <AlternativePicks
              products={AFFILIATE_PRODUCTS.filter(
                p => p.category === 'first-aid' && p.id !== topFirstAidPick?.id
              ).slice(0, 2)}
            />
          </Section>

          {/* Checklist */}
          <Section id="checklist" icon={Check} title="Your Preparedness Checklist">
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
              <p className="text-neutral-400 mb-6">
                Print this checklist or bookmark this page. Check off items as you acquire them:
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    category: 'Essential (Do This Week)',
                    items: [
                      'Secure furniture and TVs to walls',
                      'Store 3+ days of water (1 gallon/person/day)',
                      'Get a basic emergency kit or build your own',
                      'Know your building\'s gas shut-off location',
                      'Keep sturdy shoes by your bed',
                    ],
                  },
                  {
                    category: 'Important (This Month)',
                    items: [
                      'Emergency radio with multiple power sources',
                      'Power bank for phone charging',
                      'First aid kit',
                      'Flashlight or headlamp',
                      'Cash in small bills',
                    ],
                  },
                  {
                    category: 'Good to Have (When Ready)',
                    items: [
                      'Two weeks of water storage',
                      'Non-perishable food supply',
                      'Copies of important documents',
                      'Out-of-area emergency contact',
                      'Family communication plan',
                    ],
                  },
                ].map((section) => (
                  <div key={section.category}>
                    <h4 className="font-semibold text-white mb-3">{section.category}</h4>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-neutral-300">
                          <div className="w-5 h-5 border border-white/20 rounded flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" icon={AlertTriangle} title="FAQ">
            <div className="space-y-4">
              {[
                {
                  q: 'How much should I spend on earthquake preparedness?',
                  a: 'Start with the essentials: furniture straps ($15), a basic emergency kit ($60-80), and water storage ($20-35). You can build up from there. Total minimum investment: around $100.',
                },
                {
                  q: 'I live in an apartment. Where do I store all this?',
                  a: 'That\'s why we focused on apartment-friendly solutions. A WaterBOB stores in a drawer until needed. A compact emergency kit fits in a closet. Furniture straps are installed and forgotten.',
                },
                {
                  q: 'How often should I replace supplies?',
                  a: 'Water should be replaced every 6 months (or use sealed pouches with 5+ year shelf life). Food in emergency kits typically lasts 5 years. Check expiration dates annually.',
                },
                {
                  q: 'Should I get renter\'s insurance?',
                  a: 'Yes! Most standard renter\'s insurance policies don\'t cover earthquake damage. You\'ll need a separate earthquake policy or rider. In the Bay Area, this is essential.',
                },
                {
                  q: 'What about earthquake early warning?',
                  a: 'Enable ShakeAlert notifications on your phone (California, Oregon, Washington). Bay Tremor also sends real-time alerts. Even a few seconds of warning can help you Drop, Cover, Hold On.',
                },
              ].map((item, i) => (
                <div key={i} className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                  <h4 className="font-semibold text-white mb-2">{item.q}</h4>
                  <p className="text-neutral-400">{item.a}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Affiliate Disclosure */}
        <div className="mt-16 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
          <h3 className="font-semibold text-white mb-2">Affiliate Disclosure</h3>
          <p className="text-sm text-neutral-500">
            As an Amazon Associate and affiliate partner, Bay Tremor earns from qualifying purchases. 
            This helps us keep the earthquake tracking service free for everyone. We only recommend 
            products we&apos;ve researched thoroughly and believe will genuinely help Bay Area residents 
            prepare for earthquakes. Product prices and availability are accurate as of the date 
            published and are subject to change.
          </p>
        </div>

        {/* Related Content */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl">
          <h3 className="font-semibold text-white mb-4">More from Bay Tremor</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/my-area"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <MapPin className="w-8 h-8 text-blue-400" />
              <div>
                <div className="font-medium text-white">My Neighborhood</div>
                <div className="text-sm text-neutral-400">See earthquake activity near you</div>
              </div>
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <div className="font-medium text-white">Learn More</div>
                <div className="text-sm text-neutral-400">Earthquake safety & science</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
