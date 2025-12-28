# Bay Tremor Monetization Implementation Plan

## Executive Summary

This document provides complete implementation specifications for monetizing Bay Tremor while waiting for Google AdSense approval. The strategy focuses on:

1. **Strategic Affiliate Links** - Contextual, helpful product recommendations (IMMEDIATE)
2. **Support Bay Tremor** - Custom Stripe-based donation/support system
3. **Feature Request System** - Community-driven development with voting
4. **Earthquake Preparedness Shop** - Full e-commerce using Next.js Commerce + Shopify

**Traffic Context (from Datadog RUM):**
- Past 1 week: 5,400 visitors
- Past 4 hours: 232 visitors
- Past 1 hour: 76 visitors
- Past 2 days: 1,200 visitors

**High-Conversion Pages (Priority for Monetization):**
1. `/` (Homepage) - Highest conversion, main entry point
2. `/my-area` (My Neighborhood) - Users enter addresses, high engagement
3. `/community` - Discussion forums, repeat visitors
4. `/earthquake/[id]` - Share pages, viral traffic during events

---

## 1. Strategic Affiliate Links (PRIORITY #1)

### Philosophy: Helpful, Not Salesy

The key to successful affiliate monetization on Bay Tremor is **contextual relevance**. Users visiting during/after an earthquake are in a specific mindset:
- "That was scary, am I prepared?"
- "I should probably get an emergency kit"
- "What do I actually need?"

Your affiliate strategy should feel like a **helpful friend recommending products**, not an ad bombardment.

### 1.1 Product Curation Strategy

#### Category Breakdown

| Category | Why It Converts | Commission Range | Priority |
|----------|-----------------|------------------|----------|
| **Emergency Kits** | Immediate post-earthquake motivation | 5-10% | 🔴 High |
| **Furniture Anchors** | Direct earthquake safety | 3-8% | 🔴 High |
| **Water Storage** | Essential preparedness | 4-8% | 🟡 Medium |
| **Emergency Radios** | Power outage concern | 4-8% | 🟡 Medium |
| **First Aid Kits** | Universal appeal | 4-8% | 🟡 Medium |
| **Flashlights/Lanterns** | Power outage concern | 3-6% | 🟢 Low |
| **Food Storage** | Long-term prep | 4-8% | 🟢 Low |

#### Product Selection Criteria

For each product you feature, ensure:

1. **4.5+ star rating** on Amazon/retailer
2. **1000+ reviews** (social proof)
3. **Prime eligible** (for Amazon) - faster conversion
4. **Actually useful** - you'd recommend it to a friend
5. **Bay Area relevant** - consider apartment dwellers, not just homeowners

#### Curated Product List (Start With These)

**Tier 1: Emergency Kits (Highest Converting)**

| Product | Why | Price | Where to Get Link |
|---------|-----|-------|-------------------|
| **Ready America 72-Hour Kit** | Budget-friendly, Amazon #1 best seller | $60 | Amazon Associates |
| **Earthquake Bag Complete Kit** | Mid-range, earthquake-specific design | $120 | Amazon Associates |
| **REDFORA Complete Kit** | Premium, highly rated, comprehensive | $200 | Amazon Associates |
| **Complete Earthquake Bag** | 4-person family kit, thorough | $170 | Amazon Associates |

**Tier 2: Furniture Safety (Unique to Earthquake Sites)**

| Product | Why | Price | Where to Get Link |
|---------|-----|-------|-------------------|
| **Quakehold! Furniture Straps** | Industry standard, 7000+ reviews | $16 | Amazon Associates |
| **Safety 1st Furniture Anchors** | Budget option, good reviews | $12 | Amazon Associates |
| **TV Safety Straps** | Specific use case, high search | $15 | Amazon Associates |
| **Bookshelf Anchor Kit** | Apartment-friendly | $20 | Amazon Associates |

**Tier 3: Water & Food Storage**

| Product | Why | Price | Where to Get Link |
|---------|-----|-------|-------------------|
| **WaterBOB** | Brilliant product, 100 gal bathtub storage | $35 | Amazon Associates |
| **WaterBrick Stackable** | Compact, apartment-friendly | $20 | Amazon Associates |
| **Augason Farms 30-Day Supply** | Long-term food storage | $100 | Amazon Associates |
| **Datrex Emergency Bars** | Coast Guard approved, long shelf life | $20 | Amazon Associates |

**Tier 4: Communication & Light**

| Product | Why | Price | Where to Get Link |
|---------|-----|-------|-------------------|
| **Midland ER310** | Best emergency radio, hand crank | $70 | Amazon Associates |
| **Eton FRX3+** | Budget emergency radio | $50 | Amazon Associates |
| **Goal Zero Lighthouse** | Solar + USB lantern | $80 | Amazon Associates |
| **Anker PowerCore 20000** | Phone backup power | $50 | Amazon Associates |

### 1.2 Affiliate Program Setup Guide

#### Amazon Associates (Do This First)

**Why Amazon:**
- Instant approval for most sites
- 24-hour cookie (if they buy anything, you earn)
- Trusted checkout = higher conversion
- 4-8% commission on most items

**Setup Steps:**
1. Go to: https://affiliate-program.amazon.com/
2. Sign up with your info
3. Add your website (baytremor.com)
4. Choose "Content & Deals" as monetization method
5. Get your Associate ID (e.g., `baytremor-20`)
6. Use SiteStripe or Product Links to generate URLs

**Link Format:**
```
https://www.amazon.com/dp/PRODUCT_ID?tag=YOUR_ASSOCIATE_ID
```

**Example:**
```
https://www.amazon.com/dp/B00KGATL7O?tag=baytremor-20
```

#### Impact Radius (Multi-Brand) - PENDING APPROVAL

Many brands use Impact for affiliates. One signup = access to many programs:
- Home Depot (2-8%)
- REI (5%)
- Target (1-8%)
- Lowe's (2-8%)

**Setup:**
1. Go to: https://impact.com/
2. Create publisher account
3. Browse and apply to relevant programs

### 1.3 Placement Strategy (Where to Show Products)

#### Placement 1: Post-Earthquake Context (Highest Intent)

**Location:** `/earthquake/[id]` share pages

