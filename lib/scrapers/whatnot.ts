// lib/scrapers/whatnot.ts
export interface WhatnotListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeWhatnot(): Promise<WhatnotListing[]> {
  try {
    // Whatnot - whatnot.com (live auction platform)
    // Production: use Whatnot API or scrape completed live auctions
    const listings: WhatnotListing[] = [
      {
        id: 'whatnot-wn55001',
        title: 'Luka Doncic 2018 Panini Prizm Silver Rookie',
        price: 1750,
        grade: 'PSA 10',
        saleDate: new Date().toISOString().split('T')[0],
        url: 'https://www.whatnot.com/auctions/wn55001',
        source: 'Whatnot',
      },
      {
        id: 'whatnot-wn55002',
        title: 'Victor Wembanyama 2023 Topps Chrome Rookie Auto',
        price: 4200,
        grade: 'BGS 9.5',
        saleDate: new Date(Date.now() - 3600000).toISOString().split('T')[0],
        url: 'https://www.whatnot.com/auctions/wn55002',
        source: 'Whatnot',
      },
    ];
    return listings;
  } catch (error) {
    console.error('Whatnot scraper error:', error);
    return [];
  }
}
