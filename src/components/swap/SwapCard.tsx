"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import TokenSelector from "./TokenSelect";
import Button from "../ui/Button";
import { QuoteResponse, TokenInfo } from "@/types/token-info";
import TransactionHistory from "./TransactionHistory";
import SlippageSettings from "./SlippageSettings";
import { fetchSwapQuote, signAndExecuteSwap } from "@/utils/token-utils";
import { validateInput } from "@/utils/valid-input";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SwapDetails from "./SwapDetails";
import {
  useGetBalance,
  useGetTokenAccounts,
} from "../account/account-data-access";
import { checkBalance } from "@/utils/balance-check";
import SwapButton from "./SwapButton";
import { useNotificationToast, useTransactionToast } from "../ui/ui-layout";
import toast, { useToaster } from "react-hot-toast";
import { useCustomToasts } from "../ui/Toast";
import { useSwapContext } from "@/contexts/ContextProvider";
import { useSettings } from "@/contexts/SettingsContext";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

// Define a stricter type for our default tokens that includes the icon
interface DefaultTokenInfo extends Omit<TokenInfo, 'icon' | 'logoURI'> {
  icon: string; // Make icon required in our default tokens
}

const DEFAULT_TOKENS: { [key: string]: DefaultTokenInfo } = {
  SOL: {
    address: "So11111111111111111111111111111111111111112", // SOL mint address
    symbol: "SOL",
    name: "Solana",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    decimals: 9,
    chainId: 101,
  },
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint address
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    decimals: 6,
    chainId: 101,
  },
};

enum ConvertType {
  DECIMAL = "decimal",
  HUMAN = "human",
}

enum ActiveInput {
  FROM = "from",
  TO = "to",
}

// Add a polyfill check for BigInt to ensure compatibility with older browsers
const ensureBigIntSupport = () => {
  if (typeof window !== 'undefined' && typeof window.BigInt === 'undefined') {
    console.warn('BigInt not supported in this browser. Using fallback.');
    // The native module will already use pure JS as a fallback
  }
};