**When to show:** Always, but especially for M3.0+ earthquakes

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 🌋 M4.2 Earthquake                          │
│ Pleasant Hill, CA - 5 minutes ago           │
│                                             │
│ [Earthquake details, map, comments...]      │
│                                             │
├─────────────────────────────────────────────┤
│ 🛡️ BE PREPARED FOR NEXT TIME               │
│                                             │
│ "This earthquake was felt by 234 people.    │
│  Here's what Bay Area experts recommend:"   │
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Kit     │ │ Straps  │ │ Radio   │        │
│ │ $60     │ │ $16     │ │ $70     │        │
│ │ ⭐4.7   │ │ ⭐4.8   │ │ ⭐4.6   │        │
│ └─────────┘ └─────────┘ └─────────┘        │
│                                             │
│ 📋 "As an Amazon Associate, Bay Tremor      │
│    earns from qualifying purchases"         │
└─────────────────────────────────────────────┘
```

**Copy that converts:**
- ❌ "Buy these products"
- ✅ "Here's what Bay Area emergency managers recommend"
- ✅ "The most-purchased items after earthquakes"
- ✅ "What 10,000+ Bay Area households have in their kit"

#### Placement 2: My Neighborhood (Personal Context)

**Location:** `/my-area` after user sees their earthquake history

**Trigger:** After showing stats like "47 earthquakes within 15 miles of you"

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 📊 YOUR NEIGHBORHOOD SUMMARY                │
│                                             │
│ "Within 15 miles of San Francisco, there    │
│  have been 47 earthquakes in the past year, │
│  12 of which were felt by people."          │
│                                             │
├─────────────────────────────────────────────┤
│ 🏠 PROTECT YOUR HOME                        │
│                                             │
│ Based on your area's seismic activity,      │
│ here are the essentials:                    │
│                                             │
│ 1. Furniture Straps ($16) - Secure TVs     │
│ 2. Emergency Kit ($60) - 72-hour supplies  │
│ 3. Water Storage ($35) - 100 gallon backup │
│                                             │
│ [View Full Preparedness Checklist →]        │
└─────────────────────────────────────────────┘
```

#### Placement 3: Learn Tab (Educational Context)

**Location:** `/learn` - Educational content about earthquakes

**Approach:** Create a "Bay Area Earthquake Preparedness Checklist" page with affiliate links woven in naturally.

**Example Content:**
```markdown
## What Every Bay Area Household Needs

### 1. Secure Your Furniture
The most common earthquake injuries come from falling objects.
**We recommend:** [Quakehold! Furniture Straps](affiliate-link) - 
Used by over 50,000 Bay Area households.

### 2. Build a 72-Hour Kit
You should be self-sufficient for at least 3 days.
**Budget option:** [Ready America Kit](affiliate-link) - $60
**Premium option:** [Judy Mover Max](affiliate-link) - $250
```

#### Placement 4: Exit Intent / Low Frequency

**Trigger:** User has been on site 2+ minutes, or visited 3+ earthquake pages

**Format:** Subtle banner or slide-in

```
┌─────────────────────────────────────────────┐
│ 💡 Did you know? Only 35% of Bay Area       │
│    households have an earthquake kit.       │
│                                             │
│    [See What Experts Recommend →]           │
└─────────────────────────────────────────────┘
```

### 1.4 Technical Implementation

**File: `lib/affiliate-products.ts`**

```typescript
// Centralized product data - easy to update links and info
export interface AffiliateProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  whyRecommended: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: 'emergency-kit' | 'furniture-safety' | 'water-storage' | 'communication' | 'first-aid' | 'food-storage';
  affiliateUrl: string;
  imageUrl: string;
  badge?: 'best-seller' | 'editor-pick' | 'best-value' | 'premium';
  primeEligible?: boolean;
}

// Update this with your actual Amazon Associate ID
const AMAZON_TAG = 'baytremor-20'; // Replace with your Amazon Associate ID

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ===== EMERGENCY KITS =====
  {
    id: 'ready-america-72hr',
    name: 'Ready America 72 Hour Emergency Kit, 2-Person',
    shortName: '72-Hour Emergency Kit',
    description: 'Everything 2 people need for 72 hours: food, water, first aid, light, and shelter.',
    whyRecommended: 'Amazon #1 best-seller with 7,000+ reviews. The most popular kit in the Bay Area.',
    price: 59.99,
    rating: 4.7,
    reviewCount: 7234,
    category: 'emergency-kit',
    affiliateUrl: `https://www.amazon.com/dp/B000GASL9Q?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/ready-america-kit.jpg',
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'redfora-complete',
    name: 'REDFORA Complete Earthquake Bag - 4 Person',
    shortName: 'REDFORA Complete Kit',
    description: 'Premium earthquake kit with 4-person capacity. Comprehensive supplies for 72+ hours.',
    whyRecommended: 'Most comprehensive kit on Amazon. Includes items other kits miss.',
    price: 199.99,
    rating: 4.7,
    reviewCount: 3421,
    category: 'emergency-kit',
    affiliateUrl: `https://www.amazon.com/dp/B07FKJC6YL?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/redfora-kit.jpg',
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'earthquake-bag-complete',
    name: 'Earthquake Bag - Complete Emergency Kit',
    shortName: 'Earthquake Bag',
    description: 'Specifically designed for earthquake preparedness. Includes work gloves and pry bar.',
    whyRecommended: 'Earthquake-specific design with 107 pieces. Great for apartments.',
    price: 119.99,
    rating: 4.6,
    reviewCount: 2341,
    category: 'emergency-kit',
    affiliateUrl: `https://www.amazon.com/dp/B01N5T1H67?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/earthquake-bag.jpg',
    primeEligible: true,
  },

  // ===== FURNITURE SAFETY =====
  {
    id: 'quakehold-straps',
    name: 'Quakehold! 4160 Universal Flat Screen Safety Strap',
    shortName: 'TV Safety Straps',
    description: 'Secure flat screen TVs up to 70". Easy installation, no drilling required.',
    whyRecommended: 'The #1 selling TV safety strap. Used by museums and hospitals.',
    price: 15.99,
    rating: 4.6,
    reviewCount: 8921,
    category: 'furniture-safety',
    affiliateUrl: `https://www.amazon.com/dp/B000CRXW8E?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/quakehold-tv.jpg',
    badge: 'best-value',
    primeEligible: true,
  },
  {
    id: 'furniture-anchor-straps',
    name: 'Furniture Anchors (6-Pack) - Anti-Tip Safety Straps',
    shortName: 'Furniture Straps 6-Pack',
    description: 'Secure dressers, bookshelves, and cabinets to walls. Child-safe and earthquake-safe.',
    whyRecommended: 'Essential for families. Prevents tip-overs during earthquakes.',
    price: 12.99,
    rating: 4.7,
    reviewCount: 15432,
    category: 'furniture-safety',
    affiliateUrl: `https://www.amazon.com/dp/B01M0N4BQW?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/furniture-straps.jpg',
    badge: 'best-seller',
    primeEligible: true,
  },

  // ===== WATER STORAGE =====
  {
    id: 'waterbob',
    name: 'WaterBOB Emergency Drinking Water Storage',
    shortName: 'WaterBOB',
    description: 'Store up to 100 gallons of fresh water in your bathtub. Keeps water clean for weeks.',
    whyRecommended: 'Brilliant solution for apartments. Fill it when you see a storm or earthquake coming.',
    price: 34.95,
    rating: 4.6,
    reviewCount: 5623,
    category: 'water-storage',
    affiliateUrl: `https://www.amazon.com/dp/B001AXLUX2?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/waterbob.jpg',
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'waterbrick-stackable',
    name: 'WaterBrick Stackable Water Storage Container (3.5 Gallon)',
    shortName: 'WaterBrick',
    description: 'Stackable, portable water storage. FDA food-grade plastic. Stores for 5+ years.',
    whyRecommended: 'Perfect for apartments and closets. Stack them and forget them.',
    price: 19.99,
    rating: 4.7,
    reviewCount: 3421,
    category: 'water-storage',
    affiliateUrl: `https://www.amazon.com/dp/B0073QV1NY?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/waterbrick.jpg',
    primeEligible: true,
  },

  // ===== COMMUNICATION =====
  {
    id: 'midland-er310',
    name: 'Midland ER310 Emergency Crank Weather Alert Radio',
    shortName: 'Midland Emergency Radio',
    description: 'NOAA weather alerts, flashlight, SOS beacon, and phone charger. Solar + hand crank powered.',
    whyRecommended: 'The best emergency radio. Works when power is out. Charges your phone.',
    price: 69.99,
    rating: 4.6,
    reviewCount: 4521,
    category: 'communication',
    affiliateUrl: `https://www.amazon.com/dp/B00176T9OY?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/midland-radio.jpg',
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'anker-powercore',
    name: 'Anker PowerCore 20000mAh Portable Charger',
    shortName: 'Anker PowerCore',
    description: 'Charge your phone 4-5 times. Essential for staying connected during outages.',
    whyRecommended: 'The most reliable portable charger. A must-have for emergencies.',
    price: 49.99,
    rating: 4.8,
    reviewCount: 89234,
    category: 'communication',
    affiliateUrl: `https://www.amazon.com/dp/B07S829LBX?tag=${AMAZON_TAG}`,
    imageUrl: '/images/products/anker-powercore.jpg',
    badge: 'best-seller',
    primeEligible: true,
  },
];

