// lib/scrapers/heritage.ts
import { HERITAGE_LISTINGS } from '../data/sample-listings';

export interface HeritageListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeHeritage(): Promise<HeritageListing[]> {
  try {
    return HERITAGE_LISTINGS;
  } catch (error) {
    console.error('Heritage scraper error:', error);
    return [];
  }
}
