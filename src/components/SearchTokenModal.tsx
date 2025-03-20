// components/SearchTokenModal.tsx
import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';

export interface TokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
}

export const TokenSearchModal = ({ 
  onSelect,
  onClose
}: {
  onSelect: (token: TokenInfo) => void;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search with memoization
  const fetchTokens = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://token.jup.ag/strict${query ? `?search=${encodeURIComponent(query)}` : ''}`
      );
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error('Token search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTokens(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchTokens]);

  return (
    <div className="fixed top-14 left-0 right-0 mx-auto w-96 bg-slate-900 rounded-xl shadow-2xl z-50">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search token..."
          className="w-full p-2 bg-slate-800 rounded-lg text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        
        <div className="mt-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded" />
              ))}
            </div>
          ) : (
            tokens.map((token) => (
              <button
                key={token.address}
                className="flex items-center w-full p-2 hover:bg-slate-800 rounded-lg"
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
              >
                {token.logoURI && (
                  <img 
                    src={token.logoURI} 
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full mr-2"
                    loading="lazy"
                  />
                )}
                <div className="text-left">
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-sm text-slate-400">{token.name}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};