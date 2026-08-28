'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MarketplaceFilterDropdown, { type MarketplaceSource } from '../components/MarketplaceFilterDropdown';

interface CardListing {
  id: string;
  cardTitle: string;
  price: number;
  grade: string | null;
  source: string;
  saleDate: string;
  url: string;
}

interface FilterOptions {
  source: MarketplaceSource;
  priceRange: [number, number];
  gradeFilter: string;
  searchQuery: string;
}

const PLATFORM_STYLES: Record<string, { icon: string; color: string }> = {
  'eBay': { icon: '🔴', color: 'bg-red-50 border-red-200' },
  'Goldin Auctions': { icon: '⭐', color: 'bg-yellow-50 border-yellow-200' },
  'Heritage Auctions': { icon: '🏛️', color: 'bg-purple-50 border-purple-200' },
  'Fanatics Collect': { icon: '🎯', color: 'bg-blue-50 border-blue-200' },
  'PWCC Auctions': { icon: '🏆', color: 'bg-amber-50 border-amber-200' },
  'PWCC Marketplace': { icon: '🏅', color: 'bg-orange-50 border-orange-200' },
  'Mercari': { icon: '🛍️', color: 'bg-teal-50 border-teal-200' },
  'COMC': { icon: '📦', color: 'bg-cyan-50 border-cyan-200' },
  '130Point': { icon: '📊', color: 'bg-indigo-50 border-indigo-200' },
  'Sportlots': { icon: '🏟️', color: 'bg-emerald-50 border-emerald-200' },
  'TCGPlayer': { icon: '🃏', color: 'bg-violet-50 border-violet-200' },
  'Cardmarket': { icon: '🌍', color: 'bg-fuchsia-50 border-fuchsia-200' },
  'Whatnot': { icon: '📺', color: 'bg-rose-50 border-rose-200' },
  'PSA Official (eBay)': { icon: '🥇', color: 'bg-yellow-50 border-yellow-300' },
  'SGC Official (eBay)': { icon: '🥈', color: 'bg-slate-50 border-slate-300' },
  'BGS Official (eBay)': { icon: '🥉', color: 'bg-amber-50 border-amber-300' },
  'Card Ladder': { icon: '📈', color: 'bg-green-50 border-green-200' },
  'PriceCharting': { icon: '💹', color: 'bg-lime-50 border-lime-200' },
};

function getPlatformStyle(source: string) {
  return PLATFORM_STYLES[source] ?? { icon: '🏪', color: 'bg-slate-50 border-slate-200' };
}

export default function Home() {
  const [listings, setListings] = useState<CardListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    source: 'All',
    priceRange: [0, 1000000],
    gradeFilter: 'All',
    searchQuery: '',
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const json = await response.json();
      setListings(json.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = [...listings];

    if (filters.source !== 'All') {
      filtered = filtered.filter((item) => item.source === filters.source);
    }

    filtered = filtered.filter(
      (item) => item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    if (filters.gradeFilter !== 'All' && filters.gradeFilter !== '') {
      filtered = filtered.filter((item) =>
        item.grade?.toUpperCase().includes(filters.gradeFilter.toUpperCase())
      );
    }

    if (filters.searchQuery) {
      filtered = filtered.filter((item) =>
        item.cardTitle.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => b.price - a.price);
    setFilteredListings(filtered);
  }, [listings, filters]);

  useEffect(() => {
    fetchListings();
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sourceCounts = Object.keys(PLATFORM_STYLES)
    .map((name) => ({
      name,
      count: listings.filter((l) => l.source === name).length,
      ...getPlatformStyle(name),
    }))
    .filter((p) => p.count > 0);

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
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Loading...'}
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter &amp; Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marketplace</label>
              <MarketplaceFilterDropdown
                selectedSource={filters.source}
                onSourceChange={(source) => setFilters({ ...filters, source })}
                className="w-full"
              />
            </div>
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
        {sourceCounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {sourceCounts.map((platform) => (
              <div
                key={platform.name}
                className={`${platform.color} rounded-lg border p-3 text-center cursor-pointer hover:shadow-sm transition-shadow`}
                onClick={() =>
                  setFilters({ ...filters, source: platform.name as MarketplaceSource })
                }
              >
                <div className="text-xl mb-1">{platform.icon}</div>
                <p className="text-xs font-medium text-slate-700 leading-tight">{platform.name}</p>
                <p className="text-lg font-bold text-slate-900">{platform.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Comparable Sales ({filteredListings.length})
            </h2>
            <button
              onClick={() =>
                setFilters({ source: 'All', priceRange: [0, 1000000], gradeFilter: 'All', searchQuery: '' })
              }
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>

          {error ? (
            <div className="text-center py-16 bg-white rounded-lg border border-red-200">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchListings}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="inline-block w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Loading market data...</p>
              </div>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid gap-4">
              {filteredListings.map((listing) => {
                const style = getPlatformStyle(listing.source);
                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{style.icon}</span>
                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                          {listing.cardTitle}
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
                        <span className="text-xs text-slate-500">{formatDate(listing.saleDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{formatPrice(listing.price)}</p>
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
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
          <p>
            Real-time data from 18 platforms: eBay, Goldin, Heritage, PWCC, Mercari, COMC, 130Point,
            Sportlots, TCGPlayer, Cardmarket, Whatnot, Fanatics Collect, PSA/SGC/BGS Official,
            Card Ladder &amp; PriceCharting
          </p>
          <p className="mt-2 text-xs text-slate-500">Last updated: {lastUpdated?.toLocaleString()}</p>
        </div>
      </footer>
    </main>
  );
}
