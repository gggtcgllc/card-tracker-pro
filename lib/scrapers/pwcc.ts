// lib/scrapers/pwcc.ts
import { PWCC_LISTINGS } from '../data/sample-listings';

export interface PWCCListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapePWCC(): Promise<PWCCListing[]> {
  try {
    return PWCC_LISTINGS.filter(l => l.source === 'PWCC Auctions');
  } catch (error) {
    console.error('PWCC scraper error:', error);
    return [];
  }
}

export async function scrapePWCCMarketplace(): Promise<PWCCListing[]> {
  try {
    return PWCC_LISTINGS.filter(l => l.source === 'PWCC Marketplace');
  } catch (error) {
    console.error('PWCC Marketplace scraper error:', error);
    return [];
  }
}
