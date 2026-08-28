'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface CardListing {
  id: string;
  cardTitle: string;
  price: number;
  grade: string | null;
  source: string;
  saleDate: string;
  url: string;
}

type SortField = 'price' | 'saleDate' | 'grade' | 'source';
type SortDir = 'asc' | 'desc';
type SportFilter = 'All' | 'Baseball' | 'Basketball' | 'Football' | 'Hockey' | 'Soccer' | 'TCG' | 'Boxing';

const SPORT_FILTERS: SportFilter[] = ['All', 'Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'TCG', 'Boxing'];

const GRADE_COMPANIES = ['All', 'PSA', 'BGS', 'SGC', 'CGC', 'Ungraded'];

const PLATFORM_META: Record<string, { short: string; dot: string }> = {
  'eBay':               { short: 'eBay',     dot: 'bg-red-500' },
  'Heritage Auctions':  { short: 'Heritage', dot: 'bg-purple-500' },
  'Goldin Auctions':    { short: 'Goldin',   dot: 'bg-yellow-500' },
  'PWCC Auctions':      { short: 'PWCC',     dot: 'bg-amber-500' },
  'PWCC Marketplace':   { short: 'PWCC MP',  dot: 'bg-orange-500' },
  'Fanatics Collect':   { short: 'Fanatics', dot: 'bg-blue-500' },
  'Mercari':            { short: 'Mercari',  dot: 'bg-teal-500' },
  'COMC':               { short: 'COMC',     dot: 'bg-cyan-500' },
  '130Point':           { short: '130pt',    dot: 'bg-indigo-500' },
  'Sportlots':          { short: 'Sportlots',dot: 'bg-emerald-500' },
  'TCGPlayer':          { short: 'TCGPlayer',dot: 'bg-violet-500' },
  'Cardmarket':         { short: 'Cardmkt',  dot: 'bg-fuchsia-500' },
  'Whatnot':            { short: 'Whatnot',  dot: 'bg-rose-500' },
  'PSA Official (eBay)':{ short: 'PSA Off.', dot: 'bg-yellow-400' },
  'SGC Official (eBay)':{ short: 'SGC Off.', dot: 'bg-slate-400' },
  'BGS Official (eBay)':{ short: 'BGS Off.', dot: 'bg-amber-400' },
  'Card Ladder':        { short: 'Card Ldr', dot: 'bg-green-500' },
  'PriceCharting':      { short: 'PriceCht', dot: 'bg-lime-500' },
};

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatPriceFull(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function gradeBadgeColor(grade: string | null): string {
  if (!grade) return 'bg-gray-700 text-gray-300';
  const g = grade.toUpperCase();
  if (g.includes('PSA 10') || g.includes('BGS 10') || g.includes('SGC 10')) return 'bg-emerald-900 text-emerald-300 ring-1 ring-emerald-600';
  if (g.includes('PSA 9') || g.includes('BGS 9.5') || g.includes('SGC 9')) return 'bg-blue-900 text-blue-300';
  if (g.includes('PSA 8') || g.includes('BGS 9') || g.includes('SGC 8')) return 'bg-indigo-900 text-indigo-300';
  if (g.includes('PSA 7') || g.includes('BGS 8') || g.includes('SGC 7')) return 'bg-yellow-900 text-yellow-300';
  if (g.includes('PSA') || g.includes('BGS') || g.includes('SGC') || g.includes('CGC')) return 'bg-purple-900 text-purple-300';
  return 'bg-gray-700 text-gray-300';
}

function sportFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('pokémon') || t.includes('pokemon') || t.includes('mtg') || t.includes('magic') || t.includes('charizard') || t.includes('pikachu') || t.includes('blastoise') || t.includes('mew') || t.includes('mox') || t.includes('lotus')) return 'TCG';
  if (t.includes('nhl') || t.includes('hockey') || t.includes('opc') || t.includes('o-pee') || t.includes('gretzky') || t.includes('mcdavid')) return 'Hockey';
  if (t.includes('nba') || t.includes('basketball') || t.includes('jordan') || t.includes('lebron') || t.includes('kobe') || t.includes('curry') || t.includes('doncic') || t.includes('wembanyama') || t.includes('chamberlain') || t.includes('morant') || t.includes('bird') || t.includes('magic johnson') || t.includes('wnba') || t.includes('clark')) return 'Basketball';
  if (t.includes('nfl') || t.includes('football') || t.includes('brady') || t.includes('mahomes') || t.includes('montana') || t.includes('rice') || t.includes('kelce') || t.includes('dorsett') || t.includes('hill') || t.includes('playoff contenders')) return 'Football';
  if (t.includes('soccer') || t.includes('messi') || t.includes('ronaldo') || t.includes('champions league')) return 'Soccer';
  if (t.includes('boxing') || t.includes('ali') || t.includes('louis')) return 'Boxing';
  return 'Baseball';
}

