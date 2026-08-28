'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MarketplaceFilterDropdown, type MarketplaceSource } from '@/components/MarketplaceFilterDropdown';

interface CardListing {
  id: string;
  card_title: string;
  price: number;
  grade: string | null;
  source: 'eBay' | 'Goldin' | 'Heritage' | 'Fanatics Collect' | 'Private Sales';
  sale_date: string;
}

interface FilterOptions {
  source: MarketplaceSource;
  priceRange: [number, number];
  gradeFilter: string;
  searchQuery: string;
}

const REPUTABLE_PLATFORMS = [
  { name: 'eBay', icon: '🔴', color: 'bg-red-50 border-red-200' },
  { name: 'Goldin', icon: '⭐', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'Heritage', icon: '🏛️', color: 'bg-purple-50 border-purple-200' },
  { name: 'Fanatics Collect', icon: '🎯', color: 'bg-blue-50 border-blue-200' },
  { name: 'Private Sales', icon: '🤝', color: 'bg-green-50 border-green-200' },
];

export default function Home() {
  const [listings, setListings] = useState<CardListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    source: 'All',
    priceRange: [0, 1000000],
    gradeFilter: 'All',
    searchQuery: '',
  });

  // Simulate real-time data fetching
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from actual APIs
      const mockListings: CardListing[] = [
        {
          id: 'ebay-001',
          card_title: '1952 Mickey Mantle Topps #311',
          price: 45000,
          grade: 'PSA 9',
          source: 'eBay',
          sale_date: '2026-08-28',
        },
        {
          id: 'goldin-001',
          card_title: '1909-11 T206 Honus Wagner',
          price: 280000,
          grade: 'PSA 3',
          source: 'Goldin',
          sale_date: '2026-08-27',
        },
        {
          id: 'heritage-001',
          card_title: '1952 Mickey Mantle Topps #311',
          price: 48500,
          grade: 'PSA 8.5',
          source: 'Heritage',
          sale_date: '2026-08-28',
        },
        {
          id: 'fanatics-001',
          card_title: 'Patrick Mahomes 2017 Panini Prizm Rookie',
          price: 2500,
          grade: 'BGS 9.5',
          source: 'Fanatics Collect',
          sale_date: '2026-08-28',
        },
        {
          id: 'private-001',
          card_title: 'LeBron James 2003 Topps Rookie',
          price: 18000,
          grade: 'PSA 8',
          source: 'Private Sales',
          sale_date: '2026-08-26',
        },
        {
          id: 'ebay-002',
          card_title: 'Lionel Messi Soccer Card Rare Edition',
          price: 8500,
          grade: 'Mint',
          source: 'eBay',
          sale_date: '2026-08-28',
        },
        {
          id: 'heritage-002',
          card_title: 'Babe Ruth 1933 Goudey #181',
          price: 125000,
          grade: 'PSA 7',
          source: 'Heritage',
          sale_date: '2026-08-27',
        },
        {
          id: 'goldin-002',
          card_title: 'Tom Brady 2000 Playoff Contenders Rookie',
          price: 9500,
          grade: 'PSA 8.5',
          source: 'Goldin',
          sale_date: '2026-08-28',
        },
      ];

      setListings(mockListings);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...listings];

    // Source filter
    if (filters.source !== 'All') {
      filtered = filtered.filter((item) => item.source === filters.source);
    }

    // Price range filter
    filtered = filtered.filter(
      (item) => item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Grade filter
    if (filters.gradeFilter !== 'All' && filters.gradeFilter !== '') {
      filtered = filtered.filter((item) =>
        item.grade?.toUpperCase().includes(filters.gradeFilter.toUpperCase())
      );
    }

    // Search query
    if (filters.searchQuery) {
      filtered = filtered.filter((item) =>
        item.card_title.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Sort by price descending
    filtered.sort((a, b) => b.price - a.price);

    setFilteredListings(filtered);
  }, [listings, filters]);

  // Initial fetch
  useEffect(() => {
    fetchListings();

    // Simulate real-time updates every 10 seconds
    const interval = setInterval(fetchListings, 10000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  const getPlatformInfo = (source: string) => {
    return REPUTABLE_PLATFORMS.find((p) => p.name === source);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Card Market Tracker
              </h1>
              <p className="text-sm text-slate-500 mt-1">Real-time comps from all major platforms</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Last updated</p>
                <p className="text-sm font-medium text-slate-700">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : 'Loading...'}
                </p>
              </div>
              <button
                onClick={fetchListings}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh listings"
              >
                <svg
                  className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter & Search</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marketplace</label>
              <MarketplaceFilterDropdown
                selectedSource={filters.source}
                onSourceChange={(source) => setFilters({ ...filters, source })}
                className="w-full"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Card</label>
              <input
                type="text"
                placeholder="e.g., Mickey Mantle, Jordan..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
              <select
                value={filters.gradeFilter}
                onChange={(e) => setFilters({ ...filters, gradeFilter: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="All">All Grades</option>
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="SGC">SGC</option>
                <option value="Mint">Mint</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="e.g., 50000"
                value={filters.priceRange[1] === 1000000 ? '' : filters.priceRange[1]}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: [0, e.target.value ? parseInt(e.target.value) : 1000000],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {REPUTABLE_PLATFORMS.map((platform) => {
            const count = listings.filter((l) => l.source === platform.name).length;
            return (
              <div key={platform.name} className={`${platform.color} rounded-lg border p-4 text-center`}>
                <div className="text-2xl mb-1">{platform.icon}</div>
                <p className="text-sm font-medium text-slate-700">{platform.name}</p>
                <p className="text-lg font-bold text-slate-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Comparable Sales ({filteredListings.length})
            </h2>
            <button
              onClick={() => setFilters({
                source: 'All',
                priceRange: [0, 1000000],
                gradeFilter: 'All',
                searchQuery: '',
              })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="inline-block w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Loading market data...</p>
              </div>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid gap-4">
              {filteredListings.map((listing) => {
                const platform = getPlatformInfo(listing.source);
                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {platform && <span className="text-2xl">{platform.icon}</span>}
                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                          {listing.card_title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                          {listing.source}
                        </span>
                        {listing.grade && (
                          <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            {listing.grade}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{formatDate(listing.sale_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{formatPrice(listing.price)}</p>
                      <a
                        href="#"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-slate-600 font-medium">No listings found matching your filters</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>Real-time data from eBay, Goldin Auctions, Heritage Auctions, Fanatics Collect & Private Sales</p>
          <p className="mt-2 text-xs text-slate-500">Last updated: {lastUpdated?.toLocaleString()}</p>
        </div>
      </footer>
    </main>
  );
}
