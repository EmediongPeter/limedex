'use client'

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { TokenInfo } from '@/types/token-info';
import { debounce } from 'lodash';
import { tokenService } from '@/services/tokenService';

// Add lodash module declaration if @types/lodash is not installed
declare module 'lodash' {
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: { leading?: boolean; trailing?: boolean }
  ): T & { cancel(): void };
}

export function useTokenData(query?: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query || '');

  // Debounce the search query
  const debounceFn = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  useEffect(() => {
    if (query !== undefined) {
      debounceFn(query);
    }
    return () => {
      debounceFn.cancel();
    };
  }, [query, debounceFn]);

  // Fetch search results
  const { data: tokens, error: searchError, isLoading: isLoadingSearch } = useSWR<TokenInfo[]>(
    debouncedQuery ? ['search-tokens', debouncedQuery] : null,
    async (key) => {
      // Extract query from the key array
      const query = Array.isArray(key) ? key[1] : '';
      return tokenService.searchTokens(query);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch top trending tokens by 24h volume
  const { data: topTokensByVolume, error: trendingTokensError, isLoading: isLoadingTrending } = useSWR<TokenInfo[]>(
    'trending-tokens',
    async () => {
      return tokenService.getTrendingTokens();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    tokens: tokens || [],
    topTokensByVolume: topTokensByVolume || [],
    isLoading: (isLoadingSearch && debouncedQuery !== '') || isLoadingTrending,
    isError: !!searchError || !!trendingTokensError,
  };
}