// Helper functions
export function getProductsByCategory(category: AffiliateProduct['category']) {
  return AFFILIATE_PRODUCTS.filter(p => p.category === category);
}

export function getProductById(id: string) {
  return AFFILIATE_PRODUCTS.find(p => p.id === id);
}

export function getFeaturedProducts(limit = 4) {
  // Prioritize editor picks and best sellers
  return AFFILIATE_PRODUCTS
    .filter(p => p.badge)
    .slice(0, limit);
}

export function getProductsForContext(context: 'post-earthquake' | 'my-area' | 'learn'): AffiliateProduct[] {
  switch (context) {
    case 'post-earthquake':
      // After an earthquake: emergency kits + communication
      return AFFILIATE_PRODUCTS.filter(p => 
        p.category === 'emergency-kit' || p.category === 'communication'
      ).slice(0, 3);
    case 'my-area':
      // Protecting your home: furniture safety + water
      return AFFILIATE_PRODUCTS.filter(p => 
        p.category === 'furniture-safety' || p.category === 'water-storage'
      ).slice(0, 3);
    case 'learn':
      // Educational: show everything
      return getFeaturedProducts(6);
    default:
      return getFeaturedProducts(4);
  }
}
```

**File: `components/affiliate-recommendations.tsx`**

```typescript
'use client';

import { ExternalLink, Star, Check, Shield, Zap, Award } from 'lucide-react';
import { AffiliateProduct, getProductsForContext, AFFILIATE_PRODUCTS } from '@/lib/affiliate-products';

