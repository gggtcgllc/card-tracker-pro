export interface NormalizedCardListing {
  id: string;
  card_title: string;
  price: number;
  grade: string | null;
  source: string;
  sale_date: string;
  verified: boolean;
  marketplace: string;
  url?: string;
  scraped_at?: string;
}

export const REPUTABLE_PLATFORMS = [
  // ===== PREMIUM AUCTION HOUSES =====
  {
    id: 'heritage',
    name: 'Heritage Auctions',
    url: 'ha.com',
    category: 'Premium Auction House',
    verification: 'Major auction house with full transparency',
    scraperEnabled: true,
  },
  {
    id: 'goldin',
    name: 'Goldin Auctions',
    url: 'goldinauctions.com',
    category: 'Premium Auction House',
    verification: 'Reputable auction house with certified lots',
    scraperEnabled: true,
  },
  {
    id: 'pwcc-auctions',
    name: 'PWCC Auctions',
    url: 'pwccauctions.com',
    category: 'Premium Auction House',
    verification: 'Trusted collectibles auction house',
    scraperEnabled: true,
  },
  // ===== GENERAL MARKETPLACES =====
  {
    id: 'ebay',
    name: 'eBay',
    url: 'ebay.com',
    category: 'General Marketplace',
    verification: 'Transaction history, bid records, seller ratings',
    scraperEnabled: true,
  },
  {
    id: 'mercari',
    name: 'Mercari',
    url: 'mercari.com',
    category: 'Peer-to-Peer Marketplace',
    verification: 'Platform-verified transactions, seller ratings',
    scraperEnabled: true,
  },
  // ===== SPECIALIZED COLLECTIBLES MARKETPLACES =====
  {
    id: 'comc',
    name: 'COMC (Collectors Market)',
    url: 'comc.com',
    category: 'Collectibles Marketplace',
    verification: 'Established collectibles marketplace with escrow',
    scraperEnabled: true,
  },
  {
    id: 'pwcc-marketplace',
    name: 'PWCC Marketplace',
    url: 'pwccmarketplace.com',
    category: 'Collectibles Marketplace',
    verification: 'PWCC-verified sellers and transactions',
    scraperEnabled: true,
  },
  // ===== CARD-SPECIFIC PLATFORMS =====
  {
    id: '130point',
    name: '130Point.com',
    url: '130point.com',
    category: 'Specialized Card Sales Platform',
    verification: 'Dedicated card trading and sales platform',
    scraperEnabled: true,
  },
  {
    id: 'sportlots',
    name: 'Sportlots',
    url: 'sportlots.com',
    category: 'Sports Cards Marketplace',
    verification: 'Established sports card marketplace',
    scraperEnabled: true,
  },
  {
    id: 'tcgplayer',
    name: 'TCGPlayer',
    url: 'tcgplayer.com',
    category: 'Trading Card Game Marketplace',
    verification: 'Leading TCG marketplace with verified sellers',
    scraperEnabled: true,
  },
  {
    id: 'cardmarket',
    name: 'Cardmarket',
    url: 'cardmarket.com',
    category: 'European Card Marketplace',
    verification: 'Largest European card marketplace',
    scraperEnabled: true,
  },
  // ===== LIVE AUCTION PLATFORMS =====
  {
    id: 'whatnot',
    name: 'Whatnot',
    url: 'whatnot.com',
    category: 'Live Auction Platform',
    verification: 'Live verified auctions with recorded history',
    scraperEnabled: true,
  },
  // ===== OFFICIAL GRADING COMPANY CHANNELS =====
  {
    id: 'psa-official',
    name: 'PSA Official (eBay)',
    url: 'ebay.com (PSA listings)',
    category: 'Grading Company - Official Channel',
    verification: 'Official PSA certified listings on eBay',
    scraperEnabled: true,
  },
  {
    id: 'sgc-official',
    name: 'SGC Official (eBay)',
    url: 'ebay.com (SGC listings)',
    category: 'Grading Company - Official Channel',
    verification: 'Official SGC certified listings on eBay',
    scraperEnabled: true,
  },
  {
    id: 'bvg-official',
    name: 'BGS/BVG Official (eBay)',
    url: 'ebay.com (BGS listings)',
    category: 'Grading Company - Official Channel',
    verification: 'Official BGS/BVG certified listings on eBay',
    scraperEnabled: true,
  },
  // ===== OFFICIAL LICENSED PLATFORMS =====
  {
    id: 'fanatics',
    name: 'Fanatics Collect',
    url: 'fanaticscollect.com',
    category: 'Official Licensed Marketplace',
    verification: 'Official platform with verified transactions',
    scraperEnabled: true,
  },
  // ===== PRICING & REFERENCE DATABASES =====
  {
    id: 'card-ladder',
    name: 'Card Ladder',
    url: 'cardladder.com',
    category: 'Card Pricing & Marketplace',
    verification: 'Card pricing tracker with verified sales database',
    scraperEnabled: true,
  },
  {
    id: 'price-charting',
    name: 'PriceCharting',
    url: 'pricecharting.com',
    category: 'Price Tracking & Marketplace',
    verification: 'Community-driven pricing with verified sales history',
    scraperEnabled: true,
  },
];
