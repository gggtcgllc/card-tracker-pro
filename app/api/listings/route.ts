import { NextResponse } from 'next/server';
import { runAllScrapers } from '../../../lib/scrapers/index';

/**
 * GET /api/listings
 * Returns aggregated card listings from all scrapers
 */
export async function GET() {
  try {
    const listings = await runAllScrapers();
    return NextResponse.json({
      success: true,
      count: listings.length,
      data: listings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch listings',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
