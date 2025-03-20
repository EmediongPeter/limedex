"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { TokenInfo } from "@/types/token-info";
import { fetchTokens } from "@/utils/token-utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const TokenSelector = React.memo(({
  onSelect,
  currentToken,
}: {
  onSelect: (token: TokenInfo) => void;
  currentToken?: TokenInfo | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search query
  useEffect(() => {
    const debouncedUpdate = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay
    debouncedUpdate(searchQuery);
  }, [searchQuery]);

  const { data: tokensResponse = { tokens: [] }, isLoading, error } = useSWR<{ tokens: TokenInfo[] }>(
    `https://fe-api.jup.ag/api/v1/tokens/search?query=${encodeURIComponent(debouncedQuery)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  
  // Extract the tokens array from the response
  const tokens = tokensResponse.tokens;
  
  // Ensure tokens is always an array
  const safeTokens = Array.isArray(tokens) ? tokens : [];
  
  const filteredTokens = useMemo(() => {
    if (!debouncedQuery) return safeTokens; // Return all tokens if no query
    const query = debouncedQuery.toLowerCase();
    return safeTokens.filter(
      (token: TokenInfo) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
  }, [safeTokens, debouncedQuery]);
  
  console.log({ tokensInfo: tokensResponse });
  
  return (
    <>   
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
      >
        {currentToken?.icon && (
          <img
            src={currentToken.icon}
            alt={currentToken.symbol}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span>{currentToken ? currentToken.symbol : "Select Token"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select a Token</h2>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Search tokens"
              className="w-full p-2 border rounded-lg mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map((token) => { 
                  console.log({tokenfilter: token})
                  return (
                  <button
                    key={token.address}
                    className="flex items-center w-full p-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      onSelect(token);
                      setIsOpen(false);
                    }}
                  >
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <div className="text-left">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                    </div>
                  </button>
                )})
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
})

export default TokenSelector

// Add error handling for API calls.

// Implement loading states during API requests.

// Add a conversion display to show the estimated output amount.

// Style the modal and swap interface to match your design