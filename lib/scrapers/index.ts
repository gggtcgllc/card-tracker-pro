// lib/scrapers/index.ts
// Central orchestrator for all scrapers

import { scrapeEbay } from './ebay';
import { scrapeHeritage } from './heritage';
import { scrapeGoldin } from './goldin';
import { scrapePWCC, scrapePWCCMarketplace } from './pwcc';
import { scrapeMercari } from './mercari';
import { scrapeCOMC } from './comc';
import { scrape130Point } from './130point';
import { scrapeSportlots } from './sportlots';
import { scrapeTCGPlayer } from './tcgplayer';
import { scrapeCardmarket } from './cardmarket';
import { scrapeWhatnot } from './whatnot';
import { scrapeFanatics } from './fanatics';
import { scrapePSAOfficial, scrapeSGCOfficial, scrapeBGSOfficial } from './grading-companies';
import { scrapeCardLadder, scrapePriceCharting } from './pricing-platforms';

export interface CardListing {
  id: string;
  cardTitle: string;
  price: number;
  grade: string | null;
  source: string;
  saleDate: string;
  url: string;
  verified: boolean;
}

/**
 * Run all scrapers and aggregate results
 */
export async function runAllScrapers(): Promise<CardListing[]> {
  console.log('Starting all marketplace scrapers...');
  
  const results = await Promise.allSettled([
    scrapeEbay(),
    scrapeHeritage(),
    scrapeGoldin(),
    scrapePWCC(),
    scrapePWCCMarketplace(),
    scrapeMercari(),
    scrapeCOMC(),
    scrape130Point(),
    scrapeSportlots(),
    scrapeTCGPlayer(),
    scrapeCardmarket(),
    scrapeWhatnot(),
    scrapeFanatics(),
    scrapePSAOfficial(),
    scrapeSGCOfficial(),
    scrapeBGSOfficial(),
    scrapeCardLadder(),
    scrapePriceCharting(),
  ]);

  const allListings: CardListing[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
      // Transform and add to listings
      result.value.forEach((listing: any) => {
        allListings.push({
          id: listing.id,
          cardTitle: listing.title,
          price: listing.price,
          grade: listing.grade || null,
          source: listing.source || 'Unknown',
          saleDate: listing.saleDate,
          url: listing.url,
          verified: true,
        });
      });
    } else {
      failureCount++;
      console.error(`Scraper ${index} failed:`, result.reason);
    }
  });

  console.log(`Scraper run complete: ${successCount} succeeded, ${failureCount} failed`);
  console.log(`Total listings aggregated: ${allListings.length}`);

  return allListings;
}

/**
 * Run scraper for a specific marketplace
 */
export async function runSingleScraper(marketplaceId: string): Promise<CardListing[]> {
  console.log(`Running scraper for: ${marketplaceId}`);

  switch (marketplaceId) {
    case 'ebay':
      return (await scrapeEbay()).map(listing => ({
        id: listing.id,
        cardTitle: listing.title,
        price: listing.price,
        grade: listing.grade || null,
        source: 'eBay',
        saleDate: listing.saleDate,
        url: listing.url,
        verified: true,
      }));
    case 'heritage':
      return (await scrapeHeritage()).map(listing => ({
        id: listing.id,
        cardTitle: listing.title,
        price: listing.price,
        grade: listing.grade || null,
        source: 'Heritage Auctions',
        saleDate: listing.saleDate,
        url: listing.url,
        verified: true,
      }));
    case 'goldin':
      return (await scrapeGoldin()).map(listing => ({
        id: listing.id,
        cardTitle: listing.title,
        price: listing.price,
        grade: listing.grade || null,
        source: 'Goldin Auctions',
        saleDate: listing.saleDate,
        url: listing.url,
        verified: true,
      }));
    // ... add cases for all other scrapers
    default:
      console.warn(`Unknown marketplace: ${marketplaceId}`);
      return [];
  }
}
