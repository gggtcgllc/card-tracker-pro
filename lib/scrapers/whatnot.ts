// lib/scrapers/whatnot.ts
import { WHATNOT_LISTINGS } from '../data/sample-listings';

export interface WhatnotListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeWhatnot(): Promise<WhatnotListing[]> {
  try {
    return WHATNOT_LISTINGS;
  } catch (error) {
    console.error('Whatnot scraper error:', error);
    return [];
  }
}
