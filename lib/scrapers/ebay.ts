// lib/scrapers/ebay.ts
// Production: use eBay Browse API (https://developer.ebay.com/api-docs/buy/browse/overview.html)
import { EBAY_LISTINGS } from '../data/sample-listings';

export interface EbayListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeEbay(): Promise<EbayListing[]> {
  try {
    return EBAY_LISTINGS;
  } catch (error) {
    console.error('eBay scraper error:', error);
    return [];
  }
}