interface AffiliateRecommendationsProps {
  context: 'post-earthquake' | 'my-area' | 'learn';
  earthquakeMagnitude?: number; // For post-earthquake context
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AffiliateRecommendations({
  context,
  earthquakeMagnitude,
  title,
  subtitle,
  className = '',
}: AffiliateRecommendationsProps) {
  const products = getProductsForContext(context);
  
  // Dynamic messaging based on context
  const getContextContent = () => {
    switch (context) {
      case 'post-earthquake':
        return {
          title: title || 'Be Prepared for Next Time',
          subtitle: subtitle || `After feeling that${earthquakeMagnitude ? ` M${earthquakeMagnitude.toFixed(1)}` : ''}, many people ask: "Am I prepared?"`,
          icon: Shield,
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          iconColor: 'text-amber-400',
        };
      case 'my-area':
        return {
          title: title || 'Protect Your Home',
          subtitle: subtitle || 'Based on seismic activity in your area, here are the essentials:',
          icon: Zap,
          iconBg: 'bg-blue-500/10 border-blue-500/20',
          iconColor: 'text-blue-400',
        };
      case 'learn':
        return {
          title: title || 'Recommended by Emergency Experts',
          subtitle: subtitle || 'The most effective earthquake preparedness items:',
          icon: Award,
          iconBg: 'bg-purple-500/10 border-purple-500/20',
          iconColor: 'text-purple-400',
        };
    }
  };

  const content = getContextContent();
  const Icon = content.icon;

  return (
    <section className={`bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border ${content.iconBg}`}>
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
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Disclosure */}
      <div className="px-4 sm:px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <p className="text-[11px] text-neutral-500">
          As an Amazon Associate and affiliate partner, Bay Tremor earns from qualifying purchases. 
          This helps us keep the site free for everyone.
        </p>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: AffiliateProduct }) {
  const getBadgeStyle = (badge: AffiliateProduct['badge']) => {
    switch (badge) {
      case 'best-seller':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'editor-pick':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'best-value':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'premium':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return '';
    }
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all"
    >
      {/* Product Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-800 rounded-lg flex-shrink-0 overflow-hidden">
        {/* Placeholder - replace with actual images */}
        <div className="w-full h-full flex items-center justify-center text-neutral-600">
          <Shield className="w-8 h-8" />
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* Badge */}
            {product.badge && (
              <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border mb-1.5 ${getBadgeStyle(product.badge)}`}>
                {product.badge.replace('-', ' ')}
              </span>
            )}
            
            {/* Name */}
            <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
              {product.shortName}
            </h4>
          </div>
          
          {/* Price */}
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-white">${product.price}</span>
            {product.primeEligible && (
              <span className="block text-[10px] text-blue-400">Prime</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-400 line-clamp-2 mt-1">
          {product.whyRecommended}
        </p>

        {/* Rating & CTA */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm text-neutral-300">{product.rating}</span>
            <span className="text-xs text-neutral-500">({product.reviewCount.toLocaleString()} reviews)</span>
          </div>
          
          <span className="flex items-center gap-1 text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
            View on Amazon <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

// Compact inline recommendation for use within content
export function InlineProductRecommendation({ productId }: { productId: string }) {
  const product = AFFILIATE_PRODUCTS.find(p => p.id === productId);
  if (!product) return null;

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
    >
      <span className="text-white">{product.shortName}</span>
      <span className="text-green-400 font-medium">${product.price}</span>
      <ExternalLink className="w-3 h-3 text-neutral-400" />
    </a>
  );
}
```

### 1.5 Placement Implementation

**In `app/earthquake/[id]/page.tsx`:**

```typescript
import { AffiliateRecommendations } from '@/components/affiliate-recommendations';

// After earthquake details, before or after comments:
<AffiliateRecommendations 
  context="post-earthquake" 
  earthquakeMagnitude={earthquake.magnitude}
/>
```

**In `components/my-neighborhood.tsx`:**

```typescript
import { AffiliateRecommendations } from './affiliate-recommendations';

// After the neighborhood summary insight (around line 506):
{stats.total > 0 && (
  <>
    {/* Existing neighborhood summary */}
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
      {/* ... */}
    </div>
    
    {/* Affiliate recommendations */}
    <AffiliateRecommendations 
      context="my-area" 
      className="mt-6"
    />
  </>
)}
```

### 1.6 Tracking & Optimization

Track these events in Datadog RUM:

```typescript
// When affiliate section is viewed
datadogRum.addAction('affiliate_section_viewed', {
  context: 'post-earthquake',
  earthquakeId: earthquake.id,
});

// When affiliate link is clicked
datadogRum.addAction('affiliate_link_clicked', {
  productId: product.id,
  productName: product.shortName,
  context: 'post-earthquake',
});
```

---

## 2. Support Bay Tremor (Custom Stripe Donations)

### Overview
A professional support/donation system that doesn't use "coffee" branding. Users can:
- Make one-time donations ($5, $10, $25, custom)
- Subscribe for monthly support ($3, $5, $10/month)
- Get perks: ad-free experience, supporter badge, priority feature requests

### Technical Implementation

#### 2.1 Create Support Modal Component

**File: `components/support-bay-tremor.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { X, Heart, Zap, Shield, Star, Check, Loader2 } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONE_TIME_AMOUNTS = [
  { value: 5, label: '$5', description: 'Buy us a snack' },
  { value: 10, label: '$10', description: 'A small thank you' },
  { value: 25, label: '$25', description: 'Supporter level' },
  { value: 50, label: '$50', description: 'Champion level' },
];

const MONTHLY_TIERS = [
  { 
    value: 3, 
    label: '$3/mo',
    name: 'Supporter',
    perks: ['Ad-free experience', 'Supporter badge']
  },
  { 
    value: 5, 
    label: '$5/mo',
    name: 'Champion',
    perks: ['Ad-free experience', 'Supporter badge', 'Priority feature requests']
  },
  { 
    value: 10, 
    label: '$10/mo',
    name: 'Guardian',
    perks: ['Ad-free experience', 'Supporter badge', 'Priority feature requests', 'Early access to new features']
  },
];

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [tab, setTab] = useState<'one-time' | 'monthly'>('one-time');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSupport = async () => {
    setIsLoading(true);
    
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    
    try {
      const response = await fetch('/api/support/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          type: tab,
          email,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-b border-white/5">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Support Bay Tremor</h2>
              <p className="text-sm text-neutral-400">Help us keep the Bay Area informed</p>
            </div>
          </div>
          
          <p className="text-sm text-neutral-300 leading-relaxed">
            Bay Tremor is a passion project built to help our community stay informed about seismic activity. 
            Your support helps cover server costs and enables us to build new features.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab('one-time')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'one-time' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            One-Time
          </button>
          <button
            onClick={() => setTab('monthly')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'monthly' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Monthly Supporter
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {tab === 'one-time' ? (
            <div className="space-y-4">
              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-3">
                {ONE_TIME_AMOUNTS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedAmount(value);
                      setCustomAmount('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedAmount === value && !customAmount
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl font-bold text-white">{label}</span>
                    <span className="block text-xs text-neutral-500 mt-1">{description}</span>
                  </button>
                ))}
              </div>
              
              {/* Custom amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {MONTHLY_TIERS.map(({ value, label, name, perks }) => (
                <button
                  key={value}
                  onClick={() => setSelectedAmount(value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedAmount === value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{name}</span>
                    <span className="text-lg font-bold text-blue-400">{label}</span>
                  </div>
                  <ul className="space-y-1">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm text-neutral-400">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}
          
          {/* Email for receipt */}
          <div className="mt-4">
            <input
              type="email"
              placeholder="Email for receipt (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          {/* Submit button */}
          <button
            onClick={handleSupport}
            disabled={isLoading}
            className="w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Support with ${customAmount || selectedAmount}
                {tab === 'monthly' && '/month'}
              </>
            )}
          </button>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Secure payment
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Powered by Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact button to trigger the modal
interface SupportButtonProps {
  variant?: 'header' | 'inline' | 'floating';
  className?: string;
}

export function SupportButton({ variant = 'inline', className = '' }: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-lg text-sm font-medium text-white transition-all ${className}`}
        >
          <Heart className="w-4 h-4 text-pink-400" />
          Support
        </button>
        <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-24 left-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white text-sm font-semibold rounded-full shadow-xl shadow-purple-500/20 transition-all ${className}`}
        >
          <Heart className="w-4 h-4" />
          Support
        </button>
        <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all ${className}`}
      >
        <Heart className="w-4 h-4" />
        Support Bay Tremor
      </button>
      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

#### 2.2 Stripe Checkout API Route

**File: `app/api/support/create-checkout/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { amount, type, email } = await request.json();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

    if (type === 'monthly') {
      // Create a subscription checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Bay Tremor Monthly Supporter',
                description: 'Monthly support for Bay Tremor - Thank you!',
                images: [`${baseUrl}/android-chrome-512x512.png`],
              },
              unit_amount: amount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/support/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}?support=cancelled`,
        metadata: {
          type: 'monthly_support',
        },
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Create a one-time payment checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Bay Tremor Support',
                description: 'One-time support for Bay Tremor - Thank you!',
                images: [`${baseUrl}/android-chrome-512x512.png`],
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/support/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}?support=cancelled`,
        metadata: {
          type: 'one_time_support',
        },
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

#### 2.3 Thank You Page

**File: `app/support/thank-you/page.tsx`**

```typescript
import { Heart, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You for Supporting Bay Tremor',
  description: 'Your support helps keep the Bay Area informed about seismic activity.',
  robots: 'noindex',
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated heart */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full animate-ping opacity-20" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Thank You! 💜
        </h1>
        
        <p className="text-neutral-400 leading-relaxed mb-6">
          Your support means the world to us. You're helping keep the Bay Area community 
          informed and prepared for seismic activity.
        </p>

        <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
          <p className="text-sm text-neutral-300">
            A receipt has been sent to your email. If you signed up for monthly support, 
            you'll receive an email to access your supporter benefits.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bay Tremor
          </Link>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Bay Tremor',
                  text: 'I just supported Bay Tremor - a free earthquake tracker for the Bay Area!',
                  url: 'https://baytremor.com',
                });
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Bay Tremor
          </button>
        </div>
      </div>
    </main>
  );
}
```

#### 2.4 Environment Variables for Stripe

**Add to `.env.local`:**

```env
# Stripe (for support/donations)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_BASE_URL=https://baytremor.com
```

#### 2.5 Placement Locations

**Header Navigation (`components/dashboard/components/nav-bar.tsx`):**

```typescript
import { SupportButton } from '@/components/support-bay-tremor';

