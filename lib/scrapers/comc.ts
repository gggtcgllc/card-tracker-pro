// lib/scrapers/comc.ts
import { COMC_LISTINGS } from '../data/sample-listings';

export interface COMCListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeCOMC(): Promise<COMCListing[]> {
  try {
    return COMC_LISTINGS;
  } catch (error) {
    console.error('COMC scraper error:', error);
    return [];
  }
}
