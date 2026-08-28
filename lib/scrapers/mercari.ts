// lib/scrapers/mercari.ts
export interface MercariListing {
  id: string;
  title: string;
  price: number;
  grade?: string;
  saleDate: string;
  url: string;
  source: string;
}

export async function scrapeMercari(): Promise<MercariListing[]> {
  try {
    // Mercari - mercari.com
    // Production: use Mercari API or scrape sold listings
    const listings: MercariListing[] = [
      {
        id: 'mercari-m12345',
        title: 'Shohei Ohtani 2018 Topps Update Rookie',
        price: 750,
        grade: 'BGS 9.5',
        saleDate: new Date().toISOString().split('T')[0],
        url: 'https://www.mercari.com/item/m12345',
        source: 'Mercari',
      },
      {
        id: 'mercari-m12346',
        title: 'Patrick Mahomes 2017 Panini Prizm Rookie',
        price: 1200,
        grade: 'PSA 9',
        saleDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        url: 'https://www.mercari.com/item/m12346',
        source: 'Mercari',
      },
    ];
    return listings;
  } catch (error) {
    console.error('Mercari scraper error:', error);
    return [];
  }
}