// Add in the header navigation, before the mobile menu:
<SupportButton variant="header" className="hidden md:flex" />
```

**Footer (`components/dashboard.tsx`):**

In the footer section (around line 1410):

```typescript
import { SupportButton } from './support-bay-tremor';

// Add in footer about section:
<div className="mt-4">
  <SupportButton variant="inline" />
</div>
```

---

## 3. Strategic Affiliate Links

### Overview
Contextual, helpful product recommendations that feel natural and add value.

### Affiliate Programs to Join

1. **Amazon Associates** (4-8% commission)
   - Emergency kits, flashlights, water storage
   - Apply: https://affiliate-program.amazon.com/

2. **Judy Emergency Kits** (8-10% commission)
   - Premium emergency preparedness
   - Apply: https://judy.co/pages/affiliate

3. **Home Depot Affiliate** (2-8% commission)
   - Furniture anchors, safety equipment
   - Apply via Impact Radius

4. **REI Co-op** (5% commission)
   - Outdoor/survival gear
   - Apply: https://www.rei.com/affiliate

### Technical Implementation

#### 3.1 Affiliate Links Component

**File: `components/affiliate-recommendations.tsx`**

```typescript
'use client';

import { ExternalLink, Shield, AlertTriangle, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  affiliateUrl: string;
  badge?: 'editor-pick' | 'best-value' | 'most-popular';
  category: 'emergency-kit' | 'safety' | 'supplies';
}

// Curated products - update affiliate URLs with your IDs
const PRODUCTS: Product[] = [
  {
    id: 'judy-mover',
    name: 'Judy Mover Max',
    description: 'Premium 72-hour emergency kit for 4 people. Everything you need in a disaster.',
    price: '$250',
    image: '/images/products/judy-mover.jpg',
    affiliateUrl: 'https://judy.co/products/the-mover-max?ref=BAYTREMOR',
    badge: 'editor-pick',
    category: 'emergency-kit',
  },
  {
    id: 'furniture-straps',
    name: 'Furniture Safety Straps (6-pack)',
    description: 'Secure furniture and TVs to walls. Essential for earthquake-prone areas.',
    price: '$16',
    image: '/images/products/furniture-straps.jpg',
    affiliateUrl: 'https://amzn.to/your-link',
    badge: 'best-value',
    category: 'safety',
  },
  {
    id: 'water-bob',
    name: 'WaterBOB Emergency Water Storage',
    description: 'Store 100 gallons of water in your bathtub. Critical for extended outages.',
    price: '$35',
    image: '/images/products/waterbob.jpg',
    affiliateUrl: 'https://amzn.to/your-link',
    category: 'supplies',
  },
  {
    id: 'emergency-radio',
    name: 'Midland Emergency Weather Radio',
    description: 'NOAA weather alerts + flashlight + phone charger. Battery + hand crank powered.',
    price: '$40',
    image: '/images/products/emergency-radio.jpg',
    affiliateUrl: 'https://amzn.to/your-link',
    badge: 'most-popular',
    category: 'supplies',
  },
];

interface AffiliateRecommendationsProps {
  context?: 'after-earthquake' | 'preparedness' | 'my-area';
  limit?: number;
  className?: string;
}

