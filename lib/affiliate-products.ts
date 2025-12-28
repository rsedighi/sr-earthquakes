/**
 * Affiliate Products Configuration
 * 
 * Curated earthquake preparedness products from Amazon Associates.
 * Update AMAZON_TAG with your actual Associate ID.
 * 
 * Product Selection Criteria:
 * - 4.5+ star rating
 * - 1000+ reviews (social proof)
 * - Prime eligible (faster conversion)
 * - Bay Area relevant (apartment-friendly options)
 */

// Replace with your actual Amazon Associate ID
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_ID || 'baytremor-20';

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
  imageUrl?: string;
  badge?: 'best-seller' | 'editor-pick' | 'best-value' | 'most-popular';
  primeEligible?: boolean;
  asin: string; // Amazon Standard Identification Number
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ===== EMERGENCY KITS =====
  {
    id: 'ready-america-72hr-2person',
    name: 'Ready America 72 Hour Emergency Kit, 2-Person',
    shortName: '72-Hour Emergency Kit (2-Person)',
    description: 'Everything 2 people need for 72 hours: food, water, first aid, light, and shelter.',
    whyRecommended: 'Amazon #1 best-seller with 7,000+ reviews. The most popular starter kit.',
    price: 59.99,
    rating: 4.5,
    reviewCount: 7234,
    category: 'emergency-kit',
    asin: 'B000GASL9Q',
    affiliateUrl: `https://www.amazon.com/dp/B000GASL9Q?tag=${AMAZON_TAG}`,
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'ready-america-72hr-4person',
    name: 'Ready America 72 Hour Deluxe Emergency Kit, 4-Person',
    shortName: '72-Hour Emergency Kit (4-Person)',
    description: 'Complete emergency supplies for a family of 4 for 72 hours. Backpack included.',
    whyRecommended: 'Best value for families. Over 5,000 reviews and Prime eligible.',
    price: 139.99,
    rating: 4.5,
    reviewCount: 5123,
    category: 'emergency-kit',
    asin: 'B0007TXOTG',
    affiliateUrl: `https://www.amazon.com/dp/B0007TXOTG?tag=${AMAZON_TAG}`,
    badge: 'best-value',
    primeEligible: true,
  },
  {
    id: 'sustain-supply-co-premium',
    name: 'Sustain Supply Co. Premium Emergency Survival Bag/Kit',
    shortName: 'Premium Survival Kit',
    description: 'Premium 72-hour kit with high-quality gear. Includes tools, shelter, and food for 2-4 people.',
    whyRecommended: 'Premium quality gear that lasts. Great reviews for actual emergency use.',
    price: 159.99,
    rating: 4.6,
    reviewCount: 2847,
    category: 'emergency-kit',
    asin: 'B01MZEZQMY',
    affiliateUrl: `https://www.amazon.com/dp/B01MZEZQMY?tag=${AMAZON_TAG}`,
    badge: 'editor-pick',
    primeEligible: true,
  },

  // ===== FURNITURE SAFETY =====
  {
    id: 'quakehold-furniture-straps',
    name: 'Quakehold! 4161 Furniture Strap Kit',
    shortName: 'Furniture Safety Straps',
    description: 'Secure furniture and bookcases to walls. Easy installation, no drilling required.',
    whyRecommended: 'Industry standard for earthquake safety. Used by museums and hospitals.',
    price: 14.99,
    rating: 4.5,
    reviewCount: 8921,
    category: 'furniture-safety',
    asin: 'B00006RSIL',
    affiliateUrl: `https://www.amazon.com/dp/B00006RSIL?tag=${AMAZON_TAG}`,
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'quakehold-tv-strap',
    name: 'Quakehold! 4520 Universal Flat Screen TV Strap',
    shortName: 'TV Safety Straps',
    description: 'Secure flat screen TVs up to 70". Prevents tip-overs during earthquakes.',
    whyRecommended: 'Essential for any home with a TV. Simple velcro installation.',
    price: 15.99,
    rating: 4.4,
    reviewCount: 4532,
    category: 'furniture-safety',
    asin: 'B000CRXW8E',
    affiliateUrl: `https://www.amazon.com/dp/B000CRXW8E?tag=${AMAZON_TAG}`,
    badge: 'best-value',
    primeEligible: true,
  },
  {
    id: 'furniture-anchors-6pack',
    name: 'Furniture Anchors Anti Tip Kit (6-Pack)',
    shortName: 'Furniture Anchors (6-Pack)',
    description: 'Heavy duty furniture straps to prevent tip-overs. Child and earthquake safe.',
    whyRecommended: 'Best value - 6 straps for multiple pieces of furniture. 15,000+ reviews.',
    price: 12.99,
    rating: 4.6,
    reviewCount: 15432,
    category: 'furniture-safety',
    asin: 'B01M0N4BQW',
    affiliateUrl: `https://www.amazon.com/dp/B01M0N4BQW?tag=${AMAZON_TAG}`,
    badge: 'most-popular',
    primeEligible: true,
  },

  // ===== WATER STORAGE =====
  {
    id: 'waterbob',
    name: 'WaterBOB Emergency Drinking Water Storage',
    shortName: 'WaterBOB (100 Gallons)',
    description: 'Store up to 100 gallons of fresh drinking water in your bathtub. Keeps water clean for weeks.',
    whyRecommended: 'Brilliant solution for apartments. Fill it before a storm or when you feel tremors.',
    price: 34.95,
    rating: 4.5,
    reviewCount: 5623,
    category: 'water-storage',
    asin: 'B001AXLUX2',
    affiliateUrl: `https://www.amazon.com/dp/B001AXLUX2?tag=${AMAZON_TAG}`,
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'aqua-literz-water-pouches',
    name: 'Aqua Literz Emergency Water Pouches (12-Pack)',
    shortName: 'Emergency Water Pouches',
    description: 'Pre-packaged water with 5-year shelf life. Coast Guard approved. 12oz each.',
    whyRecommended: 'No maintenance required. Store and forget for 5 years.',
    price: 17.99,
    rating: 4.7,
    reviewCount: 3421,
    category: 'water-storage',
    asin: 'B00QD9ATTY',
    affiliateUrl: `https://www.amazon.com/dp/B00QD9ATTY?tag=${AMAZON_TAG}`,
    primeEligible: true,
  },
  {
    id: 'reliance-aqua-tainer',
    name: 'Reliance Products Aqua-Tainer 7 Gallon Water Container',
    shortName: 'Water Container (7 Gallon)',
    description: 'Rigid, stackable water container. Hideaway spout for easy pouring.',
    whyRecommended: 'Perfect for apartment storage. Stackable and durable.',
    price: 19.99,
    rating: 4.7,
    reviewCount: 12543,
    category: 'water-storage',
    asin: 'B001QC31G6',
    affiliateUrl: `https://www.amazon.com/dp/B001QC31G6?tag=${AMAZON_TAG}`,
    badge: 'best-seller',
    primeEligible: true,
  },

  // ===== COMMUNICATION & POWER =====
  {
    id: 'midland-er310',
    name: 'Midland ER310 Emergency Crank Weather Alert Radio',
    shortName: 'Emergency Crank Radio',
    description: 'NOAA weather alerts, flashlight, SOS beacon, and phone charger. Solar + hand crank powered.',
    whyRecommended: 'The gold standard emergency radio. Works when power is out. Charges your phone.',
    price: 59.99,
    rating: 4.6,
    reviewCount: 4521,
    category: 'communication',
    asin: 'B00176T9OY',
    affiliateUrl: `https://www.amazon.com/dp/B00176T9OY?tag=${AMAZON_TAG}`,
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'anker-powercore-20000',
    name: 'Anker PowerCore 20000mAh Portable Charger',
    shortName: 'Anker Power Bank',
    description: 'Charge your phone 4-5 times. Essential for staying connected during power outages.',
    whyRecommended: 'The most reliable power bank. 89,000+ reviews. A must-have.',
    price: 49.99,
    rating: 4.7,
    reviewCount: 89234,
    category: 'communication',
    asin: 'B07S829LBX',
    affiliateUrl: `https://www.amazon.com/dp/B07S829LBX?tag=${AMAZON_TAG}`,
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'goal-zero-torch-500',
    name: 'Goal Zero Torch 500 Multi-Functional Light',
    shortName: 'Goal Zero Flashlight',
    description: 'Flashlight + USB charger + red emergency beacon. Solar + hand crank powered.',
    whyRecommended: 'Multiple power sources means it always works. Great for emergencies.',
    price: 79.99,
    rating: 4.5,
    reviewCount: 1234,
    category: 'communication',
    asin: 'B079YBC7ND',
    affiliateUrl: `https://www.amazon.com/dp/B079YBC7ND?tag=${AMAZON_TAG}`,
    primeEligible: true,
  },

  // ===== FIRST AID =====
  {
    id: 'surviveware-first-aid',
    name: 'Surviveware Small First Aid Kit for Hiking, Backpacking, Camping',
    shortName: 'Compact First Aid Kit',
    description: 'Comprehensive 100-piece first aid kit in a compact, organized case.',
    whyRecommended: 'The most organized first aid kit. Everything labeled and easy to find.',
    price: 34.99,
    rating: 4.8,
    reviewCount: 12543,
    category: 'first-aid',
    asin: 'B074N9YWPX',
    affiliateUrl: `https://www.amazon.com/dp/B074N9YWPX?tag=${AMAZON_TAG}`,
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'swiss-safe-first-aid',
    name: 'Swiss Safe 2-in-1 First Aid Kit (120 Piece)',
    shortName: 'First Aid Kit (120 Piece)',
    description: 'Hospital-grade first aid kit with bonus mini kit. FDA approved.',
    whyRecommended: 'Two kits in one - keep one at home, one in the car.',
    price: 27.99,
    rating: 4.7,
    reviewCount: 8976,
    category: 'first-aid',
    asin: 'B01HGSLB2W',
    affiliateUrl: `https://www.amazon.com/dp/B01HGSLB2W?tag=${AMAZON_TAG}`,
    badge: 'best-value',
    primeEligible: true,
  },
];

