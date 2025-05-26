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
import { TokenSearchModal } from "../SearchTokenModal";
import { TokenSearch } from "../search/token-search";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "next-themes";

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
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  
  // Close sidebar when path changes (navigation occurs)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  return (
    <>
      {/* Mobile Sidebar - Completely outside the main component tree for proper z-index */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-enter"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar panel */}
          <div 
            className={`fixed top-0 right-0 h-full w-3/4 max-w-xs ${isDarkMode ? 'bg-gray-900' : 'bg-white'} 
            shadow-xl sidebar-enter flex flex-col`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-title"
          >
            {/* Header */}
            <div className={`px-4 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 id="sidebar-title" className="text-lg font-semibold">Menu</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="btn btn-ghost btn-sm p-1 h-8 w-8 rounded-full active:scale-95 transition-transform"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu content */}
            <div className="flex-1 overflow-y-auto py-2">
              <ul className="menu menu-md p-2 w-full">
                {links.map(({ label, path }) => (
                  <li key={path} className="my-1">
                    <Link
                      className={`rounded-lg px-4 py-3 ${pathname.startsWith(path) 
                        ? `${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}` 
                        : ''} active:scale-[0.98] transition-transform`}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="px-4 py-4">
                <div className="divider my-2 before:bg-gray-700 after:bg-gray-700 opacity-50">Search</div>
                <div className="mb-6">
                  <TokenSearch mobile />
                </div>
                
                <div className="divider my-2 before:bg-gray-700 after:bg-gray-700 opacity-50">Wallet</div>
                <div className="flex justify-center mb-6">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col justify-between items-center md:px-6 py-4 relative">
        {/* Mobile navbar (fixed position) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-2 bg-base-300/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center">
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
                <span className="hidden xs:inline">Lime Dex</span>
              </div>
            </Link>
            
            {/* Search button - opens search dropdown */}
            <div className="hidden xs:flex">
              <div className="relative w-36 sm:w-52">
                <TokenSearch mobile />
              </div>
            </div>
            
            {/* Wallet button (smaller on mobile) */}
            <div className="flex items-center">
              <div className="transform scale-75 origin-right">
                <WalletButton compact={true} />
              </div>
            
              {/* Hamburger menu */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-full active:scale-95 transition-transform ml-1"
                aria-label="Open menu"
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
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            
            {/* Add a skip navigation link for accessibility */}
            <div className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-white focus:p-4">
              <a href="#main-content" className="p-2">Skip to main content</a>
            </div>
          </div>
        </div>

        {/* Desktop navbar (hidden on mobile) */}
        <div className="hidden md:flex navbar bg-base-300/50 dark:text-neutral-content rounded-3xl px-4 mt-4">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center">
              <Link className="btn btn-ghost normal-case text-xl" href="/">
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
                        pathname.startsWith(path)
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
          </div>
          <div className="">
            <TokenSearch />
          </div>

          <div className="flex-none space-x-2">
            <WalletButton />
            {/* <ClusterUiSelect /> */}
          </div>
        </div>

        <Toaster position="bottom-right" />
        <AccountChecker />
        <ClusterChecker>
          {/* Add padding top on mobile to account for fixed navbar */}
          <div className="grow flex flex-col p-4 pt-20 md:pt-4 md:p-8 mx-auto max-w-3xl w-full">
            <Suspense>
              <div className="grow">{children}</div>
            </Suspense>
            <Toaster position="bottom-left" />
          </div>
        </ClusterChecker>
        <div className="hidden">
        <li>
          Find a way to create my own personalized UI for the modal of wallet
          connections like the one on uniswap but for now let it be there
        </li>
        <ul>
          <li>
            ✅✅✅THE MAIN FUNCTIONALITY, THE SWAP FUNCTIONALITY VIA API AND THE
            SMART CONTRACT
          </li>
          <li>
            How to pass the trade to jupiter's onchain swap instruction in my
            smart contract + using Typescript for Jupiter to execute the swap
            across DEXs in solana after I might have added fees, validate swaps,
            or automate executions. And also, can I add the fee via typescript
            in order to reduce compute fee on the Solana blockchain
          </li>
          <li>
            can I Compute the best swap route from typescript and send it to
            typescript and Deduct the 0.15% fee before executing the swap before
            sending it to my smart contract to do the swap. If yes how
          </li>
          <ol>
            <strong>Guideline of what my Anchor smart contract will be</strong>
            Receive swap instructions from users. <br />
            Compute the best swap route using Jupiter. <br />
            Deduct a 0.15% fee before executing the swap. <br />
            Forward the swap transaction to Jupiter’s on-chain program. <br />
            Send the swapped tokens to the user after deducting fees. <br />
            <strong>2. Steps to Implement the Smart Contract</strong>
            Set up your Anchor project Define accounts and state Create a
            function to handle the swap Integrate with Jupiter's swap
            instruction Implement fee deduction Test and deploy the contract
          </ol>
        </ul>
        <li>
          Add an api functionality to get all the tokens from solana, including
          their current price and other info like address, etc
        </li>
        <li>
          ✅Add a functionality to calculate how much the token selected is in
          Dollars
        </li>
        <li>
          ✅✅Add a functionality to calculate the conversion rate of the token
          to be bought and the token to be sold for example 50ETH ---===---
          96132.2USDT
        </li>
        <li>
          ✅Add a functionality where when the user clicks the tokens to be
          swapped, it reflects on the Url path
        </li>
        <li>
          ✅✅Add a functionality where the commission fee is calculated once
          the user clicks on the token swaps as it is shown in jupiter
        </li>
        <li>
          ✅✅Add a functionality where the the place of connect wallet is shown
          insufficient balance if the amount the user wants to buy isn't
          sufficient
        </li>
        <li>
          Add a functionality where tokens can be searched by the user on the
          solana blockchain
        </li>
        <li>
          ✅Add a modal view of the wallets just like Uniswaps own of the 5
          wallets in Solana. Remember to add the dark blur background for the
          modal view
        </li>
        <li>Add a dark mode functionality of the web page for the user</li>
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
        id: 'transaction-loading'
      }
    );
    
  };
}