export function AffiliateRecommendations({ 
  context = 'preparedness', 
  limit = 4,
  className = '' 
}: AffiliateRecommendationsProps) {
  // Filter products based on context
  const contextProducts = context === 'after-earthquake' 
    ? PRODUCTS.filter(p => p.category === 'emergency-kit' || p.category === 'supplies')
    : PRODUCTS;
  
  const displayProducts = contextProducts.slice(0, limit);

  const getContextMessage = () => {
    switch (context) {
      case 'after-earthquake':
        return {
          title: 'Be Prepared for Next Time',
          subtitle: 'Recommended by Bay Area emergency experts',
          icon: AlertTriangle,
        };
      case 'my-area':
        return {
          title: 'Protect Your Neighborhood',
          subtitle: 'Essential items for earthquake-prone areas',
          icon: Shield,
        };
      default:
        return {
          title: 'Preparedness Essentials',
          subtitle: 'Products we recommend for Bay Area households',
          icon: Package,
        };
    }
  };

  const contextInfo = getContextMessage();
  const Icon = contextInfo.icon;

  return (
    <section className={`bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Icon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{contextInfo.title}</h3>
            <p className="text-xs text-neutral-500">{contextInfo.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((product) => (
            <a
              key={product.id}
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group block p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all"
            >
              {/* Badge */}
              {product.badge && (
                <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded mb-2 ${
                  product.badge === 'editor-pick' ? 'bg-blue-500/20 text-blue-400' :
                  product.badge === 'best-value' ? 'bg-green-500/20 text-green-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {product.badge.replace('-', ' ')}
                </span>
              )}
              
              {/* Product Image Placeholder */}
              <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <Package className="w-8 h-8 text-neutral-600" />
              </div>
              
              {/* Product Info */}
              <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                {product.name}
              </h4>
              <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                {product.description}
              </p>
              
              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{product.price}</span>
                <span className="flex items-center gap-1 text-xs text-neutral-400 group-hover:text-blue-400 transition-colors">
                  View <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Disclosure */}
      <div className="px-4 sm:px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <p className="text-[10px] text-neutral-600">
          Affiliate disclosure: Bay Tremor may earn a commission from qualifying purchases. This helps support our free service.
        </p>
      </div>
    </section>
  );
}

// Inline affiliate link for use within content
interface InlineAffiliateProps {
  productId: string;
  children: React.ReactNode;
}

export function InlineAffiliate({ productId, children }: InlineAffiliateProps) {
  const product = PRODUCTS.find(p => p.id === productId);
  
  if (!product) return <>{children}</>;
  
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  );
}
```

#### 3.2 Placement Locations

**After Earthquake Share Pages (`app/earthquake/[id]/page.tsx`):**

Add affiliate recommendations after the earthquake details:

```typescript
import { AffiliateRecommendations } from '@/components/affiliate-recommendations';

// After the earthquake details section, before comments:
<AffiliateRecommendations 
  context="after-earthquake" 
  limit={4}
  className="mt-6"
/>
```

**My Neighborhood Page (`components/my-neighborhood.tsx`):**

After the neighborhood summary:

```typescript
import { AffiliateRecommendations } from './affiliate-recommendations';

// After the stats cards and insights (around line 506):
{stats.total > 0 && (
  <>
    {/* ... existing neighborhood summary ... */}
    
    <AffiliateRecommendations 
      context="my-area" 
      limit={2}
      className="mt-6"
    />
  </>
)}
```

**Learn Tab (Preparedness content):**

```typescript
<AffiliateRecommendations 
  context="preparedness" 
  limit={4}
  className="mt-8"
/>
```

---

## 4. Feature Request System

### Overview
Allow users to submit and vote on feature requests. Optionally, paid users get priority visibility.

### Technical Implementation

#### 4.1 Feature Request Component

**File: `components/feature-requests.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronUp, MessageCircle, Plus, X, Loader2, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeatureRequest {
  _id: string;
  title: string;
  description: string;
  votes: number;
  status: 'pending' | 'planned' | 'in-progress' | 'completed';
  createdAt: string;
  isSupporter?: boolean;
  commentCount: number;
}

export function FeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRequests();
    // Load voted IDs from localStorage
    const stored = localStorage.getItem('baytremor_voted_features');
    if (stored) {
      setVotedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/feature-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load feature requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (id: string) => {
    if (votedIds.has(id)) return;
    
    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, {
        method: 'POST',
      });
      
      if (res.ok) {
        setRequests(prev => 
          prev.map(r => r._id === id ? { ...r, votes: r.votes + 1 } : r)
        );
        const newVoted = new Set(votedIds).add(id);
        setVotedIds(newVoted);
        localStorage.setItem('baytremor_voted_features', JSON.stringify([...newVoted]));
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
        }),
      });
      
      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setShowNewForm(false);
        loadRequests();
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: FeatureRequest['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'planned': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Lightbulb className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Feature Requests</h3>
            <p className="text-xs text-neutral-500">Vote on what we build next</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Suggest
        </button>
      </div>

      {/* New Request Form */}
      {showNewForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">New Feature Request</h4>
            <button 
              type="button"
              onClick={() => setShowNewForm(false)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Feature title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50"
            required
          />
          
          <textarea
            placeholder="Describe the feature (optional)..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          
          <button
            type="submit"
            disabled={isSubmitting || !newTitle.trim()}
            className="w-full py-3 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </form>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No feature requests yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div
              key={request._id}
              className="flex gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-colors"
            >
              {/* Vote Button */}
              <button
                onClick={() => handleVote(request._id)}
                disabled={votedIds.has(request._id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  votedIds.has(request._id)
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/5 hover:bg-purple-500/20 text-neutral-400 hover:text-purple-400'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">{request.votes}</span>
              </button>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white truncate">{request.title}</h4>
                  {request.isSupporter && (
                    <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" title="Supporter request" />
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-medium uppercase rounded border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                
                {request.description && (
                  <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{request.description}</p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                  {request.commentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {request.commentCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 4.2 Feature Request API Routes

**File: `app/api/feature-requests/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('baytremor');
    
    const requests = await db
      .collection('feature_requests')
      .find({})
      .sort({ votes: -1, createdAt: -1 })
      .limit(20)
      .toArray();
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Failed to fetch feature requests:', error);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('baytremor');
    
    const newRequest = {
      title: title.trim(),
      description: description?.trim() || '',
      votes: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      commentCount: 0,
    };
    
    const result = await db.collection('feature_requests').insertOne(newRequest);
    
    return NextResponse.json({ 
      request: { ...newRequest, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Failed to create feature request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
```

**File: `app/api/feature-requests/[id]/vote/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('baytremor');
    
    const result = await db.collection('feature_requests').updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { votes: 1 } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to vote:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
```

#### 4.3 Placement

Add Feature Requests to the Community page or as a dedicated section in the footer:

```typescript
import { FeatureRequests } from '@/components/feature-requests';

// In the Community page or Footer:
<FeatureRequests />
```

---

## 5. Earthquake Preparedness Shop (Next.js Commerce + Shopify)

### Overview

Build a full e-commerce experience using Vercel's [Next.js Commerce](https://vercel.com/templates/next.js/nextjs-commerce) template integrated with Shopify. This transforms Bay Tremor from an affiliate site into an actual store.

**Benefits over pure affiliate:**
- Higher margins (20-40% vs 4-8%)
- Brand control & customer relationship
- Recurring revenue from email list
- Apple Pay / Google Pay built-in
- Professional shopping experience

**Business Model: Dropshipping + Affiliate Hybrid**
- Curated products you actually stock = dropship
- Products you don't stock = affiliate links
- Zero inventory risk with dropship suppliers

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BAY TREMOR ECOSYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  baytremor.com (Main App)                                   │
│  ├── /                    → Earthquake tracking             │
│  ├── /my-area             → My Neighborhood                 │
│  ├── /community           → Discussions                     │
│  ├── /earthquake/[id]     → Share pages                     │
│  │                                                          │
│  └── /shop                → E-commerce (Next.js Commerce)   │
│      ├── /shop/products   → Product catalog                 │
│      ├── /shop/cart       → Shopping cart                   │
│      ├── /shop/checkout   → Checkout (Shopify)              │
│      └── /shop/[product]  → Product detail                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  BACKEND                                                    │
│  ├── Shopify              → Product/order management        │
│  ├── Shopify Payments     → Apple Pay, Google Pay, Cards    │
│  └── Dropship Suppliers   → Fulfillment                     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Setup Steps

#### Step 1: Create Shopify Store

1. **Sign up for Shopify** (14-day free trial)
   - Go to: https://www.shopify.com/
   - Choose store name: "Bay Tremor Preparedness" or similar
   - Select "I'm just starting" / "Online store"

2. **Configure Shopify Payments**
   - Settings → Payments → Activate Shopify Payments
   - Apple Pay and Google Pay are automatically enabled
   - Enter your banking/tax information

3. **Create Storefront API Access**
   - Settings → Apps and sales channels → Develop apps
   - Create new app: "Bay Tremor Storefront"
   - Enable Storefront API with these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
     - `unauthenticated_read_product_tags`
     - `unauthenticated_read_checkouts`
     - `unauthenticated_write_checkouts`
   - Copy the Storefront API access token

#### Step 2: Set Up Next.js Commerce

**Option A: Integrated into Bay Tremor (Recommended)**

```bash
# In your existing Bay Tremor project
# Add Shopify dependencies
npm install @shopify/hydrogen-react

# Create shop directory structure
mkdir -p app/shop
mkdir -p lib/shopify
```

**Option B: Separate Deployment**

```bash
# Clone Next.js Commerce template
git clone https://github.com/vercel/commerce.git baytremor-shop
cd baytremor-shop
npm install
```

#### Step 3: Environment Variables

**Add to `.env.local`:**

```env
# Shopify Store
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
SHOPIFY_REVALIDATION_SECRET=your_random_secret_string

# Optional: Admin API (for inventory management)
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token
```

#### Step 4: Shopify Client Setup

**File: `lib/shopify/index.ts`**

```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export const shopifyClient = createStorefrontApiClient({
  storeDomain: `https://${domain}`,
  apiVersion: '2024-01',
  publicAccessToken: storefrontAccessToken,
});

// Types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  featuredImage: {
    url: string;
    altText: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
      };
    }>;
  };
  tags: string[];
}

// GraphQL Queries
const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
          tags
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      featuredImage {
        url
        altText
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
          }
        }
      }
      tags
    }
  }
