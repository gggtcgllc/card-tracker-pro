// app/api/cron/scrape/route.ts
// Vercel Cron endpoint — called every 6 hours to refresh scraped data.
// Schedule defined in vercel.json: "0 */6 * * *"
//
// Security: Vercel sends your CRON_SECRET as the Authorization bearer token.
// Set CRON_SECRET in Vercel → Project Settings → Environment Variables.

import { NextResponse } from 'next/server';
import { runAllScrapers } from '../../../../lib/scrapers/index';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes — scrapers need time

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== 'Bearer ' + cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('[cron] Starting scheduled scrape run...');
    const listings = await runAllScrapers();
    const durationMs = Date.now() - startTime;
    console.log('[cron] Scrape complete:', listings.length, 'listings in', durationMs, 'ms');

    // TODO: persist to Prisma DB once DATABASE_URL is configured
    // await prisma.cardListing.createMany({ data: listings, skipDuplicates: true });

    return NextResponse.json({
      ok: true,
      listingsScraped: listings.length,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron] Scrape failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
