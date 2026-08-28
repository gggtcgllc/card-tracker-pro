// lib/scrapers/heritage.ts
// Scrapes completed auction results from Heritage Auctions (ha.com).
//
// Heritage publishes all realized prices in their public archive at:
//   ha.com/c/search-results.zx?type=archives&N=...
//
// They also expose a semi-public JSON endpoint used by their own site
// that we can query for sports card results.
//
// Strategy:
//   1. Try Heritage's internal JSON search endpoint (fastest, cleanest data)
//   2. Fall back to scraping the HTML archive search results page
//   3. Fall back to sample data if both fail

import * as cheerio from 'cheerio';
import { HERITAGE_LISTINGS } from '../data/sample-listings';
import { fetchJson, fetchHtml } from './http-client';
import { parsePrice, extractGrade, normaliseDate, makeId, dedupe } from './parser-utils';

export interface HeritageListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

const HERITAGE_BASE = 'https://www.ha.com';

// Heritage's public archive search — Sports Collectibles category (N=790) with realized prices
// Returns paginated HTML results. Each result includes lot title, realized price, and date.
const ARCHIVE_URL = `${HERITAGE_BASE}/c/search-results.zx?type=archives&N=790+231+4294967294&ic4=ListViewStrip-AuctionSearchResults-AuctionLots-081514`;

// Heritage also has a JSON endpoint their SPA uses for recent sold lots
const JSON_ENDPOINT = `${HERITAGE_BASE}/heritage-auctions/c/search/lots?types=archives&catID=231&sortBy=lotClosed&sortOrder=desc&pageSize=48&pageNum=`;

interface HeritageJsonLot {
  lotTitle?: string;
  description?: string;
  lotDesc?: string;
  realizedPrice?: number | string;
  soldPrice?: number | string;
  hammerPrice?: number | string;
  grade?: string;
  lotClosedDate?: string;
  saleDate?: string;
  lotUrl?: string;
  url?: string;
  lotId?: string | number;
}

async function tryJsonEndpoint(page = 1): Promise<HeritageListing[]> {
  const url = `${JSON_ENDPOINT}${page}`;
  const data = await fetchJson<{ lots?: HeritageJsonLot[]; results?: HeritageJsonLot[] }>(url, {
    timeoutMs: 15000,
    headers: {
      Referer: 'https://www.ha.com/',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/plain, */*',
    },
  });

  const lots: HeritageJsonLot[] = data?.lots ?? data?.results ?? [];
  if (!Array.isArray(lots) || lots.length === 0) {
    throw new Error('Empty JSON response from Heritage');
  }

  return lots
    .map(lot => {
      const title = lot.lotTitle ?? lot.description ?? lot.lotDesc ?? '';
      if (!title || title.length < 5) return null;

      const rawPrice = lot.realizedPrice ?? lot.soldPrice ?? lot.hammerPrice;
      const price = parsePrice(String(rawPrice ?? ''));
      if (!price || price < 1) return null;

      const grade = extractGrade(lot.grade ?? '') || extractGrade(title) || undefined;
      const saleDate = normaliseDate(lot.lotClosedDate ?? lot.saleDate ?? '');
      const href = lot.lotUrl ?? lot.url ?? '';
      const url = href.startsWith('http') ? href : `${HERITAGE_BASE}${href}`;

      return {
        id: makeId('heritage', title, price),
        title,
        price,
        grade,
        saleDate,
        url,
        source: 'Heritage Auctions',
      } as HeritageListing;
    })
    .filter((l): l is HeritageListing => l !== null);
}

async function tryHtmlScrape(page = 1): Promise<HeritageListing[]> {
  const url = page > 1
    ? `${ARCHIVE_URL}&Nao=${(page - 1) * 48}`
    : ARCHIVE_URL;

  const html = await fetchHtml(url, {
    timeoutMs: 25000,
    headers: { Referer: 'https://www.ha.com/' },
  });

  const $ = cheerio.load(html);
  const results: HeritageListing[] = [];

  // Heritage archive pages have lot items in `.item-img-holder` or `.lot-strip-item`
  const itemSelectors = [
    '.item-img-holder',
    '.lot-strip-item',
    '.lot-item',
    '[class*="lot-item"]',
    '.results-item',
    'li[class*="item"]',
  ];

  let $items = $();
  for (const sel of itemSelectors) {
    $items = $(sel);
    if ($items.length > 0) break;
  }

  $items.each((_, el) => {
    const $el = $(el);

    const title =
      $el.find('.item-title, .lot-title, h2, h3, [class*="title"]').first().text().trim() ||
      $el.find('a').first().text().trim();
    if (!title || title.length < 5) return;

    const priceText =
      $el.find('[class*="price"], [class*="realized"], [class*="hammer"]').first().text() ||
      $el.text().match(/\$[\d,]+(?:\.\d{2})?/)?.[0] ||
      '';
    const price = parsePrice(priceText);
    if (!price || price < 1) return;

    const gradeText = $el.find('[class*="grade"]').first().text().trim();
    const grade = extractGrade(gradeText) || extractGrade(title) || undefined;

    const dateText =
      $el.find('time').attr('datetime') ||
      $el.find('[class*="date"]').first().text().trim();
    const saleDate = normaliseDate(dateText);

    const href = $el.find('a').first().attr('href') || '';
    const itemUrl = href.startsWith('http') ? href : `${HERITAGE_BASE}${href}`;

    results.push({
      id: makeId('heritage', title, price),
      title,
      price,
      grade,
      saleDate,
      url: itemUrl,
      source: 'Heritage Auctions',
    });
  });

  return dedupe(results, r => r.id);
}

/**
 * Scrape Heritage Auctions sports card realized prices.
 * Tries the JSON API first, falls back to HTML scraping, then sample data.
 */
export async function scrapeHeritage(maxPages = 3): Promise<HeritageListing[]> {
  const allResults: HeritageListing[] = [];

  // Strategy 1: JSON endpoint (clean data, preferred)
  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageResults = await tryJsonEndpoint(page);
      allResults.push(...pageResults);
      if (pageResults.length < 40) break; // last page
      if (page < maxPages) await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    } catch (err) {
      console.warn(`[heritage] JSON endpoint page ${page} failed:`, (err as Error).message);
      break;
    }
  }

  if (allResults.length > 0) {
    console.log(`[heritage] Got ${allResults.length} listings via JSON endpoint`);
    return dedupe(allResults, r => r.id);
  }

  // Strategy 2: HTML scraping fallback
  console.log('[heritage] Trying HTML scraping...');
  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageResults = await tryHtmlScrape(page);
      allResults.push(...pageResults);
      if (pageResults.length < 20) break;
      if (page < maxPages) await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    } catch (err) {
      console.warn(`[heritage] HTML page ${page} failed:`, (err as Error).message);
      break;
    }
  }

  if (allResults.length > 0) {
    console.log(`[heritage] Got ${allResults.length} listings via HTML scraping`);
    return dedupe(allResults, r => r.id);
  }

  // Strategy 3: Sample data fallback
  console.warn('[heritage] All strategies failed, falling back to sample data');
  return HERITAGE_LISTINGS as HeritageListing[];
}
