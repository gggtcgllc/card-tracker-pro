// lib/scrapers/sportlots.ts
import { SPORTLOTS_LISTINGS } from '../data/sample-listings';

export interface SportlotsListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeSportlots(): Promise<SportlotsListing[]> {
  try {
    return SPORTLOTS_LISTINGS;
  } catch (error) {
    console.error('Sportlots scraper error:', error);
    return [];
  }
}
