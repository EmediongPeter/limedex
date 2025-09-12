"use client";

import { TokenInfo } from "@/types/token-info";
import { useRef } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import Image from "next/image";

export function TokenSearchModal({
  tokens,
  isLoading,
  onSelect,
  onClose,
  searchQuery,
  setSearchQuery,
}: {
  tokens: TokenInfo[];
  isLoading: boolean;
  onSelect: (token: TokenInfo) => void;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Use our custom hook to handle clicks outside the modal
  useClickOutside(modalRef, onClose);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-xl"
      >
        {/* Search header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
              placeholder="Search by token name or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Search content */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No tokens found
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => (
                <TokenItem
                  key={token.address}
                  token={token}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg"
        />
      ))}
    </>
  );
}

function TokenItem({
  token,
  onSelect,
}: {
  token: TokenInfo;
  onSelect: (token: TokenInfo) => void;
}) {
  return (
    <button
      className="flex items-center justify-between w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
      onClick={() => onSelect(token)}
    >
      <div className="flex items-center">
        <div className="relative w-10 h-10 rounded-full mr-3 overflow-hidden">
          <Image
            src={token.logoURI || "/fallback-token-icon.png"}
            alt={`${token.symbol} logo`}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/fallback-token-icon.png";
            }}
            sizes="40px"
            unoptimized={!process.env.NEXT_PRIVATE_IMAGE_OPTIMIZATION}
          />
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900 dark:text-white">
            {token.symbol}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
            {token.name}
            {token.address && (
              <span className="ml-2 text-xs opacity-70">
                {token.address.substring(0, 4)}...
                {token.address.substring(token.address.length - 4)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
