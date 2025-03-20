import { useState, useEffect } from 'react';
import { TokenType } from '@/types';

export const useTokens = () => {
  // In a real application, this would fetch from an API
  const [tokens, setTokens] = useState<TokenType[]>([
    { symbol: 'ETH' },
    { symbol: 'USDC' },
    { symbol: 'USDT' },
    { symbol: 'DAI' },
    { symbol: 'WBTC' },
  ]);
  
  const [loading, setLoading] = useState(false);
  
  const searchTokens = (query: string) => {
    // Simple search implementation
    if (!query) return tokens;
    
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  return {
    tokens,
    loading,
    searchTokens
  };
};