'use client';

import React, { useState } from 'react';

export type MarketplaceSource = 'All' | 'eBay' | 'Goldin' | 'Heritage' | 'Fanatics Collect' | 'Private Sales';

interface MarketplaceFilterDropdownProps {
  onSourceChange: (source: MarketplaceSource) => void;
  selectedSource?: MarketplaceSource;
  className?: string;
}

export const MarketplaceFilterDropdown: React.FC<MarketplaceFilterDropdownProps> = ({
  onSourceChange,
  selectedSource = 'All',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sources: MarketplaceSource[] = [
    'All',
    'eBay',
    'Goldin',
    'Heritage',
    'Fanatics Collect',
    'Private Sales',
  ];

  const handleSelect = (source: MarketplaceSource) => {
    onSourceChange(source);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center gap-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-700">{selectedSource}</span>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <ul className="py-1" role="listbox">
            {sources.map((source) => (
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
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
