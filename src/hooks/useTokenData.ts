'use client'

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { TokenInfo } from '@/types/token-info';
import { debounce } from 'lodash';

// Add lodash module declaration if @types/lodash is not installed
declare module 'lodash' {
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: { leading?: boolean; trailing?: boolean }
  ): T & { cancel(): void };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TokensResponse {
  tokens: TokenInfo[];
}

interface TrendingTokenResponse {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  usdPrice: number;
  stats24h: {
    priceChange: number;
    holderChange: number;
    liquidityChange: number;
    buyVolume: number;
    sellVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
  };
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
  const { data: searchResults, error: searchError } = useSWR<TokensResponse>(
    debouncedQuery
      ? `https://fe-api.jup.ag/api/v1/tokens/search?query=${encodeURIComponent(debouncedQuery)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch top trending tokens by 24h volume
  const { data: trendingTokensData, error: trendingTokensError } = useSWR<TrendingTokenResponse[]>(
    'https://datapi.jup.ag/v1/assets/toptrending/24h',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // Process trending tokens data
  const topTokensByVolume = trendingTokensData
    ? trendingTokensData
        .map((tokenData) => ({
          symbol: tokenData.symbol,
          name: tokenData.name,
          address: tokenData.id,
          logoURI: tokenData.icon || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${tokenData.id}/logo.png`,
          volumeUsd: (tokenData.stats24h.buyVolume + tokenData.stats24h.sellVolume).toString(),
          priceChangePercentage: tokenData.stats24h.priceChange,
          price: tokenData.usdPrice,
          decimals: tokenData.decimals,
          chainId: 101, // Solana mainnet chain ID
        }))
        .sort((a, b) => parseFloat(b.volumeUsd) - parseFloat(a.volumeUsd))
        .slice(0, 10)
    : [];

  return {
    tokens: searchResults?.tokens || [],
    topTokensByVolume,
    isLoading: (!searchResults && !searchError && debouncedQuery !== '') || (!trendingTokensData && !trendingTokensError),
    isError: !!searchError || !!trendingTokensError,
  };
}
