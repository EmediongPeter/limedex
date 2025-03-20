"use client";

import { TokenInfo } from "@/types/token-info";


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
  return (
    <div className="absolute top-full left-0 right-0 mt-0 w-60 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none rounded-tr-none shadow-xl z-50 max-h-[60vh] overflow-hidden overflow-x-hidden border border-border-color">
      <div className="p-4">
        <div className="space-y-2 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : tokens.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No tokens found
            </div>
          ) : (
            tokens.map((token) => (
              <TokenItem
                key={token.address}
                token={token}
                onSelect={onSelect}
              />
            ))
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
      className="flex items-center w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      onClick={() => onSelect(token)}
    >
      {token.logoURI && (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="w-6 h-6 rounded-full mr-2"
          loading="lazy"
          width={24}
          height={24}
        />
      )}
      <div className="text-left">
        <div className="text-sm font-medium dark:text-white">{token.symbol}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {token.name}
        </div>
      </div>
    </button>
  );
}