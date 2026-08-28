// lib/scrapers/fanatics.ts
// Scrapes sold listings from Fanatics Collect (fanaticscollect.com).
//
// Fanatics Collect is a Cloudflare-protected site, so direct Puppeteer-less
// scraping is unreliable. We use three strategies in order:
//
//   1. Their undocumented internal API endpoint (reverse-engineered from their SPA)
//      Returns JSON with sold listing data — works until they rotate the endpoint.
//   2. GraphQL endpoint (their newer API approach)
//   3. Fallback to sample data
//
// To reliably scrape at scale (thousands of listings daily), you would need:
//   - A proxy service (ScraperAPI, Bright Data, etc.) to bypass Cloudflare
//   - Or Playwright running in a real browser context
//
// This scraper handles what it can without paid proxies and gracefully falls back.

import * as cheerio from 'cheerio';
import { FANATICS_LISTINGS } from '../data/sample-listings';
import { fetchJson, fetchHtml } from './http-client';
import { parsePrice, extractGrade, normaliseDate, makeId, dedupe } from './parser-utils';

export interface FanaticsListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

const FANATICS_BASE = 'https://www.fanaticscollect.com';

// Fanatics' internal REST API for sold listings
// Endpoint: GET /api/marketplace/listings?status=sold&sort=recent&page=N
const REST_API = `${FANATICS_BASE}/api/marketplace/listings`;

// Their GraphQL endpoint (used by newer SPA versions)
const GQL_ENDPOINT = `${FANATICS_BASE}/graphql`;

interface FanaticsRestItem {
  id?: string | number;
  title?: string;
  name?: string;
  productName?: string;
  salePrice?: number | string;
  price?: number | string;
  finalPrice?: number | string;
  grade?: string;
  gradeValue?: string;
  gradingInfo?: { grade?: string };
  soldDate?: string;
  saleDate?: string;
  completedAt?: string;
  slug?: string;
  url?: string;
}

interface FanaticsRestResponse {
  data?: FanaticsRestItem[];
  listings?: FanaticsRestItem[];
  results?: FanaticsRestItem[];
  items?: FanaticsRestItem[];
}

function parseFanaticsItem(item: FanaticsRestItem): FanaticsListing | null {
  const title = item.title ?? item.name ?? item.productName ?? '';
  if (!title || title.length < 3) return null;

  const rawPrice = item.salePrice ?? item.price ?? item.finalPrice;
  const price = parsePrice(String(rawPrice ?? ''));
  if (!price || price < 1) return null;

  const gradeRaw = item.grade ?? item.gradeValue ?? item.gradingInfo?.grade ?? '';
  const grade = extractGrade(gradeRaw) || extractGrade(title) || undefined;

  const saleDate = normaliseDate(item.soldDate ?? item.saleDate ?? item.completedAt ?? '');

  const slug = item.slug ?? String(item.id ?? '');
  const href = item.url ?? (slug ? `${FANATICS_BASE}/cards/${slug}` : '');
  const url = href.startsWith('http') ? href : `${FANATICS_BASE}${href}`;

  return {
    id: makeId('fanatics', title, price),
    title,
    price,
    grade,
    saleDate,
    url,
    source: 'Fanatics Collect',
  };
}

async function tryRestApi(page = 1): Promise<FanaticsListing[]> {
  const url = `${REST_API}?status=sold&sort=recent&limit=48&page=${page}`;
  const data = await fetchJson<FanaticsRestResponse>(url, {
    timeoutMs: 15000,
    headers: {
      Referer: 'https://www.fanaticscollect.com/marketplace',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
  });

  const items: FanaticsRestItem[] =
    data?.data ?? data?.listings ?? data?.results ?? data?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Empty or unexpected response from Fanatics REST API');
  }

  return items.map(parseFanaticsItem).filter((l): l is FanaticsListing => l !== null);
}

