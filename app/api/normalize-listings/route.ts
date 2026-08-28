import { NextRequest, NextResponse } from 'next/server';

// Unified schema for all card listings
export interface NormalizedCardListing {
  id: string;
  card_title: string;
  price: number;
  grade: string | null;
  source: 'eBay' | 'Goldin' | 'Heritage' | 'Fanatics Collect' | 'Private Sales';
  sale_date: string; // ISO 8601 format
}

interface EbayListing {
  itemId: string;
  title: string;
  currentPrice: number;
  condition?: string;
  endTime: string;
}

interface GoldinListing {
  lot_number: string;
  description: string;
  final_price: number;
  grade?: string;
  sale_date: string;
}

interface HeritageListing {
  id: string;
  lot_description: string;
  realized_price: number;
  grade?: string;
  sale_date: string;
}

interface FanaticsListing {
  product_id: string;
  product_name: string;
  sale_price: number;
  grading_info?: {
    grade: string;
  };
  sold_date: string;
}

interface PrivateSalesListing {
  transaction_id: string;
  card_name: string;
  amount: number;
  grade?: string;
  transaction_date: string;
}

type AnyListing = EbayListing | GoldinListing | HeritageListing | FanaticsListing | PrivateSalesListing;

/**
 * Normalize eBay listing to standard schema
 */
function normalizeEbayListing(listing: EbayListing): NormalizedCardListing {
  return {
    id: `ebay-${listing.itemId}`,
    card_title: listing.title,
    price: listing.currentPrice,
    grade: listing.condition || null,
    source: 'eBay',
    sale_date: new Date(listing.endTime).toISOString().split('T')[0],
  };
}

/**
 * Normalize Goldin listing to standard schema
 */
function normalizeGoldinListing(listing: GoldinListing): NormalizedCardListing {
  return {
    id: `goldin-${listing.lot_number}`,
    card_title: listing.description,
    price: listing.final_price,
    grade: listing.grade || null,
    source: 'Goldin',
    sale_date: listing.sale_date,
  };
}

/**
 * Normalize Heritage Auctions listing to standard schema
 */
function normalizeHeritageListing(listing: HeritageListing): NormalizedCardListing {
  return {
    id: `heritage-${listing.id}`,
    card_title: listing.lot_description,
    price: listing.realized_price,
    grade: listing.grade || null,
    source: 'Heritage',
    sale_date: listing.sale_date,
  };
}

/**
 * Normalize Fanatics Collect listing to standard schema
 */
function normalizeFanaticsListing(listing: FanaticsListing): NormalizedCardListing {
  return {
    id: `fanatics-${listing.product_id}`,
    card_title: listing.product_name,
    price: listing.sale_price,
    grade: listing.grading_info?.grade || null,
    source: 'Fanatics Collect',
    sale_date: listing.sold_date,
  };
}

/**
 * Normalize Private Sales listing to standard schema
 */
function normalizePrivateSalesListing(listing: PrivateSalesListing): NormalizedCardListing {
  return {
    id: `private-${listing.transaction_id}`,
    card_title: listing.card_name,
    price: listing.amount,
    grade: listing.grade || null,
    source: 'Private Sales',
    sale_date: listing.transaction_date,
  };
}

/**
 * Main normalization function that routes to appropriate normalizer
 */
function normalizeListing(
  listing: AnyListing,
  source: NormalizedCardListing['source']
): NormalizedCardListing {
  switch (source) {
    case 'eBay':
      return normalizeEbayListing(listing as EbayListing);
    case 'Goldin':
      return normalizeGoldinListing(listing as GoldinListing);
    case 'Heritage':
      return normalizeHeritageListing(listing as HeritageListing);
    case 'Fanatics Collect':
      return normalizeFanaticsListing(listing as FanaticsListing);
    case 'Private Sales':
      return normalizePrivateSalesListing(listing as PrivateSalesListing);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

/**
 * POST /api/normalize-listings
 * 
 * Expected request body:
 * {
 *   "source": "eBay" | "Goldin" | "Heritage" | "Fanatics Collect" | "Private Sales",
 *   "listings": [...array of listings from that source...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { source, listings } = await request.json();

    if (!source || !listings || !Array.isArray(listings)) {
      return NextResponse.json(
        {
          error: 'Invalid request. Expected "source" and "listings" array.',
        },
        { status: 400 }
      );
    }

    const validSources = ['eBay', 'Goldin', 'Heritage', 'Fanatics Collect', 'Private Sales'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        {
          error: `Invalid source. Must be one of: ${validSources.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Normalize all listings
    const normalizedListings: NormalizedCardListing[] = listings.map((listing) =>
      normalizeListing(listing, source)
    );

    return NextResponse.json({
      success: true,
      count: normalizedListings.length,
      source,
      data: normalizedListings,
    });
  } catch (error) {
    console.error('Error normalizing listings:', error);
    return NextResponse.json(
      {
        error: 'Failed to process listings',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/normalize-listings
 * Returns API documentation and schema
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/normalize-listings',
    method: 'POST',
    description: 'Normalizes card listing data from various marketplaces into a unified schema',
    requestBody: {
      source: 'string - One of: eBay, Goldin, Heritage, Fanatics Collect, Private Sales',
      listings: 'array - Array of listing objects from the specified source',
    },
    responseSchema: {
      id: 'string - Unique identifier with source prefix',
      card_title: 'string - Title/description of the card',
      price: 'number - Sale price in dollars',
      grade: 'string | null - Grading information if available',
      source: 'string - Marketplace source',
      sale_date: 'string - Sale date in YYYY-MM-DD format',
    },
    example: {
      request: {
        source: 'eBay',
        listings: [
          {
            itemId: '123456',
            title: '1952 Mickey Mantle PSA 9',
            currentPrice: 50000,
            condition: 'PSA 9',
            endTime: '2026-08-28T20:00:00Z',
          },
        ],
      },
      response: {
        success: true,
        count: 1,
        source: 'eBay',
        data: [
          {
            id: 'ebay-123456',
            card_title: '1952 Mickey Mantle PSA 9',
            price: 50000,
            grade: 'PSA 9',
            source: 'eBay',
            sale_date: '2026-08-28',
          },
        ],
      },
    },
  });
}
