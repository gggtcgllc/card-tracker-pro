'use client';

import React, { useState } from 'react';

export type MarketplaceSource =
  | 'All'
  | 'eBay'
  | 'Goldin Auctions'
  | 'Heritage Auctions'
  | 'Fanatics Collect'
  | 'PWCC Auctions'
  | 'PWCC Marketplace'
  | 'Mercari'
  | 'COMC'
  | '130Point'
  | 'Sportlots'
  | 'TCGPlayer'
  | 'Cardmarket'
  | 'Whatnot'
  | 'PSA Official (eBay)'
  | 'SGC Official (eBay)'
  | 'BGS Official (eBay)'
  | 'Card Ladder'
  | 'PriceCharting';

interface MarketplaceFilterDropdownProps {
  onSourceChange: (source: MarketplaceSource) => void;
  selectedSource?: MarketplaceSource;
  className?: string;
}

const SOURCES: MarketplaceSource[] = [
  'All',
  'eBay',
  'Goldin Auctions',
  'Heritage Auctions',
  'Fanatics Collect',
  'PWCC Auctions',
  'PWCC Marketplace',
  'Mercari',
  'COMC',
  '130Point',
  'Sportlots',
  'TCGPlayer',
  'Cardmarket',
  'Whatnot',
  'PSA Official (eBay)',
  'SGC Official (eBay)',
  'BGS Official (eBay)',
  'Card Ladder',
  'PriceCharting',
];

export const MarketplaceFilterDropdown: React.FC<MarketplaceFilterDropdownProps> = ({
  onSourceChange,
  selectedSource = 'All',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (source: MarketplaceSource) => {
    onSourceChange(source);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-700 truncate">{selectedSource}</span>
        <svg
          className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <ul className="py-1" role="listbox">
            {SOURCES.map((source) => (
              <li key={source}>
                <button
                  onClick={() => handleSelect(source)}
                  className={`w-full text-left px-4 py-2 transition-colors duration-150 flex items-center justify-between ${
                    selectedSource === source
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="option"
                  aria-selected={selectedSource === source}
                >
                  <span>{source}</span>
                  {selectedSource === source && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFilterDropdown;
