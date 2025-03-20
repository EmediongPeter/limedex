"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ReactNode, Suspense, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { AccountChecker } from "../account/account-ui";
import {
  ClusterChecker,
  ClusterUiSelect,
  ExplorerLink,
} from "../cluster/cluster-ui";
import { WalletButton } from "../solana/solana-provider";
import { TokenSearchModal } from "../SearchTokenModal";
import { TokenSearch } from "../search/token-search";

export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col justify-between items-center px-6 py-4 relative ">
      <div className="navbar bg-base-300/50 dark:text-neutral-content flex-col md:flex-row space-y-2 md:space-y-0 rounded-3xl">
        <div className="flex-1">
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
          <ul className="menu menu-horizontal px-1 space-x-2">
            {links.map(({ label, path }) => (
              <li key={path}>
                <Link
                  className={pathname.startsWith(path) ? "active" : ""}
                  href={path}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative ml-5">
          <TokenSearch />
          </div>

        </div>
        <div className="flex-none space-x-2">
          <WalletButton />
          <ClusterUiSelect />
        </div>
      </div>
      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>
      <div className="flex-grow mx-4 lg:mx-auto">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
      <div className="hidden">
      <li>
        Find a way to create my own personalized UI for the modal of wallet
        connections like the one on uniswap but for now let it be there
      </li>
      <ul>
        <li>
        ✅✅✅THE MAIN FUNCTIONALITY, THE SWAP FUNCTIONALITY VIA API AND THE SMART
          CONTRACT
        </li>
        <li>
          How to pass the trade to jupiter's onchain swap instruction in my
          smart contract + using Typescript for Jupiter to execute the swap
          across DEXs in solana after I might have added fees, validate swaps,
          or automate executions. And also, can I add the fee via typescript in
          order to reduce compute fee on the Solana blockchain
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
          Set up your Anchor project Define accounts and state Create a function
          to handle the swap Integrate with Jupiter's swap instruction Implement
          fee deduction Test and deploy the contract
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
      ✅✅Add a functionality to calculate the conversion rate of the token to be
        bought and the token to be sold for example 50ETH ---===--- 96132.2USDT
      </li>
      <li>
      ✅Add a functionality where when the user clicks the tokens to be swapped,
        it reflects on the Url path
      </li>
      <li>
      ✅✅Add a functionality where the commission fee is calculated once the user
        clicks on the token swaps as it is shown in jupiter
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
        ✅Add a modal view of the wallets just like Uniswaps own of the 5 wallets
        in Solana. Remember to add the dark blur background for the modal view
      </li>
      <li>Add a dark mode functionality of the web page for the user</li>
      </div>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
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
  );
}

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
      </div>
    );
  };
}