const SwapCard: React.FC = () => {
  // Check for BigInt support on component mount
  useEffect(() => {
    ensureBigIntSupport();
  }, []);
  
  const wallet = useWallet();
  const { connection } = useConnection();
  const { slippage } = useSettings();
  const solBalance = useGetBalance({ address: wallet.publicKey });
  const tokenAccounts = useGetTokenAccounts({ address: wallet.publicKey });
  const transactionToast = useTransactionToast();
  const notificationToast = useNotificationToast();
  // const toast = useToaster();
  const { showSuccessToast, showErrorToast, showLoadingToast } = useCustomToasts();

  // Use the swap context
  const { 
    fromTokenBalance, 
    fromTokenBalanceUsd, 
    fromTokenDecimals,
    setHalfAmount, 
    setMaxAmount,
    fromToken: contextFromToken,
    toToken: contextToToken,
    amount: contextAmount,
    setAmount: setContextAmount,
    setFromToken: setContextFromToken,
    setToToken: setContextToToken
  } = useSwapContext();

  // Consolidated state to reduce render triggers
  const [swapState, setSwapState] = useState({
    fromToken: DEFAULT_TOKENS.SOL,
    toToken: DEFAULT_TOKENS.USDC,
    amount: "",
    swapRate: null as string | null,
    loading: false,
    quoteResponse: undefined as QuoteResponse | undefined,
    activeInput: ActiveInput.FROM,
    fetchTimerId: null as NodeJS.Timeout | null,
  });

  // Helper function to ensure token has required properties including icon
  const ensureToken = (token: TokenInfo | undefined, defaultToken: DefaultTokenInfo): DefaultTokenInfo => {
    if (!token) return defaultToken;
    return {
      ...token,
      // Ensure icon is set, fallback to logoURI if available, otherwise use default
      icon: token.icon || token.logoURI || defaultToken.icon,
    } as DefaultTokenInfo;
  };

  // Sync the local state with the context
  useEffect(() => {
    if (contextFromToken) {
      // Ensure the token has all required properties
      const safeFromToken = ensureToken(contextFromToken, DEFAULT_TOKENS.SOL);
      setSwapState(prev => ({
        ...prev,
        fromToken: safeFromToken
      }));
    } else {
      setContextFromToken(DEFAULT_TOKENS.SOL);
    }
    
    if (contextToToken) {
      // Ensure the token has all required properties
      const safeToToken = ensureToken(contextToToken, DEFAULT_TOKENS.USDC);
      setSwapState(prev => ({
        ...prev,
        toToken: safeToToken
      }));
    } else {
      setContextToToken(DEFAULT_TOKENS.USDC);
    }
    
    if (contextAmount !== swapState.amount) {
      setSwapState(prev => ({...prev, amount: contextAmount}));
    }
  }, [contextFromToken, contextToToken, contextAmount, swapState.amount]);

  // Convert amount helper - memoized to prevent recreations
  const convertAmount = useCallback(
    (amount: string, decimals: number, type: ConvertType): string => {
      if (!amount) return "0";

      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber)) return "0";

      if (type === ConvertType.DECIMAL) {
        return (amountNumber * Math.pow(10, decimals)).toString();
      } else {
        return (amountNumber / Math.pow(10, decimals)).toString();
      }
    },
    []
  );

  // Memoized fetch function to prevent unnecessary recreations
  const fetchQuote = useCallback(
    async (
      fromToken: TokenInfo,
      toToken: TokenInfo,
      inputAmount: string,
      isFromInput: boolean
    ) => {
      if (
        !fromToken ||
        !toToken ||
        !inputAmount ||
        parseFloat(inputAmount) <= 0
      )
        return null;
      
      try {
        setSwapState((prev) => ({ ...prev, loading: true }));

        // Convert amount to lamports/atoms based on token decimals
        const amountInLamports = Math.floor(
          parseFloat(inputAmount) * Math.pow(10, fromToken.decimals)
        );

        const response = await fetchSwapQuote(
          fromToken.address,
          toToken.address,
          amountInLamports.toString(),
          slippage // Pass slippage in basis points (e.g., 50 for 0.5%)
        );

        if (!response) return null;

        return {
          quote: response,
          fromToken,
          toToken,
          isFromInput,
        };
      } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
      } finally {
        setSwapState(prev => ({ ...prev, loading: false }));
      }
    },
    [slippage]
  );

  // Handler for from amount changes with proper debouncing
  const handleFromAmountChange = useCallback(
    (value: string) => {
      const validValue = validateInput(value) || "";

      // Update both context and local state
      setContextAmount(validValue);
      
      // Update the input immediately for responsiveness
      setSwapState((prev) => ({
        ...prev,
        amount: validValue,
        activeInput: ActiveInput.FROM,
        // Clear existing timeout if any
        fetchTimerId: prev.fetchTimerId
          ? (() => {
              clearTimeout(prev.fetchTimerId!);
              return null;
            })()
          : null,
      }));

      // Only proceed with API call if we have valid inputs
      if (!validValue) {
        setSwapState((prev) => ({
          ...prev,
          swapRate: null,
          quoteResponse: undefined,
        }));
        return;
      }

      // Set up new debounced API call
      const timerId = setTimeout(async () => {
        const result = await fetchQuote(
          swapState.fromToken,
          swapState.toToken,
          validValue,
          true
        );

        if (result) {
          const humanReadableOutAmount = convertAmount(
            result.quote.outAmount,
            result.toToken.decimals,
            ConvertType.HUMAN
          );

          setSwapState((prev) => ({
            ...prev,
            swapRate: humanReadableOutAmount,
            quoteResponse: result.quote,
          }));
        }
      }, 500);

      // Update the timer ID in state
      setSwapState((prev) => ({ ...prev, fetchTimerId: timerId }));
    },
    [swapState.fromToken, swapState.toToken, fetchQuote, convertAmount]
  );

  // Handler for to amount changes with debouncing
  const handleToAmountChange = useCallback(
    (value: string) => {
      const validValue = validateInput(value) || "";

      setSwapState((prev) => ({
        ...prev,
        swapRate: validValue,
        activeInput: ActiveInput.TO,
        fetchTimerId: prev.fetchTimerId
          ? (() => {
              clearTimeout(prev.fetchTimerId!);
              return null;
            })()
          : null,
      }));

      if (!validValue) {
        setSwapState((prev) => ({ ...prev, amount: "" }));
        return;
      }

      const timerId = setTimeout(async () => {
        const result = await fetchQuote(
          swapState.fromToken,
          swapState.toToken,
          validValue,
          false
        );

        if (result) {
          const humanReadableInAmount = convertAmount(
            result.quote.outAmount,
            result.fromToken.decimals,
            ConvertType.HUMAN
          );

          setSwapState((prev) => ({ 
            ...prev, 
            amount: humanReadableInAmount,
            quoteResponse: result.quote 
          }));
        }
      }, 500);

      // Update the timer ID in state
      setSwapState((prev) => ({ ...prev, fetchTimerId: timerId }));
    },
    [swapState.fromToken, swapState.toToken, fetchQuote, convertAmount]
  );

  // Format amount to 5 decimal places
  const formatToFiveDecimals = useCallback((value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    // Ensure we don't have more than 5 decimal places
    const fixed = num.toFixed(5);
    // Remove trailing zeros and . if not needed
    return parseFloat(fixed).toString();
  }, []);

  // Helper function to update amount and fetch quote
  const updateAmountAndFetchQuote = useCallback(async (amount: string) => {
    // Update the input immediately for responsiveness
    setSwapState(prev => {
      // Clear existing timeout if any
      const newState = {
        ...prev,
        amount,
        activeInput: ActiveInput.FROM,
        fetchTimerId: null as NodeJS.Timeout | null
      };
      
      if (prev.fetchTimerId) {
        clearTimeout(prev.fetchTimerId);
      }
      
      return newState;
    });

    // Only proceed with API call if we have a valid amount
    if (!amount || parseFloat(amount) <= 0) {
      setSwapState(prev => ({
        ...prev,
        swapRate: null,
        quoteResponse: undefined,
      }));
      return;
    }

    // Set up new debounced API call
    const timerId = setTimeout(async () => {
      const result = await fetchQuote(
        swapState.fromToken,
        swapState.toToken,
        amount,
        true
      );

      if (result) {
        const humanReadableOutAmount = convertAmount(
          result.quote.outAmount,
          result.toToken.decimals,
          ConvertType.HUMAN
        );

        setSwapState(prev => ({
          ...prev,
          swapRate: humanReadableOutAmount,
          quoteResponse: result.quote,
        }));
      }
    }, 500);

    // Update the timer ID in state
    setSwapState(prev => ({
      ...prev,
      fetchTimerId: timerId
    }));
  }, [swapState.fromToken, swapState.toToken, fetchQuote, convertAmount]);

  // Handler for max amount - sets the input to the maximum available balance
  const handleMaxAmount = useCallback(() => {
    if (fromTokenBalance && parseFloat(fromTokenBalance) > 0) {
      let maxAmount: string;
      
      // If it's SOL, leave a small amount for gas fees
      if (swapState.fromToken?.address === NATIVE_MINT.toString()) {
        maxAmount = Math.max(parseFloat(fromTokenBalance) - 0.01, 0).toString();
      } else {
        maxAmount = fromTokenBalance;
      }
      
      // Format the max amount to 5 decimal places
      const formattedMaxAmount = formatToFiveDecimals(maxAmount);
      
      // Update the context and local state
      setContextAmount(formattedMaxAmount);
      
      // Update amount and fetch quote
      updateAmountAndFetchQuote(formattedMaxAmount);
    }
  }, [fromTokenBalance, setContextAmount, swapState.fromToken, updateAmountAndFetchQuote]);
  
  // Handler for half amount - sets the input to half of the available balance
  const handleHalfAmount = useCallback(() => {
    if (fromTokenBalance && parseFloat(fromTokenBalance) > 0) {
      const halfAmount = (parseFloat(fromTokenBalance) / 2).toString();
      const formattedHalfAmount = formatToFiveDecimals(halfAmount);
      
      // Update the context and local state
      setContextAmount(formattedHalfAmount);
      
      // Update amount and fetch quote
      updateAmountAndFetchQuote(formattedHalfAmount);
    }
  }, [fromTokenBalance, setContextAmount, updateAmountAndFetchQuote]);

  // Swap tokens handler
  const handleSwapTokens = useCallback(() => {
    setSwapState((prev) => {
      if (!prev.fromToken || !prev.toToken) return prev;

      // Get current tokens
      const newFromToken = prev.toToken;
      const newToToken = prev.fromToken;

      // Get current amounts
      const newAmount = prev.swapRate || "";
      const newSwapRate = prev.amount || "";

      return {
        ...prev,
        fromToken: newFromToken,
        toToken: newToToken,
        amount: newAmount,
        swapRate: newSwapRate,
        activeInput: ActiveInput.FROM,
        // Reset loading state and quote
        loading: false,
        quoteResponse: undefined,
        // Clear any existing timeout
        fetchTimerId: prev.fetchTimerId
          ? (() => {
              clearTimeout(prev.fetchTimerId!);
              return null;
            })()
          : null,
      };
    });

    // Also update the context to reflect the token swap
    setContextFromToken(swapState.toToken);
    setContextToToken(swapState.fromToken);
  }, [swapState.fromToken, swapState.toToken, setContextFromToken, setContextToToken]);

  // Handle swap execution
  const handleSwap = useCallback(async () => {
    const { fromToken, toToken, amount, quoteResponse } = swapState;

    if (!fromToken || !toToken || !amount || !quoteResponse)
      return "not available";
    setSwapState((prev) => ({ ...prev, loading: true }));
    try {
      // Show loading toast
      showLoadingToast("Waiting for wallet confirmation...");
  
      const swapTxId = await signAndExecuteSwap(wallet, quoteResponse, connection);
      
      // Show success toast with transaction link
      showSuccessToast(swapTxId);
      
      console.log("Swap executed:", swapTxId);
    } catch (error: any) {
        if (error.message.startsWith("SimulationError")) {
        showErrorToast("Network overloaded—please try again shortly.");
      } else {
        showErrorToast(error.message || "Swap failed");
      }
    } finally {
      setSwapState((prev) => ({ ...prev, loading: false }));

    }
  }, [swapState, wallet, connection]);

  // Fetch new quote when tokens or amount changes
  useEffect(() => {
    if (!swapState.amount || parseFloat(swapState.amount) <= 0) return;
    
    // Clear any existing timeout
    if (swapState.fetchTimerId) {
      clearTimeout(swapState.fetchTimerId);
    }

    const timerId = setTimeout(async () => {
      try {
        setSwapState(prev => ({ ...prev, loading: true }));
        
        const result = await fetchQuote(
          swapState.fromToken,
          swapState.toToken,
          swapState.amount,
          swapState.activeInput === ActiveInput.FROM
        );

        if (result) {
          const amountKey = result.isFromInput ? 'outAmount' : 'inAmount';
          const decimals = result.isFromInput ? result.toToken.decimals : result.fromToken.decimals;
          
          const humanReadableAmount = convertAmount(
            result.quote[amountKey],
            decimals,
            ConvertType.HUMAN
          );

          setSwapState(prev => ({
            ...prev,
            swapRate: result.isFromInput ? humanReadableAmount : prev.swapRate,
            amount: !result.isFromInput ? humanReadableAmount : prev.amount,
            quoteResponse: result.quote,
            loading: false
          }));
        }
      } catch (error) {
        console.error('Error fetching new quote:', error);
        setSwapState(prev => ({
          ...prev,
          loading: false,
          quoteResponse: undefined,
          swapRate: null
        }));
      }
    }, 300);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [swapState.fromToken?.address, swapState.toToken?.address, slippage]);

  // Token selector handlers
  const handleFromTokenSelect = useCallback((token: TokenInfo) => {
    // Don't do anything if selecting the same token
    if (token.address === swapState.fromToken?.address) return;
    
    const tokenWithIcon = {
      ...token,
      icon: token.icon || "",
    };
    
    setContextFromToken(tokenWithIcon);
    setSwapState((prev) => ({
      ...prev,
      fromToken: tokenWithIcon,
      // Only clear the quote if we have an amount entered
      ...(prev.amount ? {
        swapRate: null,
        quoteResponse: undefined,
      } : {})
    }));
  }, [setContextFromToken, swapState.fromToken?.address, swapState.amount]);

  const handleToTokenSelect = useCallback((token: TokenInfo) => {
    // Don't do anything if selecting the same token
    if (token.address === swapState.toToken?.address) return;
    
    const tokenWithIcon = {
      ...token,
      icon: token.icon || "",
    };
    
    setContextToToken(tokenWithIcon);
    setSwapState((prev) => ({
      ...prev,
      toToken: tokenWithIcon,
      // Only clear the quote if we have an amount entered
      ...(prev.amount ? {
        swapRate: null,
        quoteResponse: undefined,
      } : {})
    }));
  }, [setContextToToken, swapState.toToken?.address, swapState.amount]);

  // Handle token data safely
  const safeTokenAccounts = useMemo(() => {
    return Array.isArray(tokenAccounts.data) ? tokenAccounts.data : [];
  }, [tokenAccounts.data]);

  // Safely check balance
  const checkBalanceSafely = useCallback(() => {
    try {
      return checkBalance(
        swapState.amount,
        solBalance.data,
        safeTokenAccounts,
        swapState.fromToken.decimals,
        swapState.fromToken.address
      );
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }, [swapState.amount, solBalance.data, safeTokenAccounts, swapState.fromToken]);

  const hasSufficientBalance = checkBalanceSafely();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (swapState.fetchTimerId) {
        clearTimeout(swapState.fetchTimerId);
      }
    };
  }, [swapState.fetchTimerId]);

  const SkeletonLoader = () => (
    <div className="animate-pulse h-9">
      <div className="h-6 bg-gray-200 rounded w-24"></div>
    </div>
  );

  // Get USD value of token amount
  const getTokenValueInUSD = useCallback((amount: string, token: any): string => {
    if (!amount || !token?.price) return '';
    const value = parseFloat(amount) * (token.price || 0);
    return value > 0.01 ? `$${value.toFixed(2)}` : '<$0.01';
  }, []);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md p-4 sm:p-6 w-full max-w-lg mx-auto transition-all duration-300">
      {/* From token input */}
      {/* 1. Responsive view of the navbar */}
      {/* 2. Responsive view of the swap card */}
      {/* 3. Jupiter swap API IMPLEMENTATION */}

      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-700 mt-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Swap
          </h2>
          <SlippageSettings />
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            You Pay
          </span>
          {wallet.connected && contextFromToken && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Balance: {fromTokenBalance}</span>
              {fromTokenBalanceUsd && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  (${fromTokenBalanceUsd})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center">
            <input
              type="text"
              className="w-full bg-transparent text-2xl sm:text-3xl outline-none dark:text-white"
              placeholder="0"
              value={contextAmount || ''}
              onChange={(e) => handleFromAmountChange(e.target.value)}
            />
            <TokenSelector
              onSelect={handleFromTokenSelect}
              currentToken={contextFromToken}
              isInputToken={true}
            />
          </div>
          {contextAmount && parseFloat(contextAmount) > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getTokenValueInUSD(contextAmount, contextFromToken)}
            </div>
          )}
          {wallet.connected && parseFloat(fromTokenBalance) > 0 && (
            <div className="flex mt-2 gap-2">
              <button
                onClick={handleHalfAmount}
                className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200 font-medium"
              >
                HALF
              </button>
              <button
                onClick={handleMaxAmount}
                className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200 font-medium"
              >
                MAX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center my-1">
        <button
          onClick={handleSwapTokens}
          className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer border-4 border-white dark:border-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
          aria-label="Swap tokens"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-600 dark:text-gray-300"
          >
            <path
              d="M17 4L17 20M17 20L13 16M17 20L21 16M7 20L7 4M7 4L3 8M7 4L11 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* To token input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            You Receive
          </span>
        </div>
        {swapState.loading ? (
          <SkeletonLoader />
        ) : (
          <input
            type="text"
            className="w-full bg-transparent text-2xl sm:text-3xl outline-none dark:text-white"
            placeholder="0"
            value={swapState.swapRate || ""}
            onChange={(e) => handleToAmountChange(e.target.value)}
            readOnly
          />
        )}
        <div className="flex justify-end">
          <TokenSelector
            onSelect={handleToTokenSelect}
            currentToken={contextToToken}
          />
        </div>
      </div>

      <div className="space-y-6">
        <SwapDetails
          fromAmount={contextAmount}
          fromToken={contextFromToken}
          toToken={contextToToken}
          swapRate={swapState.swapRate}
          quoteResponse={swapState.quoteResponse}
        />
      </div>
      {/* Action button */}
      <SwapButton
        onClick={handleSwap}
        disabled={
          !wallet.connected ||
          !swapState.amount ||
          !swapState.swapRate ||
          !hasSufficientBalance ||
          swapState.loading
        }
        loading={swapState.loading}
        walletConnected={wallet.connected}
        hasSufficientBalance={hasSufficientBalance}
      />
      {/* Transaction History Section */}
      <div className="mt-6">
        <TransactionHistory className="mt-4" />
      </div>
      {/* <Button
        variant="primary"
        className="w-full py-3 sm:py-4 mt-4 text-base font-semibold rounded-xl transition-all duration-300"
        onClick={handleSwap}
        disabled={
          swapState.loading ||
          !wallet.connected ||
          !swapState.amount ||
          !swapState.swapRate ||
          !hasSufficientBalance
        }
      >
        {swapState.loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : !wallet.connected ? (
          "Connect Wallet"
        ) : hasSufficientBalance === null ? (
          "Swap"
        ) : !hasSufficientBalance ? (
          balanceError
        ) : (
          "Swap"
        )}
      </Button> */}
    </div>
  );
};
/**
 * !hasSufficientBalance ? (
          balanceError || "Insufficient Balance"
        ) :
 */
export default SwapCard;
