import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { TokenSearchModal } from "./token-search-modal";
import { TokenInfo } from "@/types/token-info";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TokenSearchProps {
  mobile?: boolean;
}

export function TokenSearch({ mobile = false }: TokenSearchProps) {
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
    <div className="flex justify-center w-full px-4 max-w-xl mx-auto relative">
      <div 
        className="w-full relative"
        style={{ 
          '--search-width': mobile ? '100%' : '400px',
          maxWidth: '100%'
        } as React.CSSProperties}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Search name or paste address"
          className={`
            w-full 
            py-2 
            px-3 
            pl-9 
            border 
            border-border-color 
            text-sm 
            outline-none 
            bg-white 
            dark:bg-slate-800
            rounded-2xl
            ${isOpen ? "rounded-b-none" : ""}
            transition-all
            duration-200
          `}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={() => setIsOpen(true)}
        />
        
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
    </div>
  );
}