// lib/scrapers/fanatics.ts
import { FANATICS_LISTINGS } from '../data/sample-listings';

export interface FanaticsListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeFanatics(): Promise<FanaticsListing[]> {
  try {
    return FANATICS_LISTINGS;
  } catch (error) {
    console.error('Fanatics scraper error:', error);
    return [];
  }
}
