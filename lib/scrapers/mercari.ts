// lib/scrapers/mercari.ts
import { MERCARI_LISTINGS } from '../data/sample-listings';

export interface MercariListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeMercari(): Promise<MercariListing[]> {
  try {
    return MERCARI_LISTINGS;
  } catch (error) {
    console.error('Mercari scraper error:', error);
    return [];
  }
}
