// lib/scrapers/pricing-platforms.ts
import { CARD_LADDER_LISTINGS, PRICECHARTING_LISTINGS } from '../data/sample-listings';

export interface PricingPlatformListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: 'Card Ladder' | 'PriceCharting';
}

export async function scrapeCardLadder(): Promise<PricingPlatformListing[]> {
  try {
    return CARD_LADDER_LISTINGS.map(l => ({ ...l, source: 'Card Ladder' as const }));
  } catch (error) {
    console.error('Card Ladder scraper error:', error);
    return [];
  }
}

export async function scrapePriceCharting(): Promise<PricingPlatformListing[]> {
  try {
    return PRICECHARTING_LISTINGS.map(l => ({ ...l, source: 'PriceCharting' as const }));
  } catch (error) {
    console.error('PriceCharting scraper error:', error);
    return [];
  }
}
