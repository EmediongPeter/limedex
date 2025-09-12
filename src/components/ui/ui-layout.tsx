"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import { AccountChecker } from "../account/account-ui";
import {
  ClusterChecker,
  ClusterUiSelect,
  ExplorerLink,
} from "../cluster/cluster-ui";
import { WalletButton } from "../solana/solana-provider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "next-themes";
import { SearchButton } from "../search/SearchButton";
import { EnhancedSearchModal } from "../search/EnhancedSearchModal";
import axios from "axios";
import { useSearchContext } from "@/contexts/SearchContext";
import { Search } from "lucide-react";

export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark" || theme === "dark";
  const { openSearch } = useSearchContext();

  // Close sidebar when path changes (navigation occurs)
  useEffect(() => {
    setSidebarOpen(false);
    setTheme("light")
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isMobile]);

  return (
    <>
      {/* Mobile Sidebar - Completely outside the main component tree for proper z-index */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop with animation */}
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
              sidebarOpen ? "opacity-50" : "opacity-0"
            }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <div
            className={`fixed top-0 left-0 h-full w-4/5 max-w-xs ${
              isDarkMode ? "bg-gray-900" : "bg-white"
            } 
            shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-title"
          >
            {/* Header */}
            <div
              className={`px-4 py-3 flex items-center justify-between border-b ${
                isDarkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <h2 id="sidebar-title" className="text-base font-semibold">
                Menu
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu content */}
            <div className="flex-1 overflow-y-auto py-2">
              <ul className="menu menu-sm p-2 w-full">
                {links.map(({ label, path }) => (
                  <li key={path} className="mb-1">
                    <Link
                      className={`rounded-lg px-3 py-2.5 text-sm ${
                        (pathname?.startsWith(path) ?? false)
                          ? `${
                              isDarkMode
                                ? "bg-primary/20 text-primary"
                                : "bg-primary/10 text-primary"
                            }`
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      } 
                        transition-colors`}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Search section */}
              <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mb-2">
                  Search
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      openSearch();
                    }}
                    className="w-full flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <svg
                      className="w-3.5 h-3.5 mr-2 text-gray-400"
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
                    <span>Search tokens</span>
                  </button>
                </div>

                {/* Wallet section */}
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mb-2">
                  Wallet
                </div>
                <div className="px-1">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col justify-between items-center md:px-6 relative">
        {/* Mobile navbar (fixed position) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-3 py-2 bg-base-300/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between w-full">
            {/* Left side: Hamburger + Logo */}
            <div className="flex items-center flex-shrink-0">
              {/* Hamburger menu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 mr-1 rounded-lg active:scale-95 transition-transform"
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700 dark:text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center ml-1">
                <div className="flex items-center font-semibold text-lg text-primary-purple">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      fill="#a78bfa"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                      fill="#a78bfa"
                    />
                  </svg>
                  <span className="text-sm">LimeDex</span>
                </div>
              </Link>
            </div>

            {/* Center: Search bar */}
            <div className="flex items-center flex-1 justify-end flex-shrink-0">
              {/* <button
              onClick={openSearch}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400"
              style={{ minWidth: 40 }}
              >
              <Search className="w-5 h-5 text-muted-foreground" />
              </button> */}
            </div>

            {/* Right side: Wallet button */}
            <div className="flex-shrink-0 transform scale-[0.6] scale-y-[0.7]">
              <WalletButton compact={true} />
            </div>
          </div>
        </div>

        {/* Desktop navbar (hidden on mobile) */}
        <div className="hidden md:flex navbar bg-base-300/50 dark:bg-gray-900/50 backdrop-blur-md dark:text-neutral-content rounded-3xl px-4 mt-4">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center">
              <Link className="btn btn-ghost normal-case text-xl px-4" href="/">
                <div className="flex items-center font-semibold text-xl text-primary-purple">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      fill="#a78bfa"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                      fill="#a78bfa"
                    />
                  </svg>
                  <span>Lime Dex</span>
                </div>
              </Link>

              <ul className="flex items-center gap-2 px-1 text-base">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        (pathname?.startsWith(path) ?? false)
                          ? "bg-primary-purple text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Centered search button */}
            <div className="flex justify-center mx-auto">
              {/* <SearchButton /> */}
            </div>

            <div className="flex-none space-x-2">
              <WalletButton />
              {/* <ClusterUiSelect /> */}
            </div>
          </div>
        </div>

        <Toaster position="bottom-right" />
        {/* <EnhancedSearchModal /> */}
        {/* Add padding top on mobile to account for fixed navbar */}
        <div className="grow flex flex-col md:p-4 mx-auto max-w-full w-full">
          <Suspense>
            <div className="grow">{children}</div>
          </Suspense>
          <Toaster position="bottom-left" />
        </div>
        <footer className="footer footer-center p-4 bg-base-300 text-base-content hidden">
          <aside className="text-left text-lg flex justify-start">
            <p>
              Generated by{" "}
              <a
                className="link hover:text-white"
                href="https://github.com/solana-developers/create-solana-dapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                create-solana-dapp
              </a>
            </p>
          </aside>
        </footer>
      </div>
    </>
  );
}

