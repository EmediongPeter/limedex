"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";
import { TokenInfo } from '@/types/token-info';
import Image from 'next/image';
import { formatNumber, formatPercentage } from '@/services/jupiterApi';
import { DEFAULT_EXCHANGE } from "@/utils/tradingViewUtils";
import { ArrowRightLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";

interface TradingViewChartProps {
  symbol: string;
  width?: string;
  height?: string;
  baseToken?: TokenInfo | null;
  quoteToken?: TokenInfo | null;
  isPairInverted?: boolean;
  onSwitchPair?: () => void;
  externalLoading?: boolean;
  marketData?: {
    price?: string | number | null;
    priceChange24h?: string | number | null;
    volume24h?: string | number | null;
    liquidity?: string | number | null;
    mcap?: string | number | null;
  };
  onToggleChart?: (visible: boolean) => void; // New callback for toggling
}

const TradingViewChart = memo(function TradingViewChart({
  symbol,
  width = '100%',
  height = '100%',
  baseToken,
  quoteToken,
  isPairInverted = false,
  onSwitchPair,
  externalLoading,
  marketData,
  onToggleChart, // New prop
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // State to track if chart should be visible (default true)
  const [showChart, setShowChart] = useState(true);

  // Update dimensions on container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height)
        });
      }
    };

    // Initial update
    updateDimensions();

    // Use ResizeObserver for efficient resize handling
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [showChart]);

  // Load user preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('showChart');
    setShowChart(savedPreference ? JSON.parse(savedPreference) : true);
  }, []);

  // Save preference to localStorage and notify parent
  const toggleChartVisibility = () => {
    const newVisibility = !showChart;
    setShowChart(newVisibility);
    localStorage.setItem('showChart', JSON.stringify(newVisibility));
    if (onToggleChart) onToggleChart(newVisibility);

    // Small delay to ensure animation completes before unmounting
    if (!newVisibility) {
      setTimeout(() => {
        // Clean up TradingView widget when hiding
        if (widgetRef.current && widgetRef.current.parentNode) {
          widgetRef.current.parentNode.removeChild(widgetRef.current);
          widgetRef.current = null;
        }
      }, 300); // Match this with CSS transition duration
    }
  };

  // Load TradingView widget only when chart is visible
  useEffect(() => {
    if (!showChart || !containerRef.current || !symbol) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Format symbol correctly for TradingView
    const formattedSymbol = symbol.includes(":") ? symbol : `${DEFAULT_EXCHANGE}:${symbol}`;

    try {
      // Clean up any previous instances
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      if (widgetRef.current && widgetRef.current.parentNode) {
        widgetRef.current.parentNode.removeChild(widgetRef.current);
      }

      // Create container divs for the TradingView widget
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      widgetContainer.style.height = `${Math.max(410, dimensions.height || 410)}px`;
      widgetContainer.style.width = '100%';

      // Create the actual widget div
      const widget = document.createElement('div');
      widget.id = 'tradingview_chart';
      widget.className = 'tradingview-widget-container__widget';
      widget.style.height = '100%';
      widget.style.width = '100%';
      widget.style.borderBottomLeftRadius = '16px';
      widget.style.borderBottomRightRadius = '16px';

      // Clear container and add new elements
      if (containerRef.current) {
        widgetContainer.appendChild(widget);
        containerRef.current.appendChild(widgetContainer);
      }

      // Create and configure script
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;

      // Widget configuration as JSON string
      // Custom theme colors with purple-blue accent
      const isDark = resolvedTheme === "dark";
      
      script.innerHTML = JSON.stringify({
        width: dimensions.width || '100%',
        height: Math.max(410, dimensions.height || 410),
        symbol: formattedSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: isDark ? "dark" : "light",
        style: "1",
        locale: "en",
        toolbar_bg: isDark ? "#0f0f17" : "#f8f9fa",
        hide_legend: true,
        hide_volume: true,
        withdateranges: true,
        allow_symbol_change: false,
        save_image: false,
        container_id: "tradingview_chart",
        disabled_features: [
          "header_symbol_search",
          "header_settings",
          "header_compare",
          "use_studies_context_menu",
          "header_undo_redo",
          "timeframes_toolbar",
          "volume_force_overlay",
          "countdown",
          "left_toolbar",
          "header_indicators",
          "header_screenshot",
          "header_fullscreen_button",
          "control_bar",
        ],
        enabled_features: [
          "hide_left_toolbar_by_default",
          "save_chart_properties_to_local_storage",
        ],
        support_host: "https://www.tradingview.com"
      });

      widgetContainer.appendChild(script);

      // Store references for cleanup
      widgetRef.current = widgetContainer;
      scriptRef.current = script;

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize TradingView chart:', err);
      setError('Failed to load chart');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      // Safely remove created elements
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      if (widgetRef.current && widgetRef.current.parentNode) {
        widgetRef.current.parentNode.removeChild(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [symbol, theme, showChart]); // Added showChart to dependencies

  // Error state UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-[550px] sm:h-[490px] text-gray-500 bg-gray-100 dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-700 rounded-xl">
        {error}
      </div>
    );
  }

  // Determine if we're in a loading state
  const isChartLoading = isLoading || (externalLoading ?? false);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        width: "100%",
        transition: 'all 0.3s ease-in-out',
        transform: showChart ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'top',
        maxHeight: showChart ? '1000px' : '0',
        opacity: showChart ? 1 : 0,
        overflow: 'hidden',
        visibility: showChart ? 'visible' : 'hidden',
        border: '1px solid',
        borderColor: theme === 'dark' ? 'rgba(46, 55, 71, 0.5)' : 'rgba(209, 213, 219, 0.5)',
        borderRadius: '0.75rem',
      }}
      className={`relative bg-white dark:bg-charcoal-800 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Chart Header with Market Data */}
      {(baseToken || quoteToken) && (
        <div className="flex w-full items-center justify-between gap-4 overflow-x-auto border-b border-gray-200 dark:border-charcoal-700 px-4 py-3">
          <div className="flex items-center gap-x-2">
            <div className="hidden -space-x-2 md:flex">
              {baseToken?.logoURI && (
                <span className="relative z-10">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700">
                    <Image
                      src={isPairInverted ? quoteToken?.logoURI || '/fallback-token-icon.png' : baseToken.logoURI || '/fallback-token-icon.png'}
                      alt={`${isPairInverted ? quoteToken?.symbol : baseToken.symbol} logo`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/fallback-token-icon.png';
                      }}
                      sizes="28px"
                      unoptimized={!process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION}
                    />
                  </div>
                </span>
              )}
              {quoteToken?.logoURI && (
                <span className="relative z-0">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700">
                    <Image
                      src={isPairInverted ? baseToken?.logoURI || '/fallback-token-icon.png' : quoteToken.logoURI || '/fallback-token-icon.png'}
                      alt={`${isPairInverted ? baseToken?.symbol : quoteToken.symbol} logo`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/fallback-token-icon.png';
                      }}
                      sizes="28px"
                      unoptimized={!process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION}
                    />
                  </div>
                </span>
              )}
            </div>
            <div className="flex gap-x-1 font-semibold">
              <span>{isPairInverted ? quoteToken?.symbol : baseToken?.symbol || 'Token'}</span>
              <span className="font-semibold text-gray-500">/</span>
              <span>{isPairInverted ? baseToken?.symbol : quoteToken?.symbol || 'Token'}</span>

              {/* {onSwitchPair && (
                <button
                  onClick={onSwitchPair}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Switch pair order"
                >
                  <ArrowRightLeftIcon className="h-4 w-4 text-gray-500" />
                </button>
              )} */}
            </div>
          </div>

          <div className="flex items-center">
            {/* Toggle chart visibility button */}
            {/* <button
              onClick={toggleChartVisibility}
              className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors"
              title={showChart ? "Hide chart" : "Show chart"}
            >
              {showChart ? (
                <EyeOffIcon className="h-4 w-4 text-gray-500 dark:text-charcoal-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-500 dark:text-charcoal-400" />
              )}
            </button> */}
          </div>
        </div>
      )}

      {/* Market data row - only shown when chart is visible */}
      {showChart && (baseToken || quoteToken) && (
        <div className="flex w-full items-center justify-between gap-4 overflow-x-auto px-4 py-3">
          <div className="flex flex-row gap-x-6 overflow-x-auto w-full">
            <div>
              <div className="flex items-center gap-x-1 mb-1 font-semibold">
                <span className="text-xs text-gray-500 dark:text-charcoal-400">Price</span>
              </div>
              <div className="flex items-center text-xs font-medium">
                {isChartLoading ? (
                  <div className="h-4 w-12 bg-gray-200 dark:bg-charcoal-700 animate-pulse rounded"></div>
                ) : (
                  <>
                    <div className="text-gray-500 dark:text-charcoal-400 text-base font-bold">
                      {marketData?.price ? formatNumber(Number(marketData.price)) : '$0'} {quoteToken?.symbol}
                    </div>
                    <div className={marketData?.priceChange24h && Number(marketData.priceChange24h) >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {marketData?.priceChange24h ? formatPercentage(Number(marketData.priceChange24h)) : '0.00%'}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-charcoal-400">24h Vol</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-charcoal-200 dark:bg-charcoal-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-charcoal-300">
                  {marketData?.volume24h ? formatNumber(Number(marketData.volume24h)) : '$0'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-charcoal-400">Liquidity</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-charcoal-200 dark:bg-charcoal-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-charcoal-300">
                  {marketData?.liquidity ? formatNumber(Number(marketData.liquidity)) : '$0'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-1 whitespace-nowrap">
              <p className="text-xs font-normal text-gray-500 dark:text-charcoal-400">Mkt Cap</p>
              {isChartLoading ? (
                <div className="h-4 w-12 bg-charcoal-200 dark:bg-charcoal-700 animate-pulse rounded"></div>
              ) : (
                <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-charcoal-300">
                  {marketData?.mcap ? formatNumber(Number(marketData.mcap)) : '$0'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TradingView container - only rendered when chart is visible */}
      {showChart && (
        <>
          <div className="tradingview-widget-container h-full w-full">
            <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
          </div>

          {/* Custom styles for TradingView iframe */}
          {/* <style jsx global>{`
            .tradingview-widget-container iframe {
              display: block;
              height: 490px;
              width: 100%;
              border-bottom-left-radius: 16px;
              border-bottom-right-radius: 16px;
            }
            @media (max-width: 768px) {
              .tradingview-widget-container iframe {
                height: 350px;
              }
            }
          `}</style> */}
        </>
      )}

      {/* Loading overlay */}
      {isLoading && showChart && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-charcoal-800 bg-opacity-75 dark:bg-opacity-75 z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

export default TradingViewChart;