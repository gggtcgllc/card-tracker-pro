import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const results: Array<{
      id: string;
      cardTitle: string;
      price: number;
      grade: string;
      source: string;
      saleDate: string;
      url: string;
    }> = [];

    const ebayRssUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1&_sop=13&_rss=1`;
    const res = await fetch(ebayRssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const xmlText = await res.text();
      const items: string[] = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

      items.forEach((item: string, index: number) => {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);

        let price = 0;
        if (descMatch && descMatch[1]) {
          const priceMatch = descMatch[1].match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
          if (priceMatch && priceMatch[1]) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
          }
        }

        const title = titleMatch && titleMatch[1] ? titleMatch[1] : query;
        let grade = 'Raw';
        const tUpper = title.toUpperCase();
        if (tUpper.includes('PSA 10')) grade = 'PSA 10';
        else if (tUpper.includes('PSA 9')) grade = 'PSA 9';
        else if (tUpper.includes('BGS')) grade = 'BGS';
        else if (tUpper.includes('CGC')) grade = 'CGC';
        else if (tUpper.includes('SGC')) grade = 'SGC';

        if (price > 0) {
          results.push({
            id: `live-ebay-${index}-${Date.now()}`,
            cardTitle: title,
            price: price,
            grade: grade,
            source: 'eBay',
            saleDate: new Date().toISOString(),
            url: linkMatch && linkMatch[1] ? linkMatch[1] : '#'
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMessage, results: [] }, { status: 200 });
  }
}
