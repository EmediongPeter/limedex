"use client";
import React, { useState, useEffect, useCallback } from "react";
import TokenSelector from "./TokenSelect";
import Button from "../ui/Button";
import { TokenInfo } from "@/types/token-info";
import { fetchSwapQuote } from "@/utils/token-utils";
import { validateInput } from "@/utils/valid-input";

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
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [swapRate, setSwapRate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<ActiveInput>(ActiveInput.FROM);
  const [isUserActive, setIsUserActive] = useState(false);
  const [InputBar, setInputBar] = useState(true);

  useEffect(() => {
    setFromToken(DEFAULT_TOKENS.SOL);
    setToToken(DEFAULT_TOKENS.USDC);
  }, []);

  const fetchSwapRate = useCallback(async () => {
    if (!fromToken || !toToken || !amount || activeInput !== ActiveInput.FROM)
      return;

    const decimalAmount = convertAmount(
      amount,
      fromToken.decimals,
      ConvertType.DECIMAL
    );
    try {
      const quote = await fetchSwapQuote(
        fromToken.address,
        toToken.address,
        decimalAmount
      );
      const humanReadableOutAmount = convertAmount(
        quote.outAmount,
        toToken.decimals,
        ConvertType.HUMAN
      );
      setSwapRate(humanReadableOutAmount);
    } catch (error) {
      console.error("Failed to fetch swap rate:", error);
      setSwapRate(null);
    }
  }, [fromToken, toToken, amount, activeInput]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!fromToken || !toToken || !amount || activeInput !== ActiveInput.FROM)
        return;

      setLoading(true);
      fetchSwapRate().finally(() => setLoading(false));
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [fromToken, toToken, amount, activeInput, fetchSwapRate]);

  // useEffect(() => {
  //   const interval = setInterval(fetchSwapRate, isUserActive ? 1000 : 10000); // Dynamic polling interval
  //   return () => clearInterval(interval);
  // }, [fetchSwapRate, isUserActive]);

  const handleFromAmountChange = async (value: string) => {
    setAmount(validateInput(value) || "");
    setActiveInput(ActiveInput.FROM);
    setIsUserActive(true);

    if (!fromToken || !toToken || !value) {
      setSwapRate(null);
      return;
    }

    const decimalAmount = convertAmount(
      value,
      fromToken.decimals,
      ConvertType.DECIMAL
    );
    const quote = await fetchSwapQuote(
      fromToken.address,
      toToken.address,
      decimalAmount
    );
    const humanReadableOutAmount = convertAmount(
      quote.outAmount,
      toToken.decimals,
      ConvertType.HUMAN
    );
    setSwapRate(humanReadableOutAmount);
  };

  const handleToAmountChange = async (value: string) => {
    setSwapRate(validateInput(value) || "");
    setActiveInput(ActiveInput.TO);
    setIsUserActive(true);

    if (!fromToken || !toToken || !value) {
      setAmount("");
      return;
    }

    const decimalAmount = convertAmount(
      value,
      toToken.decimals,
      ConvertType.DECIMAL
    );
    const quote = await fetchSwapQuote(
      toToken.address,
      fromToken.address,
      decimalAmount
    );
    const humanReadableInAmount = convertAmount(
      quote.outAmount,
      fromToken.decimals,
      ConvertType.HUMAN
    );
    setAmount(humanReadableInAmount);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) return;

    // Fetch swap quote
    const quote = await fetchSwapQuote(
      fromToken.address,
      toToken.address,
      amount
    );

    console.log("Swap Quote:", quote);
  };

  const convertAmount = (
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
  };

  const handleSwapTokens = useCallback(() => {
    // Swap tokens
    setFromToken(toToken);
    setToToken(fromToken);
    
    // Swap amounts optimistically
    setAmount(swapRate || '');
    setSwapRate(amount);
    
    // Force recalculation by marking FROM as active
    setActiveInput(ActiveInput.FROM);
  }, [fromToken, toToken, amount, swapRate]);

  const SkeletonLoader = () => (
    <div className="animate-pulse h-9">
      <div className="h-6 bg-gray-200 rounded w-24"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl shadow-md p-4 w-full max-w-lg ">
      {/* From token input */}
      {/* 1. Responsive view of the navbar */}
      {/* 2. Responsive view of the swap card */}
      {/* 3. Jupiter swap API IMPLEMENTATION */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-1 border mt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">You Pay</span>
        </div>
        <input
          type="text"
          className="w-full bg-transparent border-none text-3xl outline-none"
          placeholder="0"
          value={amount}
          onChange={(e) => handleFromAmountChange(e.target.value)}
        />
        <div className="flex justify-end">
          <TokenSelector onSelect={setFromToken} currentToken={fromToken} />
        </div>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center my-1 absolute z-10 right-0 left-0 top-80" onClick={handleSwapTokens}>
        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer border-[5px] border-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 4L17 20M17 20L13 16M17 20L21 16M7 20L7 4M7 4L3 8M7 4L11 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* To token input */}
      <div className="bg-white rounded-2xl p-4 mb-1 border">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">You Receive</span>
        </div>
        {loading ? (
          <SkeletonLoader />
        ) : (
          <input
            type="text"
            className="w-full bg-transparent border-none text-3xl outline-none"
            placeholder="0"
            value={swapRate || ""}
            onChange={(e) => handleToAmountChange(e.target.value)}
            readOnly
          />
        )}
        <div className="flex justify-end">
          <TokenSelector onSelect={setToToken} currentToken={toToken} />
        </div>
      </div>

      {/* Action button */}
      <Button
        variant="primary"
        className="w-full py-4 mt-4 text-base font-semibold"
        onClick={handleSwap}
        // disabled={loading || !swapRate}
        disabled={true}
      >
        {loading ? "Loading..." : "Connect wallet"}
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
