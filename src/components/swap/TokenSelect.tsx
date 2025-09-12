"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { TokenInfo } from "@/types/token-info";
import { debounce } from "@/utils/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetTokenAccounts } from "../account/account-data-access";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  FiExternalLink,
  FiSearch,
  FiX,
  FiCopy,
  FiCheck,
  FiChevronLeft,
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/useIsMobile";
import { tokenService } from "@/services/tokenService";
import Image from "next/image";

// Default token logo for fallback
const DEFAULT_TOKEN_LOGO =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

interface TokenWithBalance extends TokenInfo {
  balance?: string;
  usdValue?: string;
  owned?: boolean;
  usdPrice?: number;
}

const TokenSelector = React.memo(
  ({
    onSelect,
    currentToken,
    isInputToken = false,
  }: {
    onSelect: (token: TokenInfo) => void;
    currentToken?: TokenInfo | null;
    isInputToken?: boolean;
  }) => {
    // Force a consistent layout regardless of isInputToken
    // This ensures text displays properly in both "You Pay" and "You Receive" sections
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [solBalance, setSolBalance] = useState<string>("0");
    const wallet = useWallet();
    const { connection } = useConnection();

    // Fetch SOL balance when wallet connects or changes
    useEffect(() => {
      if (!wallet.publicKey) {
        setSolBalance("0");
        return;
      }

      const fetchSolBalance = async () => {
        if (!wallet.publicKey) return; // Add this line

        try {
          const balance = await connection.getBalance(wallet.publicKey);
          setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
        } catch (error) {
          console.error("Error fetching SOL balance:", error);
          setSolBalance("0");
        }
      };

      fetchSolBalance();
    }, [wallet.publicKey, connection]);
    const { data: tokenAccounts = [], isLoading: isLoadingTokenAccounts } =
      useGetTokenAccounts({
        address: wallet.publicKey,
      });

    // Debounce the search query
    useEffect(() => {
      const debouncedUpdate = debounce((query: string) => {
        setDebouncedQuery(query);
      }, 300); // 300ms delay
      debouncedUpdate(searchQuery);
    }, [searchQuery]);

    // Fetch tokens using the token service
    const {
      data: tokens = [],
      isLoading,
      error,
    } = useSWR<TokenInfo[]>(
      ["search-tokens", debouncedQuery],
      async (key) => {
        // Extract query from the key array
        const query = Array.isArray(key) ? key[1] : "";
        return tokenService.searchTokens(query);
      },
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
      }
    );

    // Ensure tokens is always an array
    const safeTokens = Array.isArray(tokens) ? tokens : [];

    // Get token prices for USD values using token service
    const { data: tokenPrices, error: pricesError } = useSWR<
      Record<string, number>
    >(
      safeTokens.length > 0
        ? ["token-prices", ...safeTokens.map((t) => t.address)]
        : null,
      async (key) => {
        // Skip the first element as it's the cache key
        const addresses = safeTokens.map((t) => t.address);
        return tokenService.getTokenPrices(addresses);
      },
      {
        revalidateOnFocus: false,
        dedupingInterval: 30000, // 30 seconds
        refreshInterval: 60000, // 1 minute
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
          if (retryCount >= 3) return;
          setTimeout(() => revalidate({ retryCount }), 5000);
        },
      }
    );

    // Log any price fetching errors
    useEffect(() => {
      if (pricesError) {
        console.error("Error fetching token prices:", pricesError);
      }
    }, [pricesError]);

    // Build enhanced tokens with balance and price information
    const tokensWithBalances = useMemo((): TokenWithBalance[] => {
      // Start with a copy of safeTokens
      const enhancedTokens = [...safeTokens] as TokenWithBalance[];

      // If no wallet, just return tokens without balance info
      if (!wallet.publicKey) return enhancedTokens;

      // Create a map of token addresses to their accounts
      const tokenBalanceMap = new Map();

      // Create a set to track which tokens the user has
      const userTokenAddresses = new Set<string>();

      // Track if we need to add SOL explicitly
      let hasSolToken = false;

      // Process token accounts to build the map
      if (Array.isArray(tokenAccounts)) {
        tokenAccounts.forEach((account: any) => {
          try {
            const parsedInfo = account.account?.data?.parsed?.info;
            if (!parsedInfo) return;

            const mintAddress = parsedInfo.mint;
            const balance = parsedInfo.tokenAmount?.uiAmount;

            // Check if this is the native SOL token
            if (mintAddress === NATIVE_MINT.toString()) {
              hasSolToken = true;
            }

            userTokenAddresses.add(mintAddress);

            // Add all tokens, even with zero balance
            tokenBalanceMap.set(mintAddress, {
              balance: balance.toString(),
              mint: mintAddress,
            });
          } catch (error) {
            console.error("Error processing token account:", error);
          }
        });
      }

      // Add native SOL balance if wallet is connected
      const publicKey = wallet.publicKey;
      if (publicKey) {
        // Always add SOL to user's token addresses
        userTokenAddresses.add(NATIVE_MINT.toString());

        // Explicitly check for native SOL token in the tokens list
        const solToken = enhancedTokens.find(
          (t) => t.address === NATIVE_MINT.toString()
        );
        if (!solToken) {
          // Add SOL token if it's not in the list
          enhancedTokens.unshift({
            address: NATIVE_MINT.toString(),
            symbol: "SOL",
            name: "Solana",
            decimals: 9,
            chainId: 101,
            icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            logoURI:
              "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          });
        }

        // Add SOL balance to the map from state
        tokenBalanceMap.set(NATIVE_MINT.toString(), {
          balance: solBalance,
          mint: NATIVE_MINT.toString(),
        });
      }

      // Enhance the tokens with balance and price information
      return enhancedTokens.map((token) => {
        try {
          const tokenAccount = tokenBalanceMap.get(token.address);
          const usdPrice = tokenPrices?.[token.address] || 0;
          const balance = tokenAccount?.balance || "0";
          const usdValue =
            parseFloat(balance) > 0
              ? (parseFloat(balance) * usdPrice).toFixed(2)
              : "0";

          return {
            ...token,
            balance,
            usdValue,
            usdPrice,
            owned: userTokenAddresses.has(token.address),
          } as TokenWithBalance;
        } catch (error) {
          console.error(`Error enhancing token ${token.symbol}:`, error);
          return {
            ...token,
            balance: "0",
            usdValue: "0",
            owned: false,
          } as TokenWithBalance;
        }
      });
      // Ensure we always return an array, even in error cases
      return [];
    }, [safeTokens, wallet.publicKey, tokenAccounts, connection, tokenPrices]);

    // Sort and filter tokens: owned tokens first, then the rest
    const sortedAndFilteredTokens: TokenWithBalance[] = useMemo(() => {
      if (!tokensWithBalances?.length) return [];

      // Create a map of all token addresses for quick lookup
      const tokenAddresses = new Set(tokensWithBalances.map((t) => t.address));

      // Find all user token addresses that aren't in the main token list
      const missingUserTokens = new Set<string>();
      if (wallet.publicKey) {
        tokenAccounts?.forEach((account) => {
          try {
            const mintAddress = account.account?.data?.parsed?.info?.mint;
            if (mintAddress && !tokenAddresses.has(mintAddress)) {
              missingUserTokens.add(mintAddress);
            }
          } catch (error) {
            console.error("Error processing token account:", error);
          }
        });
      }

      // Combine existing tokens with missing user tokens
      const allTokens = [...tokensWithBalances];

      // Add missing user tokens (these will be simple token objects)
      missingUserTokens.forEach((address) => {
        if (!allTokens.some((t) => t.address === address)) {
          allTokens.push({
            address,
            symbol: address.slice(0, 4) + "..." + address.slice(-4),
            name: "Unknown Token",
            decimals: 9, // Default to 9 decimals for unknown tokens
            chainId: 101, // Mainnet
            balance: "0",
            owned: true,
            usdValue: "0",
            usdPrice: 0,
          } as TokenWithBalance);
        }
      });

      // Apply search filtering if query exists
      let result = allTokens;
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        result = result.filter(
          (token: TokenWithBalance) =>
            token.name.toLowerCase().includes(query) ||
            token.symbol.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query)
        );
      }

      // Sort tokens
      result = [...result].sort((a, b) => {
        // Sort by ownership first (owned tokens come first)
        const aOwned = a.owned || false;
        const bOwned = b.owned || false;

        if (aOwned && !bOwned) return -1;
        if (!aOwned && bOwned) return 1;

        // For owned tokens, sort by balance and USD value
        if (aOwned && bOwned) {
          const aBalance = parseFloat(a.balance || "0");
          const bBalance = parseFloat(b.balance || "0");

          // Sort by balance (higher first)
          if (aBalance > 0 || bBalance > 0) {
            if (aBalance !== bBalance) return bBalance - aBalance;
          }

          // Then by USD value (higher first)
          const aUsdValue = parseFloat(a.usdValue || "0");
          const bUsdValue = parseFloat(b.usdValue || "0");
          if (aUsdValue !== bUsdValue) return bUsdValue - aUsdValue;
        }

        // Finally, sort by symbol (alphabetical)
        return a.symbol.localeCompare(b.symbol);
      });

      return result; // Add the missing return statement
    }, [tokensWithBalances, debouncedQuery, isInputToken]);

    // State for copied address feedback and UI state
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { theme, resolvedTheme } = useTheme();
    const isMobile = useIsMobile();

    // Determine if we should use dark mode
    const isDarkMode = useMemo(() => {
      return resolvedTheme === "dark" || theme === "dark";
    }, [resolvedTheme, theme]);

    // Handle copying address to clipboard
    const handleCopyAddress = (e: React.MouseEvent, address: string) => {
      e.stopPropagation(); // Prevent token selection
      navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    };

    // Handle clicking outside to close modal
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Format address for display (truncate middle)
    const formatAddress = (address: string) => {
      if (!address) return "";
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 min-w-[120px] max-w-[140px]"
        >
          <div className="relative w-6 h-6 rounded-full flex-shrink-0 overflow-hidden">
            {currentToken?.icon || currentToken?.logoURI ? (
              <img
                src={
                  currentToken.icon ||
                  currentToken.logoURI ||
                  DEFAULT_TOKEN_LOGO
                }
                alt={`${currentToken.symbol} logo`}
                className="object-cover w-full h-full"
                loading="lazy"
                width={24}
                height={24}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_TOKEN_LOGO;
                }}
                style={{ borderRadius: "9999px", background: "transparent" }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentToken?.symbol?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
          <span className="truncate overflow-hidden flex-1">
            {currentToken ? currentToken.symbol : "Select Token"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
            <div
              ref={modalRef}
              className={`${
                isDarkMode
                  ? "bg-gray-900 text-white border-gray-700"
                  : "bg-white text-gray-900 border-gray-200"
              } 
              ${
                isMobile
                  ? "h-full w-full rounded-none"
                  : "rounded-lg max-w-2xl w-full"
              } 
              flex flex-col border shadow-xl overflow-hidden`}
            >
              <div
                className={`flex items-center justify-between p-4 pb-2 ${
                  isMobile ? "border-b border-gray-800" : "mb-2"
                }`}
              >
                {isMobile ? (
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    } p-1 mr-2`}
                  >
                    <FiChevronLeft size={20} />
                  </button>
                ) : null}
                <h2 className="text-lg font-semibold">Select a Token</h2>
                {!isMobile && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    } p-1 rounded-full`}
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>

              <div className="relative px-4 py-2">
                <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-500" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search any token. Include * for exact match"
                  className={`w-full p-3 pl-10 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-gray-100 border-gray-200 text-gray-900"
                  } border`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus={!isMobile}
                  onFocus={() => {
                    // On mobile, scroll to make sure the input is visible when focused
                    if (isMobile && searchInputRef.current) {
                      setTimeout(() => {
                        searchInputRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 100);
                    }
                  }}
                />
              </div>

              {wallet.publicKey && (
                <div className="px-4 mb-1">
                  <h3
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    } mb-1`}
                  >
                    Your Tokens
                  </h3>
                </div>
              )}

              <div
                className={`${
                  isMobile ? "flex-grow" : "max-h-96"
                } overflow-y-auto custom-scrollbar px-4 pb-4`}
              >
                {isLoading || isLoadingTokenAccounts ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-16 ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-200"
                        } rounded-lg`}
                      />
                    ))}
                  </div>
                ) : sortedAndFilteredTokens.length === 0 ? (
                  <div
                    className={`text-center py-4 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No tokens found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* First render owned tokens */}
                    {sortedAndFilteredTokens.some((t) => t.owned) && (
                      <div className="space-y-1 mb-3">
                        {sortedAndFilteredTokens
                          .filter((token) => token.owned)
                          .map((token) => (
                            <TokenItem
                              key={token.address}
                              token={token}
                              onSelect={() => {
                                onSelect(token);
                                setIsOpen(false);
                              }}
                              copiedAddress={copiedAddress}
                              onCopyAddress={handleCopyAddress}
                            />
                          ))}
                      </div>
                    )}

                    {/* Divider between owned and other tokens */}
                    {sortedAndFilteredTokens.some((t) => t.owned) &&
                      sortedAndFilteredTokens.some((t) => !t.owned) && (
                        <div className="py-2">
                          <h3
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } mb-2`}
                          >
                            All Tokens
                          </h3>
                          <div
                            className={`border-t ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            } my-1`}
                          ></div>
                        </div>
                      )}

                    {/* Then render other tokens */}
                    {sortedAndFilteredTokens
                      .filter((token) => !token.owned)
                      .map((token) => (
                        <TokenItem
                          key={token.address}
                          token={token}
                          onSelect={() => {
                            onSelect(token);
                            setIsOpen(false);
                          }}
                          copiedAddress={copiedAddress}
                          onCopyAddress={handleCopyAddress}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

// Token item component to avoid repetition
interface TokenItemProps {
  token: TokenWithBalance;
  onSelect: () => void;
  copiedAddress: string | null;
  onCopyAddress: (e: React.MouseEvent, address: string) => void;
}

const TokenItem: React.FC<TokenItemProps> = ({
  token,
  onSelect,
  copiedAddress,
  onCopyAddress,
}) => {
  const isOwnedToken = token.owned;
  const isCopied = token.address === copiedAddress;
  const { theme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  // Determine if we should use dark mode
  const isDarkMode = resolvedTheme === "dark" || theme === "dark";

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  console.log({ token });
  return (
    <div
      className={`flex flex-col w-full p-3 ${
        isMobile ? "mb-2" : "mb-1"
      } rounded-lg transition-colors cursor-pointer active:scale-[0.99] touch-manipulation
        ${
          isDarkMode
            ? isOwnedToken
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-gray-800/50 hover:bg-gray-800"
            : isOwnedToken
            ? "bg-gray-100 hover:bg-gray-200"
            : "bg-white hover:bg-gray-50 border border-gray-100"
        }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div
            className={`relative ${
              isMobile ? "w-10 h-10" : "w-8 h-8"
            } rounded-full flex-shrink-0 overflow-hidden`}
          >
            <img
              src={token.logoURI || token.icon || DEFAULT_TOKEN_LOGO}
              alt={`${token.symbol} logo`}
              className="object-cover w-full h-full"
              loading="lazy"
              width={isMobile ? 40 : 32}
              height={isMobile ? 40 : 32}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_TOKEN_LOGO;
              }}
              style={{ borderRadius: "9999px", background: "transparent" }}
            />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium flex items-center flex-wrap">
              <span className="truncate mr-1">{token.symbol}</span>
              {isOwnedToken && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs rounded-sm flex-shrink-0 ${
                    isDarkMode
                      ? "bg-green-900 text-green-300"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  Owned
                </span>
              )}
            </div>
            <div
              className={`text-sm truncate w-full ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {token.name}
            </div>
          </div>
        </div>

        {isOwnedToken && token.balance && (
          <div className="text-right flex-shrink-0 ml-2">
            <div className="font-medium">
              {parseFloat(token.balance) > 0
                ? parseFloat(token.balance).toFixed(6)
                : "0"}
            </div>
            {token.usdValue && parseFloat(token.usdValue) > 0 && (
              <div className="text-sm text-gray-400">${token.usdValue}</div>
            )}
          </div>
        )}
      </div>

      {/* Contract address row */}
      <div
        className={`mt-2 flex items-center justify-between text-xs ${
          isDarkMode ? "text-gray-500" : "text-gray-600"
        }`}
      >
        <div className="flex items-center space-x-1 min-w-0 flex-1 overflow-hidden">
          <span className="font-mono truncate">
            {formatAddress(token.address)}
          </span>
          <button
            onClick={(e) => onCopyAddress(e, token.address)}
            className={`p-1.5 flex-shrink-0 ${
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-gray-900"
            } rounded-full`}
            aria-label="Copy address"
          >
            {isCopied ? (
              <FiCheck size={14} className="text-green-500" />
            ) : (
              <FiCopy size={14} />
            )}
          </button>
        </div>

        <a
          href={`https://solscan.io/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center space-x-1 p-1.5 flex-shrink-0 ${
            isDarkMode
              ? "text-blue-400 hover:text-blue-300"
              : "text-blue-600 hover:text-blue-700"
          }`}
          aria-label="View on Solscan"
        >
          <span className={isMobile ? "" : "hidden sm:inline"}>View</span>
          <FiExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default TokenSelector;
