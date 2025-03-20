"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { TokenSearchModal } from "./token-search-modal";
import { TokenInfo } from "@/types/token-info";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TokenSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tokens = [], isLoading } = useSWR<TokenInfo[]>(
    `https://token.jup.ag/strict?${new URLSearchParams({
      search: searchQuery,
    })}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token: TokenInfo) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="relative ml-5">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search name or paste address"
        className={`py-2.5 px-4 pl-10 border border-border-color w-96 text-sm outline-none ${
          isOpen ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"
        }`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClick={() => setIsOpen(true)}
        autoFocus
      />
      {/* <input
        ref={inputRef}
        type="text"
        className=""
        placeholder="Search tokens"
        value={searchQuery}
        onFocus={() => setIsOpen(true)} // Changed from onClick to onFocus
        onChange={(e) => setSearchQuery(e.target.value)}
      /> */}

      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {isOpen && (
        <TokenSearchModal
          tokens={filteredTokens}
          isLoading={isLoading}
          onSelect={(token) => {
            // Handle token selection
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
    </div>
  );
}
