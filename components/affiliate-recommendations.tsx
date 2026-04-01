'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  ExternalLink, 
  Star, 
  Shield, 
  Zap, 
  Award, 
  Home, 
  Package,
  Truck,
  ShoppingCart,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Droplets,
  Radio,
  Heart,
  Check,
} from 'lucide-react';
import { 
  AffiliateProduct, 
  getProductsByCategory,
  AFFILIATE_PRODUCTS 
} from '@/lib/affiliate-products';

// ===== CATEGORY CONFIG =====
const CATEGORIES = [
  { id: 'emergency-kit', label: 'Emergency Kits', icon: Package, color: 'amber' },
  { id: 'furniture-safety', label: 'Furniture Safety', icon: Home, color: 'green' },
  { id: 'water-storage', label: 'Water Storage', icon: Droplets, color: 'blue' },
  { id: 'communication', label: 'Power & Communication', icon: Radio, color: 'purple' },
  { id: 'first-aid', label: 'First Aid', icon: Heart, color: 'red' },
] as const;

function ProductImage({ 
  src, 
  alt, 
  className = '',
  size = 'md',
  priority = false,
  padding = 'p-3',
}: { 
  src: string; 
  alt: string; 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
  padding?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const sizeConfig: Record<string, { classes: string; sizes: string }> = {
    sm: { classes: 'w-16 h-16', sizes: '64px' },
    md: { classes: 'w-full aspect-square', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
    lg: { classes: 'w-full aspect-[4/3]', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' },
  };

  const { classes, sizes } = sizeConfig[size];

  if (hasError || !src) {
    return (
      <div className={`${classes} bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center ${className}`}>
        <Package className="w-12 h-12 text-neutral-600" />
      </div>
    );
  }

  return (
    <div className={`relative ${classes} bg-white ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <Package className="w-8 h-8 text-neutral-400" />
        </div>
      )}
      <Image
        fill
        sizes={sizes}
        src={src}
        alt={alt}
        priority={priority}
        className={`object-contain ${padding} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

// ===== MAIN COMPONENT: Full Product Showcase =====
interface AffiliateShowcaseProps {
  className?: string;
  showAllCategories?: boolean;
  initialCategory?: string;
}

export function AffiliateShowcase({ 
  className = '',
  showAllCategories = true,
  initialCategory = 'emergency-kit'
}: AffiliateShowcaseProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  const products = showAllCategories 
    ? AFFILIATE_PRODUCTS 
    : getProductsByCategory(activeCategory as AffiliateProduct['category']);

  const handleProductClick = (product: AffiliateProduct) => {
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      (window as any).DD_RUM.addAction('affiliate_link_clicked', {
        productId: product.id,
        productName: product.shortName,
        price: product.price,
        category: product.category,
      });
    }
  };

  return (
    <section className={`${className}`}>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Earthquake Preparedness Essentials
            </h2>
            <p className="text-sm text-neutral-400">
              Trusted by 10,000+ Bay Area households • Expert recommended
            </p>
          </div>
        </div>
        
        {/* Urgency Banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            <span className="font-semibold">The next big one could happen anytime.</span> 72% of Bay Area households are unprepared.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const colorClass = {
            amber: isActive ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
            green: isActive ? 'bg-green-500 text-black' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
            blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
            purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
            red: isActive ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
          }[cat.color];
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${colorClass}`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AFFILIATE_PRODUCTS
          .filter(p => p.category === activeCategory)
          .map((product, idx) => (
            <ProductCardPremium 
              key={product.id} 
              product={product}
              rank={idx + 1}
              onClick={() => handleProductClick(product)}
              priority={idx < 3}
            />
          ))}
      </div>

      {/* Trust Footer */}
      <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Free Prime Shipping
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Easy Returns
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Verified Reviews
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Secure Checkout
          </span>
        </div>
        <p className="text-center text-[10px] text-neutral-600 mt-3">
          As an Amazon Associate, Bay Tremor earns from qualifying purchases. This helps us keep the site free.
        </p>
      </div>
    </section>
  );
}

// ===== PREMIUM PRODUCT CARD =====
interface ProductCardPremiumProps {
  product: AffiliateProduct;
  rank?: number;
  onClick?: () => void;
  priority?: boolean;
}

function ProductCardPremium({ product, rank, onClick, priority = false }: ProductCardPremiumProps) {
  const getBadgeStyle = (badge: AffiliateProduct['badge']) => {
    switch (badge) {
      case 'best-seller':
        return { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-black', label: '🏆 #1 Best Seller' };
      case 'editor-pick':
        return { bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', text: 'text-white', label: '⭐ Editor\'s Choice' };
      case 'best-value':
        return { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-white', label: '💰 Best Value' };
      case 'most-popular':
        return { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', label: '🔥 Most Popular' };
      default:
        return null;
    }
  };

  const badge = getBadgeStyle(product.badge);

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={onClick}
      className="group relative flex flex-col bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 ${badge.bg} ${badge.text} text-[11px] font-bold rounded-full shadow-lg`}>
          {badge.label}
        </div>
      )}

      {/* Product Image Area */}
      <div className="relative bg-white rounded-t-2xl overflow-hidden">
        <ProductImage 
          src={product.imageUrl} 
          alt={product.name}
          size="md"
          className="rounded-t-2xl"
          priority={priority}
        />
        
        {/* Prime Badge */}
        {product.primeEligible && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-[#232F3E] rounded text-[10px] font-bold text-white shadow-lg">
            <Truck className="w-3 h-3 text-[#FF9900]" />
            <span className="text-[#FF9900]">Prime</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Title */}
        <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2 text-sm mb-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`} 
              />
            ))}
          </div>
          <span className="text-xs text-amber-400 font-medium">{product.rating}</span>
          <span className="text-xs text-neutral-500">({product.reviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-400 line-clamp-2 mb-4">
          {product.description}
        </p>

        {/* Price & CTA */}
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-white/5">
          <div>
            <div className="text-2xl font-bold text-white">
              ${product.price.toFixed(2)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-neutral-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </div>
            )}
          </div>
          
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-sm rounded-lg transition-all shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40">
            <ShoppingCart className="w-4 h-4" />
            View Deal
          </button>
        </div>
      </div>
    </a>
  );
}

// ===== CONTEXTUAL RECOMMENDATIONS (smaller, for sidebars) =====
interface AffiliateRecommendationsProps {
  context: 'post-earthquake' | 'homepage' | 'my-area' | 'learn';
  earthquakeMagnitude?: number;
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
}

export function AffiliateRecommendations({
  context,
  earthquakeMagnitude,
  title,
  subtitle,
  limit = 4,
  className = '',
}: AffiliateRecommendationsProps) {
  // Get products based on context
  const getProductsForContext = () => {
    switch (context) {
      case 'post-earthquake':
        return AFFILIATE_PRODUCTS
          .filter(p => p.category === 'emergency-kit' || p.category === 'communication')
          .filter(p => p.badge)
          .slice(0, limit);
      case 'homepage':
        return AFFILIATE_PRODUCTS
          .filter(p => p.badge === 'best-seller' || p.badge === 'editor-pick')
          .slice(0, limit);
      case 'my-area':
        return AFFILIATE_PRODUCTS
          .filter(p => p.category === 'furniture-safety' || p.category === 'water-storage')
          .slice(0, limit);
      case 'learn':
        return AFFILIATE_PRODUCTS.filter(p => p.badge).slice(0, limit);
      default:
        return AFFILIATE_PRODUCTS.filter(p => p.badge).slice(0, limit);
    }
  };

  const products = getProductsForContext();
  if (products.length === 0) return null;

  const getContextContent = () => {
    switch (context) {
      case 'post-earthquake':
        return {
          title: title || 'Be Prepared for Next Time',
          subtitle: subtitle || `After feeling that${earthquakeMagnitude ? ` M${earthquakeMagnitude.toFixed(1)}` : ''} earthquake, are you ready?`,
          icon: Shield,
          gradient: 'from-red-500/20 to-amber-500/20',
          borderColor: 'border-amber-500/30',
        };
      case 'homepage':
        return {
          title: title || 'Earthquake Preparedness Essentials',
          subtitle: subtitle || 'Most purchased by Bay Area households',
          icon: Award,
          gradient: 'from-blue-500/20 to-purple-500/20',
          borderColor: 'border-blue-500/30',
        };
      case 'my-area':
        return {
          title: title || 'Protect Your Home',
          subtitle: subtitle || 'Essential safety items for your area',
          icon: Home,
          gradient: 'from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-500/30',
        };
      case 'learn':
        return {
          title: title || 'Expert Recommendations',
          subtitle: subtitle || 'Build your emergency kit',
          icon: Zap,
          gradient: 'from-purple-500/20 to-pink-500/20',
          borderColor: 'border-purple-500/30',
        };
    }
  };

  const content = getContextContent();
  const Icon = content.icon;

  const handleProductClick = (product: AffiliateProduct) => {
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      (window as any).DD_RUM.addAction('affiliate_link_clicked', {
        productId: product.id,
        productName: product.shortName,
        price: product.price,
        category: product.category,
        context,
      });
    }
  };

  return (
    <section className={`bg-gradient-to-b ${content.gradient} border ${content.borderColor} rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{content.title}</h3>
            <p className="text-sm text-neutral-300 mt-0.5">{content.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 sm:px-5 pb-4 space-y-3">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => handleProductClick(product)}
            className="group flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/20 rounded-xl transition-all"
          >
            <ProductImage 
              src={product.imageUrl}
              alt={product.name}
              size="sm"
              padding="p-1"
              className="rounded-lg flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {product.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    product.badge === 'best-seller' ? 'bg-amber-500/30 text-amber-300' :
                    product.badge === 'editor-pick' ? 'bg-blue-500/30 text-blue-300' :
                    product.badge === 'best-value' ? 'bg-green-500/30 text-green-300' :
                    'bg-purple-500/30 text-purple-300'
                  }`}>
                    {product.badge === 'best-seller' ? '★ BEST' : 
                     product.badge === 'editor-pick' ? '★ PICK' :
                     product.badge === 'best-value' ? '★ VALUE' : '★ HOT'}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                {product.shortName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-neutral-400">{product.rating}</span>
                </div>
                <span className="text-xs text-neutral-500">({product.reviewCount.toLocaleString()})</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-white">${product.price}</div>
              {product.primeEligible && (
                <div className="text-[9px] text-[#FF9900] font-bold">Prime ✓</div>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* View All Link */}
      <a 
        href="/learn#preparedness"
        className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors"
      >
        View All Products
        <ChevronRight className="w-4 h-4" />
      </a>

      {/* Disclosure */}
      <div className="px-4 sm:px-5 py-3 bg-black/20">
        <p className="text-[10px] text-neutral-500 text-center">
          As an Amazon Associate, Bay Tremor earns from qualifying purchases.
        </p>
      </div>
    </section>
  );
}

// ===== COMPACT HORIZONTAL SCROLL =====
export function AffiliateRecommendationsCompact({
  className = '',
  limit = 6,
}: {
  className?: string;
  limit?: number;
}) {
  const products = AFFILIATE_PRODUCTS.filter(p => p.badge).slice(0, limit);
  
  if (products.length === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">
            Preparedness Essentials
          </h4>
        </div>
        <span className="text-[10px] text-neutral-600 bg-white/5 px-2 py-0.5 rounded">Sponsored</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-shrink-0 w-[160px] p-3 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-amber-500/50 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/10"
          >
            {/* Badge */}
            {product.badge && (
              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mb-2 ${
                product.badge === 'best-seller' ? 'bg-amber-500/30 text-amber-300' :
                product.badge === 'editor-pick' ? 'bg-blue-500/30 text-blue-300' :
                product.badge === 'best-value' ? 'bg-green-500/30 text-green-300' :
                'bg-purple-500/30 text-purple-300'
              }`}>
                {product.badge === 'best-seller' ? '🏆 Best Seller' : 
                 product.badge === 'editor-pick' ? '⭐ Editor Pick' :
                 product.badge === 'best-value' ? '💰 Best Value' : '🔥 Popular'}
              </div>
            )}
            
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              size="md"
              padding="p-2"
              className="rounded-lg mb-3"
            />
            
            {/* Title */}
            <h5 className="text-xs font-medium text-white line-clamp-2 mb-2 h-8">
              {product.shortName}
            </h5>
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-neutral-400">{product.rating} ({product.reviewCount.toLocaleString()})</span>
            </div>
            
            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">${product.price}</span>
              {product.primeEligible && (
                <span className="text-[9px] text-[#FF9900] font-bold">Prime</span>
              )}
            </div>
          </a>
        ))}
      </div>
      
      <p className="text-[10px] text-neutral-600 mt-2">
        As an Amazon Associate, Bay Tremor earns from qualifying purchases.
      </p>
    </div>
  );
}

// ===== SINGLE INLINE PRODUCT =====
export function InlineProductRecommendation({ 
  productId,
  className = '',
}: { 
  productId: string;
  className?: string;
}) {
  const product = AFFILIATE_PRODUCTS.find(p => p.id === productId);
  if (!product) return null;

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 rounded-lg text-sm transition-all ${className}`}
    >
      <span className="text-white font-medium">{product.shortName}</span>
      <span className="text-amber-400 font-bold">${product.price}</span>
      <ExternalLink className="w-3 h-3 text-amber-400" />
    </a>
  );
}
