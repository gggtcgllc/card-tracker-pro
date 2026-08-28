// lib/scrapers/goldin.ts
import { GOLDIN_LISTINGS } from '../data/sample-listings';

export interface GoldinListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeGoldin(): Promise<GoldinListing[]> {
  try {
    return GOLDIN_LISTINGS;
  } catch (error) {
    console.error('Goldin scraper error:', error);
    return [];
  }
}
