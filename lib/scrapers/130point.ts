// lib/scrapers/130point.ts
import { POINT130_LISTINGS } from '../data/sample-listings';

export interface Point130Listing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrape130Point(): Promise<Point130Listing[]> {
  try {
    return POINT130_LISTINGS;
  } catch (error) {
    console.error('130Point scraper error:', error);
    return [];
  }
}
