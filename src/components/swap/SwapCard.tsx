"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import TokenSelector from "./TokenSelect";
import Button from "../ui/Button";
import { QuoteResponse, TokenInfo } from "@/types/token-info";
import { fetchSwapQuote, signAndExecuteSwap } from "@/utils/token-utils";
import { validateInput } from "@/utils/valid-input";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SwapDetails from "./SwapDetails";

const DEFAULT_TOKENS = {
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

const SwapCard: React.FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();

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

  // Convert amount helper - memoized to prevent recreations
  const convertAmount = useCallback((
    amount: string,
    decimals: number,
    type: ConvertType
  ): string => {
    if (!amount) return "0";

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) return "0";

    if (type === ConvertType.DECIMAL) {
      return (amountNumber * Math.pow(10, decimals)).toString();
    } else {
      return (amountNumber / Math.pow(10, decimals)).toString();
    }
  }, []);

  // Memoized fetch function to prevent unnecessary recreations
  const fetchQuote = useCallback(async (
    fromToken: TokenInfo,
    toToken: TokenInfo,
    inputAmount: string,
    isFromInput: boolean
  ) => {
    if (!fromToken || !toToken || !inputAmount) return null;

    try {
      setSwapState(prev => ({ ...prev, loading: true }));
      
      let sourceToken, destinationToken, amount;
      
      if (isFromInput) {
        sourceToken = fromToken.address;
        destinationToken = toToken.address;
        amount = convertAmount(inputAmount, fromToken.decimals, ConvertType.DECIMAL);
      } else {
        sourceToken = toToken.address;
        destinationToken = fromToken.address;
        amount = convertAmount(inputAmount, toToken.decimals, ConvertType.DECIMAL);
      }
      
      const quote = await fetchSwapQuote(sourceToken, destinationToken, amount);
      
      return {
        quote,
        isFromInput,
        fromToken,
        toToken
      };
    } catch (error) {
      console.error("Failed to fetch swap quote:", error);
      return null;
    } finally {
      setSwapState(prev => ({ ...prev, loading: false }));
    }
  }, [convertAmount]);

  // Handler for from amount changes with proper debouncing
  const handleFromAmountChange = useCallback((value: string) => {
    const validValue = validateInput(value) || "";
    
    // Update the input immediately for responsiveness
    setSwapState(prev => ({
      ...prev,
      amount: validValue,
      activeInput: ActiveInput.FROM,
      // Clear existing timeout if any
      fetchTimerId: prev.fetchTimerId ? (() => {
        clearTimeout(prev.fetchTimerId!);
        return null;
      })() : null
    }));
    
    // Only proceed with API call if we have valid inputs
    if (!validValue) {
      setSwapState(prev => ({ ...prev, swapRate: null, quoteResponse: undefined }));
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
        
        setSwapState(prev => ({
          ...prev,
          swapRate: humanReadableOutAmount,
          quoteResponse: result.quote
        }));
      }
    }, 500);
    
    // Update the timer ID in state
    setSwapState(prev => ({ ...prev, fetchTimerId: timerId }));
  }, [swapState.fromToken, swapState.toToken, fetchQuote, convertAmount]);

  // Handler for to amount changes with debouncing
  const handleToAmountChange = useCallback((value: string) => {
    const validValue = validateInput(value) || "";
    
    setSwapState(prev => ({
      ...prev,
      swapRate: validValue,
      activeInput: ActiveInput.TO,
      fetchTimerId: prev.fetchTimerId ? (() => {
        clearTimeout(prev.fetchTimerId!);
        return null;
      })() : null
    }));
    
    if (!validValue) {
      setSwapState(prev => ({ ...prev, amount: "" }));
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
        
        setSwapState(prev => ({ ...prev, amount: humanReadableInAmount }));
      }
    }, 500);
    
    setSwapState(prev => ({ ...prev, fetchTimerId: timerId }));
  }, [swapState.fromToken, swapState.toToken, fetchQuote, convertAmount]);

  // Swap tokens handler
  const handleSwapTokens = useCallback(() => {
    setSwapState(prev => {
      // Swap tokens
      const newFromToken = prev.toToken;
      const newToToken = prev.fromToken;
      
      // Swap amounts
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
        quoteResponse: undefined
      };
    });
  }, []);

  // Handle swap execution
  const handleSwap = useCallback(async () => {
    const { fromToken, toToken, amount, quoteResponse } = swapState;
    
    if (!fromToken || !toToken || !amount || !quoteResponse) return;
    
    try {
      const swap = await signAndExecuteSwap(wallet, quoteResponse, connection);
      console.log("Swap executed:", swap);
      // Handle successful swap (clear form, show success message, etc.)
    } catch (error) {
      console.error("Swap execution failed:", error);
      // Handle error (display error message, etc.)
    }
  }, [swapState, wallet, connection]);

  // Token selector handlersa
  const handleFromTokenSelect = useCallback((token: TokenInfo) => {
    setSwapState(prev => ({
      ...prev,
      fromToken: {
        ...token,
        icon: token.icon || '' // Provide a default empty string if undefined
      },
      amount: "",
      swapRate: null,
      quoteResponse: undefined
    }));
  }, []);

  const handleToTokenSelect = useCallback((token: TokenInfo) => {
    setSwapState(prev => ({
      ...prev,
      fromToken: {
        ...token,
        icon: token.icon || '' // Provide a default empty string if undefined
      },
      amount: "",
      swapRate: null,
      quoteResponse: undefined
    }));
  }, []);

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

  const { 
    fromToken, toToken, amount, swapRate, loading, quoteResponse 
  } = swapState;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md p-4 sm:p-6 w-full max-w-lg mx-auto transition-all duration-300">

      {/* From token input */}
      {/* 1. Responsive view of the navbar */}
      {/* 2. Responsive view of the swap card */}
      {/* 3. Jupiter swap API IMPLEMENTATION */}

      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-700 mt-1">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            You Pay
          </span>
        </div>
        <input
          type="text"
          className="w-full bg-transparent text-2xl sm:text-3xl outline-none dark:text-white"
          placeholder="0"
          value={amount}
          onChange={(e) => handleFromAmountChange(e.target.value)}
        />
        <div className="flex justify-end">
          <TokenSelector onSelect={handleFromTokenSelect} currentToken={fromToken} />
        </div>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center my-1 absolute z-10 right-0 left-0 top-80">
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
        {loading ? (
          <SkeletonLoader />
        ) : (
          <input
            type="text"
            className="w-full bg-transparent text-2xl sm:text-3xl outline-none dark:text-white"
            placeholder="0"
            value={swapRate || ""}
            onChange={(e) => handleToAmountChange(e.target.value)}
            readOnly
          />
        )}
        <div className="flex justify-end">
          <TokenSelector onSelect={handleToTokenSelect} currentToken={toToken} />
        </div>
      </div>

      {/* <SwapDetails
        fromAmount={amount}
        fromToken={fromToken}
        toToken={toToken}
        swapRate={swapRate}
        quoteResponse={quoteResponse}
      /> */}

      {/* Action button */}
      <Button
        variant="primary"
        className="w-full py-3 sm:py-4 mt-4 text-base font-semibold rounded-xl transition-all duration-300"
        onClick={handleSwap}
        disabled={loading || !wallet.connected || !amount || !swapRate}
      >
        {loading ? (
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
        ) : wallet.connected ? (
          "Swap"
        ) : (
          "Connect Wallet"
        )}
      </Button>
    </div>
  );
};

export default SwapCard;
// const handleSwap = async () => {
//   if (!fromToken || !toToken || !amount) return;

//   // Fetch token prices
//   const fromPrice = await fetchTokenPrice(fromToken.address);
//   const toPrice = await fetchTokenPrice(toToken.address);

//   // Fetch swap quote
//   const quote = await fetchSwapQuote(fromToken.address, toToken.address, amount);

//   console.log("Swap Quote:", quote);
//   console.log("From Price:", fromPrice);
//   console.log("To Price:", toPrice);
// };
