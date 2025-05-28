'use client'

import React, { useRef, useEffect, useState } from 'react';
import { useSearchContext } from '@/contexts/SearchContext';
import { useTokenData } from '@/hooks/useTokenData';
import useClickOutside from '@/hooks/useClickOutside';
import { TokenInfo } from '@/types/token-info';
import { useTheme } from 'next-themes';

export function EnhancedSearchModal() {
  const {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    closeSearch,
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,
  } = useSearchContext();
  
  const { tokens, topTokensByVolume, isLoading } = useTokenData(searchQuery);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  
  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      } else if (e.key === '/' && !isSearchOpen && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setSearchQuery('');
        // The context will open the search
        useSearchContext().openSearch();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch, setSearchQuery]);
  
  // Use click outside hook to close the modal
  useClickOutside(modalRef, closeSearch);
  
  if (!isSearchOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-xl"
      >
        {/* Search header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-primary-purple transition-colors"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Search content */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {searchQuery ? (
            // Search results
            <div>
              {isLoading ? (
                <LoadingSkeleton />
              ) : tokens.length > 0 ? (
                <div className="space-y-2">
                  {tokens.map((token) => (
                    <TokenItem key={token.address} token={token} onSelect={handleSelectToken} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No tokens found</div>
              )}
            </div>
          ) : (
            // Default view with categories
            <div>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent searches</h3>
                    <button 
                      className="text-xs text-primary-purple hover:text-primary-purple/80"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((token) => (
                      <TokenItem key={token.address} token={token} onSelect={handleSelectToken} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Top tokens by 24h volume */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                  Tokens by 24H volume
                </h3>
                <div className="space-y-2">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : topTokensByVolume.length > 0 ? (
                    topTokensByVolume.map((token) => (
                      <TokenItem key={token.address} token={token} onSelect={handleSelectToken} showVolume={true} />
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">Loading top tokens...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Handle token selection
  function handleSelectToken(token: TokenInfo) {
    addToRecentSearches(token);
    // Here you'd typically pass the token to whatever component needs it
    // For now, we'll just close the modal
    closeSearch();
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center animate-pulse">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div className="w-16">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TokenItemProps {
  token: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  showVolume?: boolean;
}

function TokenItem({ token, onSelect, showVolume = false }: TokenItemProps) {
  // Price change formatting and styling
  const priceChange = token.priceChangePercentage || 0;
  const isPriceUp = priceChange > 0;
  const priceChangeColor = isPriceUp ? 'text-green-500' : 'text-red-500';
  const formattedPriceChange = Math.abs(priceChange).toFixed(2);
  
  return (
    <button
      className="flex items-center justify-between w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
      onClick={() => onSelect(token)}
    >
      <div className="flex items-center">
        <img
          src={token.logoURI || '/fallback-token-icon.png'}
          alt={token.symbol}
          className="w-10 h-10 rounded-full mr-3"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/fallback-token-icon.png';
          }}
          loading="lazy"
          width={40}
          height={40}
        />
        <div>
          <div className="font-medium text-left">{token.symbol}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-left truncate max-w-[150px]">
            {token.name}
            {token.address && (
              <span className="ml-2 text-xs opacity-70">
                {token.address.substring(0, 4)}...{token.address.substring(token.address.length - 4)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {(showVolume || token.price) && (
        <div className="text-right">
          {token.price && (
            <div className="flex items-center justify-end">
              <div className="text-sm font-medium">${token.price.toFixed(4)}</div>
              {token.priceChangePercentage !== undefined && (
                <span className={`ml-2 text-xs ${priceChangeColor} flex items-center`}>
                  {isPriceUp ? '↑' : '↓'} {formattedPriceChange}%
                </span>
              )}
            </div>
          )}
          {showVolume && token.volumeUsd && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Vol: ${formatVolume(parseFloat(token.volumeUsd))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// Helper function to format volume
function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(2) + 'B';
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(2) + 'M';
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(2) + 'K';
  } else {
    return volume.toFixed(2);
  }
}
