"use client";

import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useCluster } from "../cluster/cluster-data-access";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BitgetWalletAdapter,
  Coin98WalletAdapter,
  MathWalletAdapter,
  TokenPocketWalletAdapter,
  WalletConnectWalletAdapter,
  SkyWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// import {
//   PhantomWalletAdapter,
//   SolflareWalletAdapter,
//   SolletExtensionWalletAdapter,
//   SolletWalletAdapter,
//   TorusWalletAdapter,
//   TrustWalletAdapter,
// } from "@solana/wallet-adapter-wallets";

require("@solana/wallet-adapter-react-ui/styles.css");

// Create a wrapper for WalletMultiButton that accepts the compact prop
interface WalletButtonProps {
  compact?: boolean;
  className?: string;
}

const WalletButtonBase = ({
  compact,
  className,
  ...props
}: WalletButtonProps) => {
  // Use the compact prop to conditionally apply classes or styles
  const buttonClassName = compact
    ? `scale-90 ${className || ""}`.trim()
    : className;

  const WalletMultiButton = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
  );

  return <WalletMultiButton className={buttonClassName} {...props} />;
};

export const WalletButton = WalletButtonBase;

// Mobile wallet guide component
const MobileWalletGuide = () => {
  const { connected } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if connected or dismissed
  if (connected || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-50 dark:bg-blue-900/80 p-4 rounded-lg shadow-lg z-40 border border-blue-200 dark:border-blue-800 animate-fadeIn">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          Mobile Wallet Connection
        </h3>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <p className="text-sm mt-2 text-blue-800 dark:text-blue-200">
        For the best experience, connect using the Phantom or Solflare mobile
        app.
      </p>
      <div className="flex mt-3 space-x-3">
        <a
          href="https://phantom.app/download"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Get Phantom
        </a>
        <a
          href="https://solflare.com/download"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 px-3 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-900 dark:text-blue-100 rounded-md text-sm font-medium transition-colors"
        >
          Get Solflare
        </a>
      </div>
    </div>
  );
};

export function SolanaProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint =
    process.env.NEXT_PRIVATE_SOLANA_RPC_URL ||
    useMemo(() => clusterApiUrl(network), [network]);
  const isMobile = useIsMobile();

  const onError = useCallback((error: WalletError) => {
    console.error("Error from SolanaProvider when connecting to wallet", error);
    // We could add additional mobile-specific error handling here
  }, []);

  const wallets = useMemo(() => {
    // Base wallet configuration
    const baseWallets = [
      new PhantomWalletAdapter({ appIdentity: { name: "LimeDex" } }),
      new SolflareWalletAdapter(),
    ];

    // On mobile, prioritize wallets with good mobile support
    if (isMobile) {
      return [
        ...baseWallets,
        // Other mobile-friendly wallets
        new BitgetWalletAdapter(),
        new TokenPocketWalletAdapter(),
      ];
    }

    // Full list for desktop
    return [
      ...baseWallets,
      new BitgetWalletAdapter(),
      new Coin98WalletAdapter(),
      new MathWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new SkyWalletAdapter(),
      new LedgerWalletAdapter(),
    ];
  }, [isMobile]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        onError={onError}
        autoConnect={!isMobile}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}
