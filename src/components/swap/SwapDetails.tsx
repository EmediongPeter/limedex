"use client";

import { fetchTokenPrice } from "@/utils/token-utils";
import React, { useState, useEffect } from "react";

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
            {/* <div className="absolute top-full left-1/4 transform -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div> */}
          </div>
        </div>
      )}
    </div>
  );
};

interface PriceDetailsProps {
  fromAmount: string;
  fromToken: any;
  toToken: any;
  swapRate: string | null;
quoteResponse: any;
}

const SwapDetails: React.FC<PriceDetailsProps> = ({
  fromAmount,
  fromToken,
  toToken,
    swapRate,
    quoteResponse
}) => {
  const [showDetails, setShowDetails] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [feeInUSD, setFeeInUSD] = useState<string>("$0.00");
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => {
    // Show the component only when amount > 0
    setShowDetails(parseFloat(fromAmount) > 0);
  }, [fromAmount]);
    
  useEffect(() => {
    const calculateFees = async () => {
      if (!quoteResponse?.platformFee || !quoteResponse.outAmount) {
        setFeeInUSD("$0.00");
        return;
      }

      setLoadingFees(true);
      try {

        // Get token price and decimals (assuming 9 decimals if not available)
        const tokenData = await fetchTokenPrice(toToken.address);
        const tokenPrice = tokenData.price;
        const decimals = toToken.decimals || 9;

        // Calculate fee in USD
        const feeInTokens = Number(quoteResponse.platformFee.amount) / Math.pow(10, decimals);
        const calculatedFeeUSD = feeInTokens * tokenPrice;
console.log(calculatedFeeUSD)
        setFeeInUSD(`$${calculatedFeeUSD.toFixed(4)} (${quoteResponse.platformFee.feeBps / 100}%)`);
      } catch (error) {
        console.error("Error calculating fees:", error);
        setFeeInUSD("Error calculating");
      } finally {
        setLoadingFees(false);
      }
    };

    calculateFees();
  }, [quoteResponse]);

//   const calculatePrice = () => {
//     if (!swapRate || !fromAmount || parseFloat(fromAmount) === 0) return "—";
//     const ratio = parseFloat(swapRate) / parseFloat(fromAmount);
//     return ratio.toFixed(2);
//   };

  if (!showDetails) return null;

  //     async function getTokenPriceInUSD(mintAddress: string): Promise<number>{

    //   }

  const calculatePrice = async () => {
    if (!swapRate || !fromAmount || parseFloat(fromAmount) === 0) return "—";
    const ratio = parseFloat(swapRate) / parseFloat(fromAmount);
    return ratio.toFixed(2);
  };

  const formatFees = () => {
    // Simple fee calculation - this could be replaced with actual fee calculation
    if (!fromAmount || parseFloat(fromAmount) === 0) return "$0.00";
    const estimatedFee = parseFloat(fromAmount) * 0.003; // 0.3% fee as example
    return `$${estimatedFee.toFixed(4)}`;
  };

  // Tooltip content
  const tooltipContent = {
    pricing: "The best rate found across multiple decentralized exchanges.",
    fees: "The network and protocol fees associated with this transaction.",
    priceImpact:
      "The difference between the market price and the quoted price due to trade size.",
    slippage:
      "Maximum acceptable price change during transaction processing time.",
  };

  return (
    <div
      className={`bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700 transition-all duration-300 ${
        showDetails ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
      }`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center cursor-pointer mb-2"
      >
        <h3 className="font-medium text-sm dark:text-white">Swap Details</h3>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div
        className={`space-y-3 transition-all duration-300 ${
          expanded
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pricing
            </span>
            <Tooltip text={tooltipContent.pricing}>
              <div className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 cursor-help transition-colors hover:bg-gray-300 dark:hover:bg-slate-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            </Tooltip>
          </div>
          <span className="text-sm font-medium dark:text-white">
            1 {fromToken?.symbol} ≈ {calculatePrice()} {toToken?.symbol}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Fees
            </span>
            <Tooltip text={tooltipContent.fees}>
              <div className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 cursor-help transition-colors hover:bg-gray-300 dark:hover:bg-slate-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            </Tooltip>
          </div>
          <span className="text-sm font-medium dark:text-white">
            {formatFees()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Price Impact
            </span>
            <Tooltip text={tooltipContent.priceImpact}>
              <div className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 cursor-help transition-colors hover:bg-gray-300 dark:hover:bg-slate-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            </Tooltip>
          </div>
          <span className="text-sm font-medium dark:text-white text-green-500">
            0%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Slippage
            </span>
            <Tooltip text={tooltipContent.slippage}>
              <div className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 cursor-help transition-colors hover:bg-gray-300 dark:hover:bg-slate-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium dark:text-white">
              Auto • {10}%
            </span>
            <button className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapDetails;
