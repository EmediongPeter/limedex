'use client'

import React from 'react';
import { useSearchContext } from '@/contexts/SearchContext';
import { useTheme } from 'next-themes';

export function SearchButton() {
  const { openSearch } = useSearchContext();
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';

  return (
    <button
      className={`
        flex items-center justify-between
        px-4 py-2
        rounded-2xl
        border border-gray-200 dark:border-gray-700
        bg-gray-100 dark:bg-gray-800
        text-gray-700 dark:text-gray-200
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary-purple
        min-w-[240px] w-full max-w-[300px]
      `}
      onClick={openSearch}
      aria-label="Search tokens"
    >
      <div className="flex items-center">
        <svg
          className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span>Search tokens</span>
      </div>
      <div className="flex items-center">
        <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">/</span>
        <div className="ml-2 flex">
          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full -ml-1"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full -ml-1"></div>
        </div>
      </div>
    </button>
  );
}
