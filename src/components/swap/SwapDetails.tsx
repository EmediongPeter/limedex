"use client";

import { fetchTokenPrice } from "@/utils/token-utils";
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  useGetBalance,
  useGetTokenAccounts,
} from "../account/account-data-access";
import { PublicKey } from "@solana/web3.js";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="flex items-center"
      >
        {children}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-10 transform -translate-x-1/4 w-64">
          <div className="bg-gray-100 dark:bg-slate-800 dark:text-white text-black text-xs rounded-lg py-2 px-3 shadow-lg">
            {text}
          </div>
        </div>
      )}
    </div>
  );
};

interface PriceDetailsProps {
  price: number | string | null;
  toToken: any;
  tooltipContent: {
    label: string;
    text: string;
  };
}

const PriceDetails = React.memo(
  ({ price, toToken, tooltipContent }: PriceDetailsProps) => (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tooltipContent.label}
        </span>
        <Tooltip text={tooltipContent.text}>
          <div className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 cursor-help transition-colors hover:bg-gray-300 dark:hover:bg-slate-600">
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          </div>
        </Tooltip>
      </div>
      <span className="text-sm font-medium dark:text-white">{price}</span>
    </div>
  )
);

interface SwapDetailsProps {
  fromAmount: string;
  fromToken: any;
  toToken: any;
  swapRate: string | null;
  quoteResponse: any;
}

const SwapDetails: React.FC<SwapDetailsProps> = ({
  fromAmount,
  fromToken,
  toToken,
  swapRate,
  quoteResponse,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [feeInUSD, setFeeInUSD] = useState<string>("$0.00");

  const calculateFees = useCallback(async () => {
    if (!quoteResponse?.platformFee || !toToken) return "$0.00";

    try {
      const tokenData = await fetchTokenPrice(toToken.address);
      const tokenPrice = tokenData.price;
      const decimals = toToken.decimals || 9;

      const feeInTokens =
        Number(quoteResponse.platformFee.amount) / Math.pow(10, decimals);
      const calculatedFeeUSD = feeInTokens * tokenPrice;

      return `$${calculatedFeeUSD.toFixed(4)} (${
        quoteResponse.platformFee.feeBps / 100
      }%)`;
    } catch (error) {
      console.error("Error calculating fees:", error);
      return "Error calculating";
    }
  }, [quoteResponse, toToken]);

  useEffect(() => {
    const updateFees = async () => {
      const fees = await calculateFees();
      setFeeInUSD(fees);
    };

    if (parseFloat(fromAmount) > 0 && quoteResponse?.platformFee) {
      updateFees();
    }
  }, [fromAmount, quoteResponse, calculateFees]);

  return (
    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Price
          </span>
          <Tooltip text="Current exchange rate between tokens">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Tooltip>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg
            className={`w-5 h-5 transform ${
              expanded ? "rotate-180" : "rotate-0"
            } transition-transform duration-200`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <PriceDetails
          price={swapRate}
          toToken={toToken}
          tooltipContent={{
            label: "Pricing",
            text: "Current exchange rate between tokens",
          }}
        />

        {quoteResponse?.platformFee && (
          <PriceDetails
            price={feeInUSD}
            toToken={toToken}
            tooltipContent={{ label: "Fees", text: "Transaction fees in USD" }}
          />
        )}
      </div>
    </div>
  );
};

export default SwapDetails;
