// lib/scrapers/pricing-platforms.ts
// PriceCharting has a real free-tier API:
//   GET https://www.pricecharting.com/api/products?q=<query>&status=sold&id=<category>
//   GET https://www.pricecharting.com/api/product/<id>/prices
//
// Set PRICECHARTING_API_KEY in Vercel environment variables (free key from pricecharting.com/api).
// Without a key the requests still work for light usage but rate-limit faster.
//
// Card Ladder has no public API — it scrapes prices from other sources and charges for access.
// We use our sample data for Card Ladder and pull real data from PriceCharting.

import { CARD_LADDER_LISTINGS, PRICECHARTING_LISTINGS } from '../data/sample-listings';
import { fetchJson } from './http-client';
import { parsePrice, extractGrade, normaliseDate, makeId, dedupe } from './parser-utils';

export interface PricingPlatformListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: 'Card Ladder' | 'PriceCharting';
}

// ── PriceCharting ────────────────────────────────────────────────────────────
// Category IDs on PriceCharting:
//   Baseball cards: search by q param, no specific category needed
// The /api/products endpoint returns recent sold prices when status=sold.

interface PCProduct {
  id?: string | number;
  'product-name'?: string;
  'console-name'?: string;
  status?: string;
  price?: number | string;
  'loose-price'?: number | string;
  'graded-price'?: number | string;
  'new-price'?: number | string;
  saleDate?: string;
  date?: string;
}

interface PCSearchResponse {
  status?: string;
  products?: PCProduct[];
}

// Common sports card searches to pull a broad range of results
const PC_QUERIES = [
  'psa 10 baseball rookie',
  'psa 10 basketball rookie',
  'psa 10 football rookie',
  'bgs 9.5 michael jordan',
  'psa 10 charizard pokemon',
  'psa 9 mickey mantle topps',
  'sgc 10 lebron james prizm',
  'graded hockey upper deck',
  'psa 10 soccer prizm',
  'magic the gathering alpha',
];

async function fetchPriceChartingQuery(query: string, apiKey: string | undefined): Promise<PricingPlatformListing[]> {
  const params = new URLSearchParams({ q: query, status: 'sold' });
  if (apiKey) params.set('id', apiKey);
  const url = `https://www.pricecharting.com/api/products?${params}`;

  const data = await fetchJson<PCSearchResponse>(url, {
    timeoutMs: 10000,
    headers: {
      Referer: 'https://www.pricecharting.com/',
      Accept: 'application/json',
    },
  });

  if (!data?.products || !Array.isArray(data.products)) {
    throw new Error('Unexpected PriceCharting response shape');
  }

  return data.products
    .map((p): PricingPlatformListing | null => {
      const title = p['product-name'] ?? '';
      if (!title) return null;

      const rawPrice = p['graded-price'] ?? p['loose-price'] ?? p.price ?? p['new-price'];
      // PriceCharting returns prices in cents
      const price = rawPrice != null ? Number(rawPrice) / 100 : 0;
      if (!price || price < 0.5) return null;

      const grade = extractGrade(String(p['console-name'] ?? '')) || extractGrade(title) || undefined;
      const saleDate = normaliseDate(p.saleDate ?? p.date ?? '');
      const productId = String(p.id ?? '');
      const itemUrl = productId
        ? `https://www.pricecharting.com/game/sports-cards/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`
        : 'https://www.pricecharting.com/';

      return {
        id: makeId('pricecharting', title, price),
        title,
        price,
        grade,
        saleDate,
        url: itemUrl,
        source: 'PriceCharting',
      };
    })
    .filter((l): l is PricingPlatformListing => l !== null);
}

export async function scrapePriceCharting(): Promise<PricingPlatformListing[]> {
  const apiKey = process.env.PRICECHARTING_API_KEY;

  // Try real API first (works with or without key, key gives higher rate limit)
  const allResults: PricingPlatformListing[] = [];
  for (const query of PC_QUERIES) {
    try {
      const results = await fetchPriceChartingQuery(query, apiKey);
      allResults.push(...results);
      // Small delay between queries
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    } catch (err) {
      console.warn(`[pricecharting] Query "${query}" failed:`, (err as Error).message);
    }
  }

  if (allResults.length > 0) {
    console.log(`[pricecharting] Got ${allResults.length} listings from API`);
    return dedupe(allResults, l => l.id);
  }

  // Fallback to sample data
  console.warn('[pricecharting] API failed, using sample data');
  return PRICECHARTING_LISTINGS.map(l => ({ ...l, source: 'PriceCharting' as const }));
}

// ── Card Ladder ──────────────────────────────────────────────────────────────
// Card Ladder has no free public API. Their data is sourced from eBay sold listings.
// We display sample data here; replace with a subscription if you obtain API access.

export async function scrapeCardLadder(): Promise<PricingPlatformListing[]> {
  return CARD_LADDER_LISTINGS.map(l => ({ ...l, source: 'Card Ladder' as const }));
}