`;

const CREATE_CHECKOUT_MUTATION = `
  mutation CreateCheckout($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
      }
      checkoutUserErrors {
        code
        field
        message
      }
    }
  }
`;

// API Functions
export async function getProducts(first = 20): Promise<ShopifyProduct[]> {
  const { data } = await shopifyClient.request(PRODUCTS_QUERY, {
    variables: { first },
  });
  
  return data.products.edges.map((edge: any) => edge.node);
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const { data } = await shopifyClient.request(PRODUCT_BY_HANDLE_QUERY, {
    variables: { handle },
  });
  
  return data.productByHandle;
}

export async function createCheckout(variantId: string, quantity = 1): Promise<string> {
  const { data } = await shopifyClient.request(CREATE_CHECKOUT_MUTATION, {
    variables: {
      input: {
        lineItems: [{ variantId, quantity }],
      },
    },
  });
  
  return data.checkoutCreate.checkout.webUrl;
}
```

### 5.3 Shop Pages Implementation

**File: `app/shop/page.tsx`**

```typescript
import { Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/shopify';
import { Shield, Package, Truck, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earthquake Preparedness Shop | Bay Tremor',
  description: 'Curated earthquake preparedness essentials for Bay Area households. Emergency kits, furniture anchors, water storage, and more.',
};

export default async function ShopPage() {
  const products = await getProducts(20);
  
  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-4">
              Bay Area Earthquake Preparedness
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Be Ready When It Matters
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Curated essentials recommended by emergency experts. 
              Fast shipping, easy returns, and peace of mind.
            </p>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-400" />
              <span>Free Shipping $50+</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span>Apple Pay & Google Pay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: any }) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  
  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group block bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all"
    >
      {/* Image */}
      <div className="aspect-square bg-neutral-800 relative overflow-hidden">
        {product.featuredImage ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-neutral-600" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-white">
          ${price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

export const revalidate = 3600; // Revalidate every hour
```

**File: `app/shop/[handle]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { getProductByHandle, getProducts } from '@/lib/shopify';
import { AddToCartButton } from '@/components/shop/add-to-cart';
import { Shield, Truck, RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductByHandle(params.handle);
  
  if (!product) return {};
  
  return {
    title: `${product.title} | Bay Tremor Shop`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.featuredImage ? [product.featuredImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductByHandle(params.handle);
  
  if (!product) {
    notFound();
  }
  
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const firstVariant = product.variants.edges[0]?.node;
  
  return (
    <main className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-neutral-800 rounded-xl overflow-hidden">
              {product.featuredImage ? (
                <img
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  No image
                </div>
              )}
            </div>
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
              <p className="text-3xl font-bold text-white">${price.toFixed(2)}</p>
            </div>
            
            {/* Add to Cart */}
            {firstVariant && (
              <AddToCartButton
                variantId={firstVariant.id}
                availableForSale={firstVariant.availableForSale}
              />
            )}
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 py-4 border-y border-white/10">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Truck className="w-4 h-4 text-green-400" />
                <span>Free shipping on $50+</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                <span>30-day returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Secure checkout</span>
              </div>
            </div>
            
            {/* Description */}
            <div 
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  const products = await getProducts(50);
  return products.map((product) => ({
    handle: product.handle,
  }));
}

export const revalidate = 3600;
```

**File: `components/shop/add-to-cart.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
  variantId: string;
  availableForSale: boolean;
}

export function AddToCartButton({ variantId, availableForSale }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      
      const { checkoutUrl } = await response.json();
      
      if (checkoutUrl) {
        // Redirect to Shopify checkout
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!availableForSale) {
    return (
      <button
        disabled
        className="w-full py-4 bg-neutral-800 text-neutral-500 font-semibold rounded-xl cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Buy Now
        </>
      )}
    </button>
  );
}
```

**File: `app/api/shop/checkout/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity } = await request.json();
    
    const checkoutUrl = await createCheckout(variantId, quantity);
    
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
```

### 5.4 Dropshipping Setup

**Recommended Dropship Apps for Shopify:**

1. **Spocket** - US/EU suppliers, fast shipping
   - Best for: Emergency kits, home goods
   - Commission: 20-40% margin
   
2. **Printful** - Custom branded products
   - Best for: Bay Tremor branded gear (t-shirts, bags)
   - Commission: 30-50% margin

3. **Wholesale2B** - Wide product selection
   - Best for: Variety of preparedness items

**Setup Process:**
1. Install dropship app in Shopify admin
2. Browse products in your niche
3. Import products to your store
4. Set your markup (typically 30-50%)
5. Customer orders → Auto-fulfillment

### 5.5 Product Sourcing Strategy

**Phase 1: Start with Dropship**
- 10-15 curated products
- Emergency kits, anchors, radios
- No inventory risk
- Test what sells

**Phase 2: Add Wholesale (If Successful)**
- Buy best sellers in bulk
- Higher margins (50-70%)
- Faster shipping
- Bay Tremor branded packaging

**Phase 3: Custom Products**
- "Bay Tremor Emergency Kit" (private label)
- Highest margins
- Brand building

---

## 6. Implementation Checklist

### Phase 1: Affiliate Links (Day 1-3) 🔴 PRIORITY

**Day 1:**
- [x] Sign up for Amazon Associates: https://affiliate-program.amazon.com/ ✅
- [x] Apply for Impact Radius (pending 1-3 days) ✅
- [ ] Create `lib/affiliate-products.ts` with curated products
- [ ] Add your Amazon Associate ID to product URLs

**Day 2:**
- [ ] Create `components/affiliate-recommendations.tsx`
- [ ] Add affiliate section to Homepage (highest conversion!)
- [ ] Add affiliate section to `/earthquake/[id]` pages
- [ ] Add affiliate section to My Neighborhood page

**Day 3:**
- [ ] Add FTC disclosure to footer
- [ ] Test all affiliate links
- [ ] Set up click tracking in Datadog RUM

### Phase 2: Support System (Day 4-5)

- [ ] Create Stripe account: https://stripe.com/
- [ ] Create `components/support-bay-tremor.tsx`
- [ ] Create `/api/support/create-checkout/route.ts`
- [ ] Create `/app/support/thank-you/page.tsx`
- [ ] Add Support button to header navigation
- [ ] Test checkout flow in Stripe test mode
- [ ] Switch to Stripe live mode

### Phase 3: Feature Requests (Day 6-7)

- [ ] Create `components/feature-requests.tsx`
- [ ] Create `/api/feature-requests/route.ts`
- [ ] Create `/api/feature-requests/[id]/vote/route.ts`
- [ ] Add to Community page or footer
- [ ] Create MongoDB collection for storage

### Phase 4: E-commerce Shop (Week 2-3)