// Rest of the code remains the same...

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (show) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [show, dialogRef]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                onClick={submit}
                disabled={submitDisabled}
              >
                {submitLabel || "Save"}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === "string" ? (
            <h1 className="text-5xl font-bold">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <p className="py-6">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = "", len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={"text-center"}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink
          path={`tx/${signature}`}
          label={"View Transaction"}
          className="btn btn-xs btn-primary"
        />
      </div>,
      {
        duration: 60000, // 60,000 milliseconds = 1 minute
        // Other options may go here depending on your toast library
      }
    );
  };
}

export function useNotificationToast() {
  return () => {
    toast.loading(
      <div className={"text-center"}>
        <div className="text-lg">
          {/* <LoaderIcon /> */}
          Wallet sign pending
        </div>
        {/* <ExplorerLink
          path={`tx/${signature}`}
          label={"View Transaction"}
          className="btn btn-xs btn-primary"
        /> */}
      </div>,
      {
        duration: 60000, // 60,000 milliseconds = 1 minute
        // Other options may go here depending on your toast library
        id: "transaction-loading",
      }
    );
  };
}
/**
 * 	 
3.  Data Fetching & Caching
Goal: Implement efficient data fetching with caching for better performance.

Steps:

Use SWR for client-side data fetching with caching
Pre-load top tokens by 24h volume
Implement search debouncing
Add loading and error states
Files to Create/Modify:

src/hooks/useTokenData.ts (new)
src/lib/api.ts (new, for API utilities)


4.  Token Display & Interaction
Goal: Display tokens in an organized, user-friendly way.

Steps:

Create a TokenItem component for consistent token display
Add sections for:
Recent searches
Top tokens by volume
Search results
Implement token selection functionality
Files to Create/Modify:

src/components/search/TokenItem.tsx (new)
src/types/token.ts (new, for type definitions)

5. Performance Optimization
Goal: Ensure smooth performance, especially on mobile.

Steps:

Implement virtualization for long lists
Optimize images with next/image
Add proper loading states
Implement proper cleanup in useEffect
6. Testing & Refinement
Goal: Ensure everything works perfectly across devices and themes.

Steps:

Test on different screen sizes
Verify theme consistency
Test performance with slow networks
Get user feedback and iterate

Phase 2: Data Fetching & Caching
Use SWR for fetching and caching token data from the Jupiter API.
On modal open, fetch and display top tokens by 24h volume (as default view).
Debounce user search input and fetch matching tokens.
Show loading and error states.
Phase 3: Token Display & Features
Create a TokenItem component for displaying tokens.
Show recent searches and top tokens by volume.
Add ability to favorite/star tokens (persisted in localStorage).
Allow token selection and close modal on select.
Phase 4: Performance & Polish
Optimize lists (virtualization if needed for search results).
Add subtle animations for modal open/close.
Test on multiple devices and browsers.
Polish UI, error states, and loading skeletons.




 */