export default function Home() {
  const [listings, setListings] = useState<CardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<SportFilter>('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortField, setSortField] = useState<SortField>('saleDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/listings');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setListings(json.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    const t = setInterval(fetchListings, 60000);
    return () => clearInterval(t);
  }, [fetchListings]);

  const enriched = useMemo(
    () => listings.map(l => ({ ...l, sport: sportFromTitle(l.cardTitle) })),
    [listings]
  );

  const filtered = useMemo(() => {
    let r = [...enriched];
    if (searchQuery) r = r.filter(l => l.cardTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sportFilter !== 'All') r = r.filter(l => l.sport === sportFilter);
    if (gradeFilter !== 'All') r = r.filter(l => gradeFilter === 'Ungraded' ? !l.grade || l.grade === 'Ungraded' : l.grade?.toUpperCase().includes(gradeFilter));
    if (sourceFilter !== 'All') r = r.filter(l => l.source === sourceFilter);
    if (maxPrice) r = r.filter(l => l.price <= parseInt(maxPrice));
    r.sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortField === 'price') { av = a.price; bv = b.price; }
      else if (sortField === 'saleDate') { av = a.saleDate; bv = b.saleDate; }
      else if (sortField === 'grade') { av = a.grade ?? ''; bv = b.grade ?? ''; }
      else if (sortField === 'source') { av = a.source; bv = b.source; }
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'desc' ? bv - av : av - bv;
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    return r;
  }, [enriched, searchQuery, sportFilter, gradeFilter, sourceFilter, maxPrice, sortField, sortDir]);

  // Market stats
  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const prices = filtered.map(l => l.price);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const median = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    return { avg, median, high, low, count: filtered.length };
  }, [filtered]);

  const sources = useMemo(() => ['All', ...Array.from(new Set(listings.map(l => l.source))).sort()], [listings]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  }

  const platformDot = (source: string) => PLATFORM_META[source]?.dot ?? 'bg-gray-500';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* ── Top Nav ── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">CT</div>
            <span className="font-bold text-white text-lg tracking-tight">CardTracker<span className="text-blue-400">Pro</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded font-medium">Market</button>
            <button className="px-3 py-1.5 text-gray-400 hover:text-white rounded transition-colors">Portfolio</button>
            <button className="px-3 py-1.5 text-gray-400 hover:text-white rounded transition-colors">Price Alerts</button>
            <button className="px-3 py-1.5 text-gray-400 hover:text-white rounded transition-colors">Platforms</button>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchListings}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 w-full flex-1">

        {/* ── Page Title ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Live Card Market</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real verified sales from {Object.keys(PLATFORM_META).length} platforms · {listings.length} listings indexed
          </p>
        </div>

        {/* ── Market Summary Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Sales', value: stats.count.toLocaleString(), sub: 'in view' },
              { label: 'Avg Price', value: formatPrice(stats.avg), sub: 'filtered' },
              { label: 'Highest Sale', value: formatPrice(stats.high), sub: 'filtered' },
              { label: 'Median Price', value: formatPrice(stats.median), sub: 'filtered' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-white mt-1">{value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Sport Filter Pills ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SPORT_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setSportFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sportFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search player, set, year..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {/* Platform */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Grade */}
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {GRADE_COMPANIES.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
            </select>
            {/* Max Price */}
            <input
              type="number"
              placeholder="Max price $"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-gray-800 rounded p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'table' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'cards' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Cards
                </button>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setSportFilter('All'); setGradeFilter('All'); setSourceFilter('All'); setMaxPrice(''); }}
                className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {error ? (
          <div className="bg-gray-900 border border-red-800 rounded-lg p-8 text-center">
            <p className="text-red-400 mb-3">{error}</p>
            <button onClick={fetchListings} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">Retry</button>
          </div>
        ) : loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-16 text-center">
            <div className="inline-block w-10 h-10 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading market data from 18 platforms...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-16 text-center">
            <p className="text-gray-400">No results match your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSportFilter('All'); setGradeFilter('All'); setSourceFilter('All'); setMaxPrice(''); }}
              className="mt-3 text-sm text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ── TABLE VIEW ── */
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3">Card</th>
                    <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-300 whitespace-nowrap" onClick={() => toggleSort('source')}>
                      Platform <SortIcon field="source" />
                    </th>
                    <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('grade')}>
                      Grade <SortIcon field="grade" />
                    </th>
                    <th className="text-left px-4 py-3 cursor-pointer hover:text-gray-300 whitespace-nowrap" onClick={() => toggleSort('saleDate')}>
                      Date <SortIcon field="saleDate" />
                    </th>
                    <th className="text-right px-4 py-3 cursor-pointer hover:text-gray-300 whitespace-nowrap" onClick={() => toggleSort('price')}>
                      Sale Price <SortIcon field="price" />
                    </th>
                    <th className="text-right px-4 py-3 w-20">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((listing, i) => (
                    <tr key={listing.id} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-white text-sm leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                          {listing.cardTitle}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${platformDot(listing.source)}`} />
                          <span className="text-gray-400 text-xs">{PLATFORM_META[listing.source]?.short ?? listing.source}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {listing.grade ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${gradeBadgeColor(listing.grade)}`}>
                            {listing.grade}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">Raw</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(listing.saleDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-white text-sm">{formatPriceFull(listing.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 text-xs"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── CARD VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(listing => (
              <div key={listing.id} className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-black/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${platformDot(listing.source)}`} />
                    {PLATFORM_META[listing.source]?.short ?? listing.source}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(listing.saleDate)}</span>
                </div>
                <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">
                  {listing.cardTitle}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {listing.grade && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${gradeBadgeColor(listing.grade)}`}>
                      {listing.grade}
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <p className="text-xl font-bold text-white">{formatPriceFull(listing.price)}</p>
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    View listing →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Platform Legend ── */}
        {listings.length > 0 && (
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Platforms Indexed</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(PLATFORM_META).map(([name, meta]) => {
                const count = listings.filter(l => l.source === name).length;
                if (count === 0) return null;
                return (
                  <button
                    key={name}
                    onClick={() => setSourceFilter(sourceFilter === name ? 'All' : name)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${sourceFilter === name ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    {name} <span className="text-gray-600">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 border-t border-gray-800 py-5 mt-8">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© 2026 CardTracker Pro · Live data from 18 marketplace platforms</p>
          <p>
            eBay · Goldin · Heritage · PWCC · Mercari · COMC · 130Point · Sportlots ·
            TCGPlayer · Cardmarket · Whatnot · Fanatics · PSA/SGC/BGS Official · Card Ladder · PriceCharting
          </p>
        </div>
      </footer>
    </div>
  );
}
