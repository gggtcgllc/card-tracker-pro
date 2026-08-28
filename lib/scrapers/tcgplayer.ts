// lib/scrapers/tcgplayer.ts
import { TCGPLAYER_LISTINGS } from '../data/sample-listings';

export interface TCGPlayerListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeTCGPlayer(): Promise<TCGPlayerListing[]> {
  try {
    return TCGPLAYER_LISTINGS;
  } catch (error) {
    console.error('TCGPlayer scraper error:', error);
    return [];
  }
}
