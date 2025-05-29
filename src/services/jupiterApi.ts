/**
 * Jupiter API service for fetching token data
 */

export interface JupiterTokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  description?: string;
  icon?: string;
  liquidity?: number;
  mcap?: number;
  fdv?: number;
  volume24h?: number;
  priceUsd?: number;
  priceQuote?: number;
  priceChange24h?: number;
  holders?: number;
  circSupply?: number;
  totalSupply?: number;
  organicScore?: number;
  organicScoreLabel?: string;
  tags?: string[];
  website?: string;
  twitter?: string;
  discord?: string;
}

/**
 * Fetches token data from Jupiter API
 * @param tokenAddress The token address to fetch data for
 * @param quoteAddress Optional quote token address
 * @returns Token data or null if not found
 */
export async function fetchJupiterTokenData(tokenAddress: string, quoteAddress?: string): Promise<JupiterTokenData | null> {
  try {
    const url = `https://fe-api.jup.ag/api/v1/tokens/${tokenAddress}${quoteAddress ? `?quote_address=${quoteAddress}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status}`);
    }
    
    const data = await response.json();
    return data as JupiterTokenData;
  } catch (error) {
    console.error('Error fetching Jupiter token data:', error);
    return null;
  }
}

/**
 * Formats a number to a human-readable string with appropriate suffix (K, M, B, T)
 * @param num The number to format
 * @param decimals Number of decimal places to show
 * @returns Formatted string
 */
export function formatNumber(num: number | undefined, decimals = 2): string {
  if (num === undefined || num === null) return '$0';
  
  // Add dollar sign to all numbers
  const prefix = '$';
  
  if (num === 0) return `${prefix}0`;
  
  const absNum = Math.abs(num);
  
  if (absNum < 1000) {
    return `${prefix}${absNum.toFixed(decimals)}`;
  } else if (absNum < 1000000) {
    return `${prefix}${(absNum / 1000).toFixed(decimals)}K`;
  } else if (absNum < 1000000000) {
    return `${prefix}${(absNum / 1000000).toFixed(decimals)}M`;
  } else if (absNum < 1000000000000) {
    return `${prefix}${(absNum / 1000000000).toFixed(decimals)}B`;
  } else {
    return `${prefix}${(absNum / 1000000000000).toFixed(decimals)}T`;
  }
}

/**
 * Formats a percentage change with + or - sign
 * @param change The percentage change
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(change: number | undefined, decimals = 2): string {
  if (change === undefined || change === null) return '0.00%';
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}
