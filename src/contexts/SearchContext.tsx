'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { TokenInfo } from '@/types/token-info';

type SearchContextType = {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  
  // Recent searches
  recentSearches: TokenInfo[];
  addToRecentSearches: (token: TokenInfo) => void;
  clearRecentSearches: () => void;
};

// Create the context with default values
const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
  isSearchOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  recentSearches: [],
  addToRecentSearches: () => {},
  clearRecentSearches: () => {},
});

const RECENT_SEARCHES_KEY = 'lime-dex-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<TokenInfo[]>([]);
  
  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);
  
  // Add a token to recent searches
  const addToRecentSearches = useCallback((token: TokenInfo) => {
    setRecentSearches((prev) => {
      // Remove the token if it already exists (to move it to the top)
      const filtered = prev.filter((item) => item.address !== token.address);
      // Add the token to the beginning and limit the list
      const newSearches = [token, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return newSearches;
    });
  }, []);
  
  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);
  
  // Open search modal
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  
  // Close search modal
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);
  
  const contextValue = {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    openSearch,
    closeSearch,
    recentSearches,
    addToRecentSearches,
    clearRecentSearches,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => useContext(SearchContext);