// ===== HELPER FUNCTIONS =====

/**
 * Get products by category
 */
export function getProductsByCategory(category: AffiliateProduct['category']): AffiliateProduct[] {
  return AFFILIATE_PRODUCTS.filter(p => p.category === category);
}

/**
 * Get a single product by ID
 */
export function getProductById(id: string): AffiliateProduct | undefined {
  return AFFILIATE_PRODUCTS.find(p => p.id === id);
}

/**
 * Get featured products (those with badges)
 */
export function getFeaturedProducts(limit = 4): AffiliateProduct[] {
  return AFFILIATE_PRODUCTS
    .filter(p => p.badge)
    .slice(0, limit);
}

/**
 * Get products based on page context
 */
export function getProductsForContext(
  context: 'post-earthquake' | 'homepage' | 'my-area' | 'learn',
  limit = 3
): AffiliateProduct[] {
  switch (context) {
    case 'post-earthquake':
      // After an earthquake: emergency kits + communication (high urgency)
      return AFFILIATE_PRODUCTS
        .filter(p => p.category === 'emergency-kit' || p.category === 'communication')
        .filter(p => p.badge) // Prioritize badged products
        .slice(0, limit);
    
    case 'homepage':
      // Homepage: show best sellers across categories
      return AFFILIATE_PRODUCTS
        .filter(p => p.badge === 'best-seller' || p.badge === 'editor-pick')
        .slice(0, limit);
    
    case 'my-area':
      // Protecting your home: furniture safety + water storage
      return AFFILIATE_PRODUCTS
        .filter(p => p.category === 'furniture-safety' || p.category === 'water-storage')
        .filter(p => p.badge)
        .slice(0, limit);
    
    case 'learn':
      // Educational: show everything, diverse categories
      const categories = ['emergency-kit', 'furniture-safety', 'water-storage', 'communication'] as const;
      return categories
        .map(cat => AFFILIATE_PRODUCTS.find(p => p.category === cat && p.badge))
        .filter((p): p is AffiliateProduct => p !== undefined)
        .slice(0, limit);
    
    default:
      return getFeaturedProducts(limit);
  }
}

/**
 * Get the total number of products
 */
export function getTotalProductCount(): number {
  return AFFILIATE_PRODUCTS.length;
}

/**
 * Get categories with counts
 */
export function getCategoriesWithCounts(): Record<string, number> {
  return AFFILIATE_PRODUCTS.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}


