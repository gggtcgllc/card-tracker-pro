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

function mapListing(listing: {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source?: string;
}, fallbackSource: string): CardListing {
  return {
    id: listing.id,
    cardTitle: listing.title,
    price: listing.price,
    grade: listing.grade || null,
    source: listing.source || fallbackSource,
    saleDate: listing.saleDate,
    url: listing.url,
    verified: true,
  };
}

/**
 * Run all scrapers and aggregate results
 */
export async function runAllScrapers(): Promise<CardListing[]> {
  console.log('Starting all marketplace scrapers...');

  const scrapers: Array<{ fn: () => Promise<any[]>; fallbackSource: string }> = [
    { fn: scrapeEbay, fallbackSource: 'eBay' },
    { fn: scrapeHeritage, fallbackSource: 'Heritage Auctions' },
    { fn: scrapeGoldin, fallbackSource: 'Goldin Auctions' },
    { fn: scrapePWCC, fallbackSource: 'PWCC Auctions' },
    { fn: scrapePWCCMarketplace, fallbackSource: 'PWCC Marketplace' },
    { fn: scrapeMercari, fallbackSource: 'Mercari' },
    { fn: scrapeCOMC, fallbackSource: 'COMC' },
    { fn: scrape130Point, fallbackSource: '130Point' },
    { fn: scrapeSportlots, fallbackSource: 'Sportlots' },
    { fn: scrapeTCGPlayer, fallbackSource: 'TCGPlayer' },
    { fn: scrapeCardmarket, fallbackSource: 'Cardmarket' },
    { fn: scrapeWhatnot, fallbackSource: 'Whatnot' },
    { fn: scrapeFanatics, fallbackSource: 'Fanatics Collect' },
    { fn: scrapePSAOfficial, fallbackSource: 'PSA Official (eBay)' },
    { fn: scrapeSGCOfficial, fallbackSource: 'SGC Official (eBay)' },
    { fn: scrapeBGSOfficial, fallbackSource: 'BGS Official (eBay)' },
    { fn: scrapeCardLadder, fallbackSource: 'Card Ladder' },
    { fn: scrapePriceCharting, fallbackSource: 'PriceCharting' },
  ];

  const results = await Promise.allSettled(scrapers.map((s) => s.fn()));

  const allListings: CardListing[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
      result.value.forEach((listing: any) => {
        allListings.push(mapListing(listing, scrapers[index].fallbackSource));
      });
    } else {
      failureCount++;
      console.error(`Scraper ${scrapers[index].fallbackSource} failed:`, result.reason);
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
      return (await scrapeEbay()).map((l) => mapListing(l, 'eBay'));
    case 'heritage':
      return (await scrapeHeritage()).map((l) => mapListing(l, 'Heritage Auctions'));
    case 'goldin':
      return (await scrapeGoldin()).map((l) => mapListing(l, 'Goldin Auctions'));
    case 'pwcc':
      return (await scrapePWCC()).map((l) => mapListing(l, 'PWCC Auctions'));
    case 'pwcc-marketplace':
      return (await scrapePWCCMarketplace()).map((l) => mapListing(l, 'PWCC Marketplace'));
    case 'mercari':
      return (await scrapeMercari()).map((l) => mapListing(l, 'Mercari'));
    case 'comc':
      return (await scrapeCOMC()).map((l) => mapListing(l, 'COMC'));
    case '130point':
      return (await scrape130Point()).map((l) => mapListing(l, '130Point'));
    case 'sportlots':
      return (await scrapeSportlots()).map((l) => mapListing(l, 'Sportlots'));
    case 'tcgplayer':
      return (await scrapeTCGPlayer()).map((l) => mapListing(l, 'TCGPlayer'));
    case 'cardmarket':
      return (await scrapeCardmarket()).map((l) => mapListing(l, 'Cardmarket'));
    case 'whatnot':
      return (await scrapeWhatnot()).map((l) => mapListing(l, 'Whatnot'));
    case 'fanatics':
      return (await scrapeFanatics()).map((l) => mapListing(l, 'Fanatics Collect'));
    case 'psa-official':
      return (await scrapePSAOfficial()).map((l) => mapListing(l, 'PSA Official (eBay)'));
    case 'sgc-official':
      return (await scrapeSGCOfficial()).map((l) => mapListing(l, 'SGC Official (eBay)'));
    case 'bgs-official':
      return (await scrapeBGSOfficial()).map((l) => mapListing(l, 'BGS Official (eBay)'));
    case 'card-ladder':
      return (await scrapeCardLadder()).map((l) => mapListing(l, 'Card Ladder'));
    case 'price-charting':
      return (await scrapePriceCharting()).map((l) => mapListing(l, 'PriceCharting'));
    default:
      console.warn(`Unknown marketplace: ${marketplaceId}`);
      return [];
  }
}
