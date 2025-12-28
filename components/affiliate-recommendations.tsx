'use client';

import { ExternalLink, Star, Shield, Zap, Award, Home, Package } from 'lucide-react';
import { 
  AffiliateProduct, 
  getProductsForContext, 
  AFFILIATE_PRODUCTS 
} from '@/lib/affiliate-products';

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
  limit = 3,
  className = '',
}: AffiliateRecommendationsProps) {
  const products = getProductsForContext(context, limit);
  
  // Don't render if no products
  if (products.length === 0) return null;

  // Dynamic messaging based on context
  const getContextContent = () => {
    switch (context) {
      case 'post-earthquake':
        return {
          title: title || 'Be Prepared for Next Time',
          subtitle: subtitle || `After feeling that${earthquakeMagnitude ? ` M${earthquakeMagnitude.toFixed(1)}` : ''} earthquake, many ask: "Am I prepared?"`,
          icon: Shield,
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          iconColor: 'text-amber-400',
        };
      case 'homepage':
        return {
          title: title || 'Earthquake Preparedness Essentials',
          subtitle: subtitle || 'The most purchased items by Bay Area households',
          icon: Award,
          iconBg: 'bg-blue-500/10 border-blue-500/20',
          iconColor: 'text-blue-400',
        };
      case 'my-area':
        return {
          title: title || 'Protect Your Home',
          subtitle: subtitle || 'Based on seismic activity in your area, here are the essentials',
          icon: Home,
          iconBg: 'bg-green-500/10 border-green-500/20',
          iconColor: 'text-green-400',
        };
      case 'learn':
        return {
          title: title || 'Recommended by Emergency Experts',
          subtitle: subtitle || 'Build your earthquake preparedness kit',
          icon: Zap,
          iconBg: 'bg-purple-500/10 border-purple-500/20',
          iconColor: 'text-purple-400',
        };
    }
  };

  const content = getContextContent();
  const Icon = content.icon;

  // Track clicks for analytics
  const handleProductClick = (product: AffiliateProduct) => {
    // Datadog RUM tracking (if available)
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
    <section className={`bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${content.iconBg}`}>
            <Icon className={`w-5 h-5 ${content.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{content.title}</h3>
            <p className="text-sm text-neutral-400 mt-0.5">{content.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="p-4 sm:p-5">
        <div className="grid gap-3">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      </div>

      {/* Disclosure */}
      <div className="px-4 sm:px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <p className="text-[11px] text-neutral-500">
          As an Amazon Associate, Bay Tremor earns from qualifying purchases. 
          This helps us keep the site free for everyone.
        </p>
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: AffiliateProduct;
  onClick?: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const getBadgeStyle = (badge: AffiliateProduct['badge']) => {
    switch (badge) {
      case 'best-seller':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'editor-pick':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'best-value':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'most-popular':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return '';
    }
  };

  const getBadgeLabel = (badge: AffiliateProduct['badge']) => {
    switch (badge) {
      case 'best-seller': return '#1 Best Seller';
      case 'editor-pick': return 'Editor Pick';
      case 'best-value': return 'Best Value';
      case 'most-popular': return 'Most Popular';
      default: return '';
    }
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={onClick}
      className="group flex gap-4 p-3 sm:p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all"
    >
      {/* Product Image Placeholder */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-600" />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Badge */}
            {product.badge && (
              <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border mb-1 ${getBadgeStyle(product.badge)}`}>
                {getBadgeLabel(product.badge)}
              </span>
            )}
            
            {/* Name */}
            <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1 text-sm sm:text-base">
              {product.shortName}
            </h4>
          </div>
          
          {/* Price */}
          <div className="text-right flex-shrink-0">
            <span className="text-base sm:text-lg font-bold text-white">${product.price}</span>
            {product.primeEligible && (
              <span className="block text-[10px] text-blue-400 font-medium">Prime</span>
            )}
          </div>
        </div>

        {/* Why Recommended */}
        <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 mt-1">
          {product.whyRecommended}
        </p>

        {/* Rating & CTA */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs sm:text-sm text-neutral-300">{product.rating}</span>
            <span className="text-[10px] sm:text-xs text-neutral-500">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>
          
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
            View on Amazon <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

// ===== COMPACT VARIANTS =====

/**
 * Horizontal scroll variant for homepage
 */
export function AffiliateRecommendationsCompact({
  context = 'homepage',
  limit = 4,
  className = '',
}: {
  context?: 'post-earthquake' | 'homepage' | 'my-area' | 'learn';
  limit?: number;
  className?: string;
}) {
  const products = getProductsForContext(context, limit);
  
  if (products.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-400">
          Earthquake Preparedness Essentials
        </h4>
        <span className="text-[10px] text-neutral-600">Sponsored</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-shrink-0 w-[140px] p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all"
          >
            <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-2 flex items-center justify-center">
              <Package className="w-6 h-6 text-neutral-600" />
            </div>
            <h5 className="text-xs font-medium text-white line-clamp-2 mb-1">
              {product.shortName}
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">${product.price}</span>
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-neutral-400">{product.rating}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      <p className="text-[10px] text-neutral-600">
        As an Amazon Associate, Bay Tremor earns from qualifying purchases.
      </p>
    </div>
  );
}

/**
 * Single product inline recommendation
 */
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors ${className}`}
    >
      <span className="text-white">{product.shortName}</span>
      <span className="text-green-400 font-medium">${product.price}</span>
      <ExternalLink className="w-3 h-3 text-neutral-400" />
    </a>
  );
}


