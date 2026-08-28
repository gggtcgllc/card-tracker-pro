// lib/scrapers/goldin.ts
// Scrapes completed auction results from Goldin Auctions (goldinauctions.com).
//
// Goldin publishes all completed lot results on their website. We:
//   1. Fetch their sold/completed lots endpoint
//   2. Parse the HTML with cheerio to extract title, hammer price, grade, and date
//   3. Fall back to sample data if the request fails or is blocked
//
// Production note: run this server-side only (Next.js API route / cron job),
// never in the browser. Goldin has modest bot protection — rotate user agents
// and add ~1-2s delays between paginated requests.

import * as cheerio from 'cheerio';
import { GOLDIN_LISTINGS } from '../data/sample-listings';
import { fetchHtml } from './http-client';
import { parsePrice, extractGrade, normaliseDate, makeId, dedupe } from './parser-utils';

export interface GoldinListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

// Goldin's public sold-lots search URL.
// The `page` query param is 1-indexed; returns ~24 lots per page.
const GOLDIN_BASE = 'https://www.goldinauctions.com';
const SOLD_URL = `${GOLDIN_BASE}/lots/results?status=sold&sort=end_date&order=desc`;

async function fetchGoldinPage(page = 1): Promise<GoldinListing[]> {
  const url = page > 1 ? `${SOLD_URL}&page=${page}` : SOLD_URL;
  const html = await fetchHtml(url, {
    timeoutMs: 20000,
    headers: {
      Referer: 'https://www.goldinauctions.com/',
      'Sec-Fetch-Site': 'same-origin',
    },
  });

  const $ = cheerio.load(html);
  const results: GoldinListing[] = [];

  // Goldin lot cards use `.lot-card` or `.auction-lot` wrappers.
  // We try multiple selectors to be resilient to site redesigns.
  const lotSelectors = [
    '.lot-card',
    '.auction-lot',
    '.lot-item',
    '[class*="lot-card"]',
    '[data-lot-id]',
    'article',
  ];

  let $lots = $();
  for (const sel of lotSelectors) {
    $lots = $(sel);
    if ($lots.length > 0) break;
  }

  if ($lots.length === 0) {
    // Fall back: try to find any cards with a price inside
    $lots = $('[class*="card"]').filter((_, el) => {
      const text = $(el).text();
      return /\$[\d,]+/.test(text) && text.length > 20;
    });
  }

  $lots.each((_, el) => {
    const $el = $(el);

    // Title
    const titleEl = $el.find('[class*="title"], h2, h3, h4, .name, .lot-title').first();
    const title = titleEl.text().trim() || $el.find('a').first().text().trim();
    if (!title || title.length < 5) return;

    // Price — look for "Hammer Price", "Sold For", or just "$X,XXX"
    const priceText =
      $el.find('[class*="price"], [class*="hammer"], [class*="sold"], .bid').first().text() ||
      $el.text().match(/\$[\d,]+(?:\.\d{2})?/)?.[0] ||
      '';
    const price = parsePrice(priceText);
    if (!price || price < 1) return;

    // Grade — check dedicated grade element, then fall back to extracting from title
    const gradeText = $el.find('[class*="grade"], [class*="condition"]').first().text().trim();
    const grade = extractGrade(gradeText) || extractGrade(title) || undefined;

    // Sale date
    const dateText =
      $el.find('[class*="date"], [class*="time"], time').first().attr('datetime') ||
      $el.find('[class*="date"], [class*="time"], time').first().text().trim();
    const saleDate = normaliseDate(dateText);

    // URL
    const href = $el.find('a').first().attr('href') || '';
    const url = href.startsWith('http') ? href : `${GOLDIN_BASE}${href}`;

    results.push({
      id: makeId('goldin', title, price),
      title,
      price,
      grade,
      saleDate,
      url,
      source: 'Goldin Auctions',
    });
  });

  return dedupe(results, r => r.id);
}

/**
 * Scrape Goldin Auctions sold results.
 * Fetches up to `maxPages` pages (default 5 ≈ 120 lots).
 * Falls back to sample data if all requests fail.
 */
export async function scrapeGoldin(maxPages = 5): Promise<GoldinListing[]> {
  const allResults: GoldinListing[] = [];
  let pagesSucceeded = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageResults = await fetchGoldinPage(page);
      allResults.push(...pageResults);
      pagesSucceeded++;

      // Polite delay between pages
      if (page < maxPages) {
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      }

      // Stop early if we got fewer results than a full page (last page)
      if (pageResults.length < 20) break;
    } catch (err) {
      console.warn(`[goldin] Page ${page} failed:`, (err as Error).message);
      if (pagesSucceeded === 0 && page === maxPages) {
        // All pages failed — use sample data
        console.warn('[goldin] All pages failed, falling back to sample data');
        return GOLDIN_LISTINGS as GoldinListing[];
      }
      break;
    }
  }

  if (allResults.length === 0) {
    console.warn('[goldin] No results scraped, falling back to sample data');
    return GOLDIN_LISTINGS as GoldinListing[];
  }

  console.log(`[goldin] Scraped ${allResults.length} listings from ${pagesSucceeded} pages`);
  return dedupe(allResults, r => r.id);
}
