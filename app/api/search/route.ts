import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const results: any[] = [];

    // 1. Fetch live completed/sold comps from public card endpoints (eBay / 130point comp format)
    const ebayRssUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1&_sop=13&_rss=1`;
    const res = await fetch(ebayRssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.ok) {
      const xmlText = await res.text();
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

      items.forEach((item, index) => {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
        
        let price = 0;
        if (descMatch) {
          const priceMatch = descMatch[1].match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
          }
        }

        const title = titleMatch ? titleMatch[1] : query;
        let grade = 'Raw';
        if (title.toUpperCase().includes('PSA 10')) grade = 'PSA 10';
        else if (title.toUpperCase().includes('PSA 9')) grade = 'PSA 9';
        else if (title.toUpperCase().includes('BGS')) grade = 'BGS';
        else if (title.toUpperCase().includes('CGC')) grade = 'CGC';

        if (price > 0) {
          results.push({
            id: `live-ebay-${index}-${Date.now()}`,
            title: title,
            price: price,
            grade: grade,
            marketplace: 'eBay Sold Comps',
            platform: 'eBay',
            source: 'eBay',
            verified: true,
            date: new Date().toISOString().split('T')[0],
            url: linkMatch ? linkMatch[1] : '#'
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
