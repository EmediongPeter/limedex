"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";
import { formatNumber, formatPercentage } from "@/services/jupiterApi";
import { TokenInfo } from "@/types/token-info";
import { DEFAULT_EXCHANGE } from "@/utils/tradingViewUtils";
import { ArrowRightLeftIcon } from "lucide-react";

interface TradingViewChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  baseToken?: TokenInfo | null;
  quoteToken?: TokenInfo | null;
  onSwitchPair?: () => void;
  isPairInverted?: boolean;
  marketData?: {
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    liquidity?: number;
    mcap?: number;
  };
  isLoading?: boolean;
}

/**
 * TradingViewChart component using TradingView's recommended embedding approach
 * This uses their advanced chart widget which is more stable and feature-rich
 */
const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  width = "100%",
  height = 400,
  baseToken,
  quoteToken,
  onSwitchPair,
  isPairInverted = false,
  marketData,
  isLoading: externalLoading,
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create unique ID to avoid conflicts with multiple charts
  const chartId = useRef(`tradingview_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!symbol) {
      setError("No symbol provided");
      return;
    }

    // Show loading state
    setIsLoading(true);
    setError(null);

    // Clean up previous widget instance
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = "";
    }

    // Format symbol correctly for TradingView
    // TradingView expects format like "BINANCE:SOLUSDC"
    const formattedSymbol = symbol.includes(":") ? symbol : `${DEFAULT_EXCHANGE}:${symbol}`;

    try {
      // Create and configure script
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      
      // Widget configuration as JSON string
      script.innerHTML = JSON.stringify({
        width: "100%",
        height: "100%",
        symbol: formattedSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: theme === "dark" ? "dark" : "light",
        style: "1",
        locale: "en",
        toolbar_bg: "transparent",
        enable_publishing: false,
        hide_legend: true,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: "https://www.tradingview.com",
        studies_overrides: {
          "volume.visible": false,
        },
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        },
        disabled_features: [
          "header_symbol_search",
          "disable_resolution_rebuild",
          "keep_left_toolbar_visible_on_small_screens",
          "header_undo_redo",
          "timeframes_toolbar",
          "volume_force_overlay",
          "countdown",
          "left_toolbar",
          "header_settings",
          "header_compare",
          "use_studies_context_menu",
          "header_screenshot",
          "header_fullscreen_button",
          "control_bar",
          "use_studies_context_menu", // Disable studies/indicators context menu
        ],
        enabled_features: [
          "hide_left_toolbar_by_default",
          "save_chart_properties_to_local_storage",
        ],
      });

      // Add onload handler to hide loading state
      script.onload = () => {
        setIsLoading(false);
      };

      script.onerror = () => {
        setError("Failed to load TradingView widget");
        setIsLoading(false);
      };

      // Append script to widget container
      if (widgetContainerRef.current) {
        widgetContainerRef.current.appendChild(script);
      }
    } catch (err) {
      console.error("Error initializing TradingView widget:", err);
      setError("Failed to initialize chart");
      setIsLoading(false);
    }

    // Clean up function
    return () => {
      // This clean approach is recommended by TradingView
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  // Error state UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700">
        {error}
      </div>
    );
  }

  // Determine if we're in a loading state (either external or internal loading)
  const isChartLoading = isLoading || (externalLoading ?? false);
  
  // Main chart UI
  return (
    <div 
      ref={containerRef}
      style={{ width, height: height || '500px', minHeight: '550px' }}
      className="relative rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
    >
      {/* Chart Header with Market Data */}
      {(baseToken || quoteToken) && (
        <div className="flex w-full items-center justify-between gap-4 overflow-x-auto border-b border-gray-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-x-2">
            <div className="hidden -space-x-2 md:flex">
              {baseToken?.logoURI && (
                <span className="relative z-10">
                  <img 
                    src={isPairInverted ? quoteToken?.logoURI : baseToken.logoURI} 
                    alt={isPairInverted ? quoteToken?.symbol : baseToken.symbol} 
                    width="28" height="28" 
                    className="rounded-full object-cover border border-gray-200 dark:border-slate-700" 
                    style={{ maxWidth: '28px', maxHeight: '28px' }} 
                  />
                </span>
              )}
              {quoteToken?.logoURI && (
                <span className="relative z-0">
                  <img 
                    src={isPairInverted ? baseToken?.logoURI : quoteToken.logoURI} 
                    alt={isPairInverted ? baseToken?.symbol : quoteToken.symbol} 
                    width="28" height="28" 
                    className="rounded-full object-cover border border-gray-200 dark:border-slate-700" 
                    style={{ maxWidth: '28px', maxHeight: '28px' }} 
                  />
                </span>
              )}
            </div>
            <div className="flex gap-x-1 font-semibold">
              <span>{isPairInverted ? quoteToken?.symbol : baseToken?.symbol || 'Token'}</span>
              <span className="font-semibold text-gray-500">/</span>
              <span>{isPairInverted ? baseToken?.symbol : quoteToken?.symbol || 'Token'}</span>
              
              {/* Pair Switch Button */}
              {onSwitchPair && (
                <button 
                  onClick={onSwitchPair}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Switch pair order"
                >
                  <ArrowRightLeftIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          
          {/* Market Data */}
          <div className="flex flex-row gap-x-6 overflow-x-auto">
            {/* Price and Change */}
            <div>
              <div className="flex items-center gap-x-1 mb-1 font-semibold">
                {isChartLoading ? (
                  <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
                ) : (
                  <>
                    <span>{marketData?.price ? marketData.price.toFixed(2) : '0.00'}</span>
                    <span className="text-sm">{(isPairInverted ? baseToken?.symbol : quoteToken?.symbol) || ''}</span>
                  </>
                )}
              </div>
              <div className="flex items-center text-xs font-medium">
                {isChartLoading ? (
                  <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
                ) : (
                  <span className={marketData?.priceChange24h && marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {marketData?.priceChange24h ? formatPercentage(marketData.priceChange24h) : '0.00%'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Volume */}
            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-gray-400">24h Vol</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">
                  {marketData?.volume24h ? formatNumber(marketData.volume24h) : '$0'}
                </p>
              )}
            </div>
            
            {/* Liquidity */}
            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Liquidity</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">
                  {marketData?.liquidity ? formatNumber(marketData.liquidity) : '$0'}
                </p>
              )}
            </div>
            
            {/* Market Cap */}
            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Mkt Cap</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">
                  {marketData?.mcap ? formatNumber(marketData.mcap) : '$0'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* TradingView requires this exact structure */}
      <div className="tradingview-widget-container h-full w-full" ref={widgetContainerRef}>
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default memo(TradingViewChart);