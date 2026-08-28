// lib/scrapers/grading-companies.ts
import { PSA_OFFICIAL_LISTINGS, SGC_OFFICIAL_LISTINGS, BGS_OFFICIAL_LISTINGS } from '../data/sample-listings';

export interface GradingCompanyListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  grader: 'PSA' | 'SGC' | 'BGS';
  source: string;
}

export async function scrapePSAOfficial(): Promise<GradingCompanyListing[]> {
  try {
    return PSA_OFFICIAL_LISTINGS.map(l => ({ ...l, grader: 'PSA' as const }));
  } catch (error) {
    console.error('PSA Official scraper error:', error);
    return [];
  }
}

export async function scrapeSGCOfficial(): Promise<GradingCompanyListing[]> {
  try {
    return SGC_OFFICIAL_LISTINGS.map(l => ({ ...l, grader: 'SGC' as const }));
  } catch (error) {
    console.error('SGC Official scraper error:', error);
    return [];
  }
}

export async function scrapeBGSOfficial(): Promise<GradingCompanyListing[]> {
  try {
    return BGS_OFFICIAL_LISTINGS.map(l => ({ ...l, grader: 'BGS' as const }));
  } catch (error) {
    console.error('BGS Official scraper error:', error);
    return [];
  }
}
