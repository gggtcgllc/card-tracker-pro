// lib/scrapers/cardmarket.ts
import { CARDMARKET_LISTINGS } from '../data/sample-listings';

export interface CardmarketListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeCardmarket(): Promise<CardmarketListing[]> {
  try {
    return CARDMARKET_LISTINGS;
  } catch (error) {
    console.error('Cardmarket scraper error:', error);
    return [];
  }
}