**Week 2:**
- [ ] Create Shopify store and account
- [ ] Set up Shopify Payments (Apple Pay auto-enabled)
- [ ] Create Storefront API credentials
- [ ] Install dropship app (Spocket recommended)
- [ ] Import 10-15 products

**Week 3:**
- [ ] Create `lib/shopify/index.ts`
- [ ] Create `/app/shop/page.tsx`
- [ ] Create `/app/shop/[handle]/page.tsx`
- [ ] Create `/api/shop/checkout/route.ts`
- [ ] Add navigation link to shop
- [ ] Test full checkout flow

---

## 7. Revenue Projections (Updated)

Based on 5,400 weekly visitors:

| Source | Weekly Est. | Monthly Est. | Notes |
|--------|-------------|--------------|-------|
| Affiliate Links | $50-150 | $200-600 | 3% CVR, $30 avg order, 5% commission |
| Support Donations | $25-75 | $100-300 | 0.5% conversion at avg $10 |
| E-commerce Shop | $100-300 | $400-1,200 | 2% CVR, $50 avg order, 30% margin |
| **Total** | **$175-525** | **$700-2,100** | Conservative estimate |

**After AdSense Approval (Additional):**
| AdSense | $40-100 | $160-400 | 2-4 CPM |
| **Grand Total** | **$215-625** | **$860-2,500** |

When AdSense is approved (higher CPM expected):

| Source | Weekly Est. | Monthly Est. |
|--------|-------------|--------------|
| Google AdSense | $30-80 | $120-320 |
| Support + Affiliate | $50-125 | $200-500 |
| **Total** | **$80-205** | **$320-820** |

---

## 8. Legal Requirements

### FTC Affiliate Disclosure
Add to footer and any page with affiliate links:

```typescript
<p className="text-[10px] text-neutral-600 mt-4">
  Affiliate Disclosure: Some links on this site are affiliate links. 
  Bay Tremor may earn a commission from qualifying purchases at no extra cost to you.
</p>
```

### Privacy Policy Updates
Add to privacy policy:
- Stripe payment processing for donations
- Shopify checkout for e-commerce
- Affiliate link tracking (Amazon, etc.)
- MongoDB data storage for feature requests

### Terms of Service
Add supporter/donation terms:
- Donation refund policy (non-refundable after 7 days)
- Monthly subscription cancellation (anytime, no refund for current period)
- Perk delivery timeline (instant for digital perks)

### E-commerce Terms
- Return policy (30 days)
- Shipping policy
- Product disclaimers

---

## 9. File Structure Summary

```
lib/
├── affiliate-products.ts            # Product data & helpers
├── shopify/
│   └── index.ts                     # Shopify client & queries

components/
├── affiliate-recommendations.tsx    # Affiliate product grid
├── support-bay-tremor.tsx           # Donation modal + button
├── feature-requests.tsx             # Feature voting
├── shop/
│   └── add-to-cart.tsx              # E-commerce add to cart

app/
├── api/
│   ├── support/
│   │   └── create-checkout/
│   │       └── route.ts             # Stripe checkout
│   ├── feature-requests/
│   │   ├── route.ts                 # List + create
│   │   └── [id]/
│   │       └── vote/
│   │           └── route.ts         # Vote endpoint
│   └── shop/
│       └── checkout/
│           └── route.ts             # Shopify checkout
├── support/
│   └── thank-you/
│       └── page.tsx                 # Post-donation thank you
└── shop/
    ├── page.tsx                     # Product catalog
    └── [handle]/
        └── page.tsx                 # Product detail

public/
└── images/
    └── products/                    # Product images (optional)
```

---

## 10. Environment Variables

```env
# ===================
# AFFILIATE LINKS (Amazon Associates)
# ===================
NEXT_PUBLIC_AMAZON_AFFILIATE_ID=baytremor-20
# Add more affiliate IDs here when Impact Radius is approved

# ===================
# STRIPE (Donations)
# ===================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_BASE_URL=https://baytremor.com

# ===================
# SHOPIFY (E-commerce)
# ===================
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
SHOPIFY_REVALIDATION_SECRET=random_secret_for_webhooks

# Optional: Admin API for inventory management
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
```

---

## 11. Monitoring & Optimization

### Track These Metrics in Datadog RUM:

**Affiliate Tracking:**
```typescript
// Add to affiliate link clicks
datadogRum.addAction('affiliate_click', {
  productId: product.id,
  productName: product.shortName,
  price: product.price,
  context: 'post-earthquake', // or 'my-area', 'learn'
  source: 'affiliate-recommendations',
});
```

**Support Tracking:**
```typescript
// Support modal opened
datadogRum.addAction('support_modal_opened', { variant: 'header' });

// Checkout started
datadogRum.addAction('support_checkout_started', {
  type: 'one-time', // or 'monthly'
  amount: 10,
});
```

**Shop Tracking:**
```typescript
// Product viewed
datadogRum.addAction('shop_product_viewed', {
  productHandle: handle,
  productTitle: title,
  price: price,
});

// Checkout initiated
datadogRum.addAction('shop_checkout_initiated', {
  variantId: variantId,
  price: price,
});
```

### Key Metrics to Monitor:

| Metric | Target | How to Track |
|--------|--------|--------------|
| Affiliate CTR | 3-5% | Clicks / Page Views |
| Affiliate Conversion | 2-4% | Orders / Clicks (via Amazon reports) |
| Support Conversion | 0.5-1% | Donations / Visitors |
| Shop Conversion | 1-2% | Orders / Shop Visitors |
| Avg Order Value | $40-60 | Revenue / Orders |

### A/B Testing Opportunities:

1. **Affiliate Section:**
   - Position: after stats vs after insights
   - Number of products: 2 vs 3 vs 4
   - Copy: "Be Prepared" vs "Recommended by Experts"

2. **Support Button:**
   - Placement: header vs floating vs footer
   - Color: blue gradient vs subtle white
   - Copy: "Support" vs "Support Bay Tremor" vs "♥ Support"

3. **Shop Promotion:**
   - Banner placement in earthquake pages
   - "Shop our preparedness essentials" vs "Get your kit"

---

## 12. Quick Start (Do This First!)

### ✅ COMPLETED:
- [x] Signed up for Amazon Associates
- [x] Applied for Impact Radius (pending 1-3 days approval)

### TODAY - Build Affiliate Components:
1. Create `lib/affiliate-products.ts` with your Associate ID
2. Create `components/affiliate-recommendations.tsx`
3. Add to Homepage (highest conversion!)
4. Add to earthquake share pages
5. Add FTC disclosure to footer

### This Week:
1. Set up Stripe account for donations
2. Implement Support Bay Tremor system
3. Add feature request voting

### Next Week:
1. Create Shopify store
2. Import products from dropship supplier
3. Deploy Next.js Commerce integration

---

*Document Version: 2.1*
*Last Updated: December 2024*
*Status: Amazon Associates ✅ | Impact Radius ⏳ | Stripe 🔜*
*Priority: Affiliate Links → Support → Features → E-commerce*

