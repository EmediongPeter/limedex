/**
 * Utilities for TradingView symbol formatting
 */

import { TokenInfo } from '@/types/token-info';

/**
 * Default exchange to use for TradingView symbols
 */
export const DEFAULT_EXCHANGE = 'BINANCE';

/**
 * Formats a token pair for TradingView
 * @param baseToken The base token (e.g. SOL)
 * @param quoteToken The quote token (e.g. USDC)
 * @param exchange The exchange to use (default: BINANCE)
 * @param invertPair Whether to invert the pair (e.g. USDC/SOL instead of SOL/USDC)
 * @returns Formatted TradingView symbol
 */
export function formatTradingViewSymbol(
  baseToken?: TokenInfo | null,
  quoteToken?: TokenInfo | null,
  exchange: string = DEFAULT_EXCHANGE,
  invertPair: boolean = false
): string | null {
  if (!baseToken?.symbol || !quoteToken?.symbol) return null;
  
  // Determine which token is base and which is quote based on invertPair flag
  const firstSymbol = invertPair ? quoteToken.symbol : baseToken.symbol;
  const secondSymbol = invertPair ? baseToken.symbol : quoteToken.symbol;
  
  // Clean the symbols (remove special characters, spaces)
  const cleanFirst = cleanSymbol(firstSymbol);
  const cleanSecond = cleanSymbol(secondSymbol);
  
  // Format as EXCHANGE:BASEQUOTE
  return `${exchange}:${cleanFirst}${cleanSecond}`;
}

/**
 * Cleans a token symbol for TradingView compatibility
 * @param symbol The token symbol to clean
 * @returns Cleaned symbol
 */
export function cleanSymbol(symbol: string): string {
  // Remove special characters, spaces, and convert to uppercase
  return symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Gets a default TradingView symbol for a token
 * @param token The token to get a symbol for
 * @param exchange The exchange to use
 * @returns Formatted TradingView symbol
 */
export function getDefaultTradingViewSymbol(token?: TokenInfo | null, exchange: string = DEFAULT_EXCHANGE): string | null {
  if (!token?.symbol) return null;
  
  // For most tokens, we'll use TOKEN/USD as the default pair
  const cleanSymbol = token.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `${exchange}:${cleanSymbol}USD`;
}
