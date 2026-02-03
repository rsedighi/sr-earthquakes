/**
 * Affiliate Products Configuration
 * 
 * Curated earthquake preparedness products from Amazon Associates.
 * Images are loaded directly from Amazon's CDN.
 * 
 * Product Selection Criteria:
 * - 4.5+ star rating
 * - 1000+ reviews (social proof)
 * - Prime eligible (faster conversion)
 * - Bay Area relevant (apartment-friendly options)
 */

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
  imageUrl: string; // Amazon product image URL
  badge?: 'best-seller' | 'editor-pick' | 'best-value' | 'most-popular';
  primeEligible?: boolean;
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ===== EMERGENCY KITS =====
  {
    id: 'ready-america-72hr-2person',
    name: 'Ready America 72 Hour Deluxe Emergency Kit, 2-Person',
    shortName: '72-Hour Emergency Kit (2-Person)',
    description: 'Everything 2 people need for 72 hours: food, water, first aid, power station, and survival blanket.',
    whyRecommended: 'Amazon\'s Choice with 200+ bought last month. Complete 3-day backpack kit.',
    price: 79.99,
    rating: 4.5,
    reviewCount: 1847,
    category: 'emergency-kit',
    affiliateUrl: 'https://amzn.to/4r2Rxg0',
    imageUrl: 'https://m.media-amazon.com/images/I/81pJqthpXgL._AC_SX679_.jpg',
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'ready-america-72hr-4person',
    name: 'Ready America 72 Hour Deluxe Emergency Kit, 4-Person',
    shortName: '72-Hour Emergency Kit (4-Person)',
    description: 'Complete emergency supplies for a family of 4 for 72 hours. Backpack included.',
    whyRecommended: 'Best value for families. Prime eligible.',
    price: 139.99,
    rating: 4.5,
    reviewCount: 892,
    category: 'emergency-kit',
    affiliateUrl: 'https://amzn.to/4qTsbki',
    imageUrl: 'https://m.media-amazon.com/images/I/91i4BTTrN4L._AC_SX679_.jpg',
    badge: 'best-value',
    primeEligible: true,
  },
  {
    id: 'sirius-bug-out-bag',
    name: 'Sirius Pre-Packed Bug Out Bag - 72 Hour Kit for 2 People',
    shortName: 'Premium Bug Out Bag',
    description: 'Premium 50L tactical backpack with essential survival gear for 2 people.',
    whyRecommended: 'Upgraded survival backpack with premium bugout gear. Ready to grab and go.',
    price: 189.99,
    rating: 4.6,
    reviewCount: 547,
    category: 'emergency-kit',
    affiliateUrl: 'https://amzn.to/4tdPI11',
    imageUrl: 'https://m.media-amazon.com/images/I/A10fe4Kf64L._AC_SX679_.jpg',
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
    reviewCount: 3241,
    category: 'furniture-safety',
    affiliateUrl: 'https://amzn.to/4a0GtZa',
    imageUrl: 'https://m.media-amazon.com/images/I/61G7SyiZMSL._AC_SX679_.jpg',
    badge: 'best-seller',
    primeEligible: true,
  },
  {
    id: 'quakehold-tv-strap',
    name: 'Quakehold! Universal Flat Screen TV Safety Strap',
    shortName: 'TV Safety Straps',
    description: 'Secure flat screen TVs up to 70". Prevents tip-overs during earthquakes.',
    whyRecommended: 'Essential for any home with a TV. No-drill adhesive installation.',
    price: 30.06,
    rating: 4.6,
    reviewCount: 872,
    category: 'furniture-safety',
    affiliateUrl: 'https://amzn.to/4t938vb',
    imageUrl: 'https://m.media-amazon.com/images/I/71NoY3Ft0oS._AC_SX679_.jpg',
    badge: 'best-value',
    primeEligible: true,
  },
  {
    id: 'furniture-anchors-6pack',
    name: 'Furniture Anchors Anti Tip Kit (6-Pack)',
    shortName: 'Furniture Anchors (6-Pack)',
    description: 'Heavy duty furniture straps to prevent tip-overs. Child and earthquake safe.',
    whyRecommended: 'Best value - 6 straps for multiple pieces of furniture.',
    price: 12.99,
    rating: 4.6,
    reviewCount: 4521,
    category: 'furniture-safety',
    affiliateUrl: 'https://amzn.to/4qcsl5e',
    imageUrl: 'https://m.media-amazon.com/images/I/61NKJY4t0OL._SX679_.jpg',
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
    reviewCount: 2156,
    category: 'water-storage',
    affiliateUrl: 'https://amzn.to/3ZaoWch',
    imageUrl: 'https://m.media-amazon.com/images/I/51F-dULUufL._AC_SX679_.jpg',
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'emergency-water-pouches-96',
    name: 'Emergency Drinking Water Pouches (96-Pack)',
    shortName: 'Emergency Water Pouches (96)',
    description: '10-year shelf life water ration packets. 4.227 fl oz each. Made in USA.',
    whyRecommended: '10-year shelf life! Store and forget. Individual survival water rations.',
    price: 49.99,
    rating: 4.7,
    reviewCount: 1847,
    category: 'water-storage',
    affiliateUrl: 'https://amzn.to/3NVdLlc',
    imageUrl: 'https://m.media-amazon.com/images/I/41GytrFm+7L._SY300_SX300_QL70_FMwebp_.jpg',
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
    reviewCount: 5623,
    category: 'water-storage',
    affiliateUrl: 'https://amzn.to/4qVkSIU',
    imageUrl: 'https://m.media-amazon.com/images/I/71RhqoU3BzL._AC_SX679_.jpg',
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
    reviewCount: 2341,
    category: 'communication',
    affiliateUrl: 'https://amzn.to/3NUEQoD',
    imageUrl: 'https://m.media-amazon.com/images/I/71MnhLhcyHL._AC_SX466_.jpg',
    badge: 'editor-pick',
    primeEligible: true,
  },
  {
    id: 'anker-prime-powerbank',
    name: 'Anker Prime Power Bank, 20,100mAh 3-Port Portable Charger',
    shortName: 'Anker Prime Power Bank',
    description: '220W max output, two-way charging, TSA-approved. Works with MacBook, iPhone, and more.',
    whyRecommended: 'Premium power bank with app control. Charges laptops and phones. TSA-approved.',
    price: 99.99,
    rating: 4.7,
    reviewCount: 3456,
    category: 'communication',
    affiliateUrl: 'https://amzn.to/3LZ8aK9',
    imageUrl: 'https://m.media-amazon.com/images/I/61B8Mnv4zHL._AC_SX679_.jpg',
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
    reviewCount: 892,
    category: 'communication',
    affiliateUrl: 'https://amzn.to/4kh2GqH',
    imageUrl: 'https://m.media-amazon.com/images/I/41SQTgrAY6L._AC_SX679_.jpg',
    primeEligible: true,
  },
  {
    id: 'ecoflow-delta3-max',
    name: 'EF ECOFLOW Portable Power Station DELTA 3 Max',
    shortName: 'EcoFlow Power Station',
    description: '2048Wh LiFePO4 battery, 3400W output, charges 0-80% in 1.13 hours. Home backup & camping.',
    whyRecommended: 'Ultimate power backup. Run appliances during outages. Ultra-fast charging.',
    price: 1699.00,
    rating: 4.6,
    reviewCount: 547,
    category: 'communication',
    affiliateUrl: 'https://amzn.to/4ac0gF8',
    imageUrl: 'https://m.media-amazon.com/images/I/61XcQS5XuML._AC_SY300_SX300_QL70_FMwebp_.jpg',
    badge: 'most-popular',
    primeEligible: true,
  },

  // ===== FIRST AID =====
  {
    id: 'large-first-aid-kit',
    name: 'Large First Aid Kit for Car, Travel & Home',
    shortName: 'Large First Aid Kit',
    description: 'Emergency kit for hiking, camping, backpacking. Includes Zip Stitch wound closure strips.',
    whyRecommended: 'Comprehensive kit with wound closure strips. Great for car, home, or travel.',
    price: 39.99,
    rating: 4.8,
    reviewCount: 4521,
    category: 'first-aid',
    affiliateUrl: 'https://amzn.to/4a9hNOd',
    imageUrl: 'https://m.media-amazon.com/images/I/81BS0vr0HnL._AC_SY300_SX300_QL70_FMwebp_.jpg',
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
    reviewCount: 3241,
    category: 'first-aid',
    affiliateUrl: 'https://amzn.to/4aaq1G6',
    imageUrl: 'https://m.media-amazon.com/images/I/71-XbNwz8jL._AC_SY300_SX300_QL70_FMwebp_.jpg',
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


