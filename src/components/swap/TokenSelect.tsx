"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { TokenInfo } from "@/types/token-info";
import { debounce } from "@/utils/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetTokenAccounts } from "../account/account-data-access";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TokenWithBalance extends TokenInfo {
  balance?: string;
  usdValue?: string;
  owned?: boolean;
}

const TokenSelector = React.memo(({
  onSelect,
  currentToken,
  isInputToken = false,
}: {
  onSelect: (token: TokenInfo) => void;
  currentToken?: TokenInfo | null;
  isInputToken?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const wallet = useWallet();
  const { connection } = useConnection();
  const { data: tokenAccounts = [], isLoading: isLoadingTokenAccounts } = useGetTokenAccounts({
    address: wallet.publicKey,
  });

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

  // Get token prices for USD values
  const { data: tokenPrices } = useSWR<Record<string, { price: number }>>(
    'https://price.jup.ag/v4/price?ids=SOL',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // Build enhanced tokens with balance information
  const tokensWithBalances = useMemo((): TokenWithBalance[] => {
    if (!wallet.publicKey || !tokenAccounts.length) return safeTokens as TokenWithBalance[];

    // Create a map of token addresses to their accounts
    const tokenBalanceMap = new Map();

    // Add SOL balance
    let solBalance = "0";
    connection.getBalance(wallet.publicKey).then(balance => {
      solBalance = (balance / LAMPORTS_PER_SOL).toFixed(4);
      tokenBalanceMap.set(NATIVE_MINT.toString(), {
        balance: solBalance,
        mint: NATIVE_MINT.toString(),
      });
    });

    // Process token accounts to build the map
    tokenAccounts.forEach((account: any) => {
      const parsedInfo = account.account.data.parsed.info;
      const mintAddress = parsedInfo.mint;
      const balance = parsedInfo.tokenAmount.uiAmount;

      if (balance > 0) {
        tokenBalanceMap.set(mintAddress, {
          balance: balance.toString(),
          mint: mintAddress,
        });
      }
    });

    // Enhance the tokens with balance information
    return safeTokens.map(token => {
      const tokenAccount = tokenBalanceMap.get(token.address);
      const solPrice = tokenPrices?.SOL?.price || 0;

      if (tokenAccount) {
        // Calculate USD value (approximate calculation)
        // For more accurate prices, you'd need to fetch token prices from an API
        let usdValue = "0.00";
        if (token.symbol === "SOL") {
          usdValue = (parseFloat(tokenAccount.balance) * solPrice).toFixed(2);
        } else {
          // This is a simplification - in a real app you'd need token prices from an API
          usdValue = "--";
        }

        return {
          ...token,
          balance: tokenAccount.balance,
          usdValue,
          owned: true,
        };
      }
      return token as TokenWithBalance;
    });
  }, [safeTokens, wallet.publicKey, tokenAccounts, connection, tokenPrices]);

  // Sort and filter tokens: owned tokens first, then the rest
  const sortedAndFilteredTokens = useMemo(() => {
    let result = tokensWithBalances;

    // Apply search filtering if query exists
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(
        (token: TokenWithBalance) =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      );
    }

    // If this is for the input token ("You Pay"), sort owned tokens first
    if (isInputToken) {
      result = [...result].sort((a, b) => {
        // Sort by ownership first (owned tokens come first)
        if (a.owned && !b.owned) return -1;
        if (!a.owned && b.owned) return 1;

        // Then sort by balance (higher balances first)
        if (a.owned && b.owned) {
          const aBalance = parseFloat(a.balance || "0");
          const bBalance = parseFloat(b.balance || "0");
          return bBalance - aBalance;
        }

        // Alphabetical sort for non-owned tokens
        return a.symbol.localeCompare(b.symbol);
      });
    }

    return result;
  }, [tokensWithBalances, debouncedQuery, isInputToken]);

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

            {isInputToken && wallet.publicKey && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Your Tokens</h3>
                <div className="border-b pb-2 mb-2"></div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {(isLoading || isLoadingTokenAccounts) ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              ) : sortedAndFilteredTokens.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No tokens found
                </div>
              ) : (
                sortedAndFilteredTokens.map((token) => {
                  const isOwnedToken = token.owned;
                  return (
                    <button
                      key={token.address}
                      className={`flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-lg ${isOwnedToken && 'bg-gray-50'}`}
                      onClick={() => {
                        onSelect(token);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <div className="text-left">
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.name}</div>
                        </div>
                      </div>

                      {isOwnedToken && token.balance && (
                        <div className="text-right">
                          <div className="font-medium">{token.balance}</div>
                          {token.usdValue !== "--" && (
                            <div className="text-sm text-gray-500">${token.usdValue}</div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
})

export default TokenSelector