async function tryGraphQL(page = 1): Promise<FanaticsListing[]> {
  const body = JSON.stringify({
    operationName: 'GetSoldListings',
    query: `
      query GetSoldListings($page: Int, $limit: Int) {
        soldListings(page: $page, limit: $limit) {
          items {
            id
            title
            salePrice
            grade
            soldDate
            slug
          }
          total
        }
      }
    `,
    variables: { page, limit: 48 },
  });

  const data = await fetchJson<{ data?: { soldListings?: { items?: FanaticsRestItem[] } } }>(
    GQL_ENDPOINT,
    {
      timeoutMs: 15000,
      headers: {
        Referer: 'https://www.fanaticscollect.com/',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const items = data?.data?.soldListings?.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Empty GraphQL response from Fanatics');
  }

  return items.map(parseFanaticsItem).filter((l): l is FanaticsListing => l !== null);
}

async function tryHtmlScrape(): Promise<FanaticsListing[]> {
  const html = await fetchHtml(`${FANATICS_BASE}/marketplace?filter=sold`, {
    timeoutMs: 20000,
    headers: { Referer: 'https://www.fanaticscollect.com/' },
  });

  const $ = cheerio.load(html);
  const results: FanaticsListing[] = [];

  // Look for listing cards — Fanatics uses React-rendered components
  // so selectors target data attributes and common class patterns
  const selectors = [
    '[data-testid*="listing"]',
    '[class*="listing-card"]',
    '[class*="ListingCard"]',
    '[class*="product-card"]',
    'article',
  ];

  let $items = $();
  for (const sel of selectors) {
    $items = $(sel);
    if ($items.length > 0) break;
  }

  $items.each((_, el) => {
    const $el = $(el);

    const title =
      $el.find('[class*="title"], [class*="name"], h2, h3').first().text().trim();
    if (!title || title.length < 3) return;

    const priceText =
      $el.find('[class*="price"], [class*="sale"]').first().text() ||
      $el.text().match(/\$[\d,]+(?:\.\d{2})?/)?.[0] ||
      '';
    const price = parsePrice(priceText);
    if (!price || price < 1) return;

    const gradeText = $el.find('[class*="grade"]').first().text().trim();
    const grade = extractGrade(gradeText) || extractGrade(title) || undefined;

    const href = $el.find('a').first().attr('href') || '';
    const url = href.startsWith('http') ? href : `${FANATICS_BASE}${href}`;

    results.push({
      id: makeId('fanatics', title, price),
      title,
      price,
      grade,
      saleDate: new Date().toISOString().split('T')[0],
      url,
      source: 'Fanatics Collect',
    });
  });

  return dedupe(results, r => r.id);
}

/**
 * Scrape Fanatics Collect sold listings.
 * Tries REST API → GraphQL → HTML scraping → sample data fallback.
 */
export async function scrapeFanatics(maxPages = 3): Promise<FanaticsListing[]> {
  const allResults: FanaticsListing[] = [];

  // Strategy 1: REST API
  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageResults = await tryRestApi(page);
      allResults.push(...pageResults);
      if (pageResults.length < 40) break;
      if (page < maxPages) await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    } catch (err) {
      console.warn(`[fanatics] REST API page ${page} failed:`, (err as Error).message);
      break;
    }
  }

  if (allResults.length > 0) {
    console.log(`[fanatics] Got ${allResults.length} listings via REST API`);
    return dedupe(allResults, r => r.id);
  }

  // Strategy 2: GraphQL
  console.log('[fanatics] Trying GraphQL...');
  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageResults = await tryGraphQL(page);
      allResults.push(...pageResults);
      if (pageResults.length < 40) break;
      if (page < maxPages) await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    } catch (err) {
      console.warn(`[fanatics] GraphQL page ${page} failed:`, (err as Error).message);
      break;
    }
  }

  if (allResults.length > 0) {
    console.log(`[fanatics] Got ${allResults.length} listings via GraphQL`);
    return dedupe(allResults, r => r.id);
  }

  // Strategy 3: HTML scraping
  console.log('[fanatics] Trying HTML scraping...');
  try {
    const htmlResults = await tryHtmlScrape();
    if (htmlResults.length > 0) {
      console.log(`[fanatics] Got ${htmlResults.length} listings via HTML scraping`);
      return htmlResults;
    }
  } catch (err) {
    console.warn('[fanatics] HTML scraping failed:', (err as Error).message);
  }

  // Strategy 4: Sample data fallback
  console.warn('[fanatics] All strategies failed, falling back to sample data');
  return FANATICS_LISTINGS as FanaticsListing[];
}
