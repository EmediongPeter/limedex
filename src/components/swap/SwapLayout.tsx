"use client";

import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "next-themes";
import TradingViewChart from "../chart/TradingViewChart";
import { TokenInfo } from "@/types/token-info";
import { formatTradingViewSymbol } from "@/utils/tradingViewUtils";
import { fetchJupiterTokenData, JupiterTokenData } from "@/services/jupiterApi";
import Script from "next/script";

interface SwapLayoutProps {
  children: React.ReactNode; // This will be the SwapCard
  fromToken?: TokenInfo | null;
  toToken?: TokenInfo | null;
  getTradingViewSymbol: (token: TokenInfo) => string | null;
}

export const SwapLayout: React.FC<SwapLayoutProps> = ({
  children,
  fromToken,
  toToken,
  getTradingViewSymbol,
}) => {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  // Use localStorage to remember chart visibility preference
  const [showChart, setShowChart] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const savedPreference = localStorage.getItem("showChart");
      // Default to hiding chart if no preference is saved
      return savedPreference ? savedPreference === "true" : false;
    }
    return false; // Default to hiding chart
  });

  const [showHistory, setShowHistory] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string>("");
  const [isPairInverted, setIsPairInverted] = useState(false);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);
  const [tokenData, setTokenData] = useState<JupiterTokenData | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  // Handle pair switching
  const handleSwitchPair = () => {
    setIsPairInverted((prev) => !prev);
  };

  // Handle chart visibility toggle with localStorage persistence
  const toggleChartVisibility = () => {
    const newVisibility = !showChart;
    setShowChart(newVisibility);
    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("showChart", newVisibility.toString());
    }
  };

  // Format the trading view symbol based on the current pair order
  useEffect(() => {
    if (!fromToken || !toToken) return;

    const symbol = formatTradingViewSymbol(
      isPairInverted ? toToken : fromToken,
      isPairInverted ? fromToken : toToken,
      "BINANCE",
      false
    );

    if (symbol) {
      setCurrentSymbol(symbol);
    }
  }, [fromToken, toToken, isPairInverted]);

  // Fetch token data from Jupiter API
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!fromToken || !toToken) return;

      setIsLoadingMarketData(true);

      try {
        // Fetch data for the base token (the one we're viewing price for)
        const baseToken = isPairInverted ? toToken : fromToken;
        const quoteToken = isPairInverted ? fromToken : toToken;

        const data = await fetchJupiterTokenData(
          baseToken.address,
          quoteToken.address
        );
        setTokenData(data);
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setIsLoadingMarketData(false);
      }
    };

    fetchTokenData();
  }, [fromToken, toToken, isPairInverted]);

  console;

  // Animation classes for the chart
  const chartAnimationClasses = showChart
    ? "opacity-100 transition-all duration-500 ease-in-out"
    : "opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out";

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-0 flex flex-col items-center">
      {/* Layout row for chart and swap card */}
      <div
        className={`w-full flex flex-col-reverse ${
          showChart && currentSymbol
            ? "lg:flex-row lg:justify-between"
            : "lg:justify-center"
        } gap-8 items-center transition-all pb-4`}
      >
        {/* Chart Section */}
        <div
          className={`w-full lg:w-[60%] flex flex-col justify-between ${chartAnimationClasses}`}
        >
          {showChart && currentSymbol && (
            <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 shadow-md">
              {/* TradingView Chart */}
              <div
                className="relative flex-1 overflow-hidden transition-all"
                // style={{
                //   minHeight: "200px",
                //   height: isMobile ? "350px" : "500px",
                // }}
              >
                <Script
                  src="/static/datafeeds/udf/dist/bundle.js"
                  strategy="lazyOnload"
                  onReady={() => {
                    setIsScriptReady(true);
                  }}
                />
                {isScriptReady && (
                  <TradingViewChart
                    symbol={currentSymbol}
                    height="100%"
                    baseToken={isPairInverted ? toToken : fromToken}
                    quoteToken={isPairInverted ? fromToken : toToken}
                    onSwitchPair={handleSwitchPair}
                    isPairInverted={isPairInverted}
                    externalLoading={isLoadingMarketData}
                    marketData={{
                      price: tokenData?.priceUsd,
                      priceChange24h: tokenData?.priceChange24h,
                      volume24h: tokenData?.volume24h,
                      liquidity: tokenData?.liquidity,
                      mcap: tokenData?.mcap,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Swap Card Section */}
        <div
          className={`flex flex-col w-full mx-auto ${
            showChart && currentSymbol ? "lg:w-[40%]" : "max-w-[500px] mx-auto"
          } items-center justify-center transition-all duration-500`}
        >
          <div className="w-full max-w-lg mx-auto">{children}</div>
        </div>
      </div>

      {/* Controls centered below both sections */}
      <div className="flex flex-row items-center justify-center gap-4 mt-4 mb-2">
        <button
          type="button"
          onClick={toggleChartVisibility}
          className={`flex items-center gap-1 rounded-full p-2 px-4 text-xs font-medium transition-colors ${
            showChart
              ? "bg-primary/10 text-primary dark:text-primary-purple dark:bg-primary-purple/20"
              : "bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-charcoal-300 hover:bg-gray-200 dark:hover:bg-charcoal-600"
          }`}
        >
          <span>{showChart ? "Hide Chart" : "Show Chart"}</span>
          {showChart && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M5.37147 2.54616C5.57468 2.51612 5.7843 2.5 6.00021 2.5C8.55271 2.5 10.2276 4.75242 10.7903 5.64341C10.8585 5.75125 10.8925 5.80517 10.9116 5.88834C10.9259 5.9508 10.9259 6.04933 10.9115 6.11179C10.8925 6.19495 10.8582 6.24923 10.7896 6.35778C10.6397 6.59507 10.4111 6.92855 10.1082 7.29023M3.36216 3.35752C2.28112 4.09085 1.54723 5.10969 1.21055 5.64264C1.14214 5.75094 1.10794 5.80508 1.08887 5.88824C1.07455 5.9507 1.07454 6.04922 1.08886 6.11168C1.10791 6.19484 1.14197 6.24876 1.21007 6.35659C1.77277 7.24758 3.44771 9.5 6.00021 9.5C7.02941 9.5 7.91594 9.1338 8.64441 8.6383M1.50021 1.5L10.5002 10.5M4.93955 4.93934C4.6681 5.21079 4.50021 5.58579 4.50021 6C4.50021 6.82843 5.17178 7.5 6.00021 7.5C6.41442 7.5 6.78942 7.33211 7.06087 7.06066"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          disabled
          title="Coming soon!"
          className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-charcoal-700 p-2 px-4 text-xs font-medium text-gray-700 dark:text-charcoal-300 hover:bg-gray-200 dark:hover:bg-charcoal-600 opacity-75"
        >
          <span>Show History</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="13"
            viewBox="0 0 12 13"
            fill="none"
          >
            <path
              d="M5.0002 6.69446C5.0002 6.14217 5.44791 5.69446 6.0002 5.69446C6.55248 5.69446 7.0002 6.14217 7.0002 6.69446C7.0002 7.24674 6.55248 7.69446 6.0002 7.69446C5.44791 7.69446 5.0002 7.24674 5.0002 6.69446Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SwapLayout;
