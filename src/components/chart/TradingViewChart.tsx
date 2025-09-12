"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";
import { TokenInfo } from "@/types/token-info";
import Image from "next/image";
import { formatNumber, formatPercentage } from "@/services/jupiterApi";
import { DEFAULT_EXCHANGE } from "@/utils/tradingViewUtils";
import { ArrowRightLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "public/static/charting_library";
import datafeed from "@/utils/datafeed";

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
  chart?: Partial<ChartingLibraryWidgetOptions>;
}

const TradingViewChart = memo(function TradingViewChart({
  symbol,
  width = "100%",
  height = "100%",
  baseToken,
  quoteToken,
  isPairInverted = false,
  onSwitchPair,
  externalLoading,
  marketData,
  onToggleChart,
  chart, // New prop
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const tvWidgetRef = useRef<any>(null); // Store widget instance

  const props = chart;
  // State to track if chart should be visible (default true)
  const [showChart, setShowChart] = useState(true);

  // Update dimensions on container resize
  // useEffect(() => {
  //   if (!containerRef.current) return;

  //   const updateDimensions = () => {
  //     if (containerRef.current) {
  //       const { width, height } = containerRef.current.getBoundingClientRect();
  //       setDimensions({
  //         width: Math.floor(width),
  //         height: Math.floor(height),
  //       });
  //     }
  //   };

  //   // Initial update
  //   updateDimensions();

  //   // Use ResizeObserver for efficient resize handling
  //   const resizeObserver = new ResizeObserver(updateDimensions);
  //   resizeObserver.observe(containerRef.current);

  //   // Cleanup
  //   return () => {
  //     if (containerRef.current) {
  //       resizeObserver.unobserve(containerRef.current);
  //     }
  //     resizeObserver.disconnect();
  //   };
  // }, [showChart]);

  // // Load user preference from localStorage on mount
  // useEffect(() => {
  //   const savedPreference = localStorage.getItem("showChart");
  //   setShowChart(savedPreference ? JSON.parse(savedPreference) : true);
  // }, []);

  // Load TradingView widget only when chart is visible
  useEffect(() => {
    if (!showChart || !containerRef.current || !symbol || !baseToken || !quoteToken ) {
      return;
    }

    // setIsLoading(true);
    setError(null);

    // Format symbol correctly for TradingView
    const formattedSymbol = symbol.includes(":")
      ? symbol
      : `${DEFAULT_EXCHANGE}:${symbol}`;

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol,
      datafeed: datafeed(baseToken, quoteToken),
      interval: "15" as ResolutionString,
      container: containerRef.current as HTMLElement,
      library_path: "/static/charting_library/",
      locale: "en",
      fullscreen: false,
      autosize: true,
      disabled_features: [
        "use_localstorage_for_settings",
        "header_widget",
        "left_toolbar",
        "header_symbol_search",
        "header_compare",
        "header_saveload",
        "timeframes_toolbar",
        "volume_force_overlay",
        "show_interval_dialog_on_key_press",
      ],
      toolbar_bg: "#6ca1c5ff",
      time_frames: [
        {
          text: "50y",
          resolution: "6M" as ResolutionString,
          description: "50 Years",
        },
        {
          text: "3y",
          resolution: "1W" as ResolutionString,
          description: "3 Years",
          title: "3yr",
        },
        {
          text: "8m",
          resolution: "1D" as ResolutionString,
          description: "8 Month",
        },
        {
          text: "3d",
          resolution: "5" as ResolutionString,
          description: "3 Days",
        },
        {
          text: "1000y",
          resolution: "1W" as ResolutionString,
          description: "All",
          title: "All",
        },
      ],
      theme: "light",
      overrides: {
        "mainSeriesProperties.style": 3,
        // "paneProperties.backgroundType": "solid", // enable gradient mode
        // "paneProperties.background": "#0f172a", // top color (deep navy)
        // "paneProperties.backgroundGradientStartColor": "#0f172a", // top
        // "paneProperties.backgroundGradientEndColor": "#1e3a8a", // bottom (indigo blue)
        // "paneProperties.backgroundGradientAngle": 90, // vertical gradient (0 = horizontal, 90 = vertical)

        // // optional extras for visibility
        // "paneProperties.vertGridProperties.color": "#334155",
        // "paneProperties.horzGridProperties.color": "#334155",
        // "scalesProperties.textColor": "#e2e8f0", // axis text (light gray/white)
      },
      height: 500
    };

    const tvWidget = new widget(widgetOptions);
    console.log("TradingView widget initialized.", tvWidget);

    tvWidget.onChartReady(() => {
      console.log("Chart has loaded!");

      // const priceScale = tvWidget
      //   .activeChart()
      //   .getPanes()[0]
      //   .getMainSourcePriceScale();

      // if (priceScale) {
      //   priceScale.setAutoScale(true);
      // }

      // tvWidget.headerReady().then(() => {
      //   const button = tvWidget.createButton();
      //   button.setAttribute("title", "Click to show a notification popup");
      //   button.classList.add("apply-common-tooltip");
      //   button.addEventListener("click", () =>
      //     tvWidget.showNoticeDialog({
      //       title: "Notification",
      //       body: "TradingView Charting Library API works correctly",
      //       callback: () => {
      //         console.log("Noticed!");
      //       },
      //     })
      //   );

      //   button.innerHTML = "Check API";
      // });
    });

    return () => {
      tvWidget.remove();
    };
  }, [symbol, theme, showChart, chart]); // Added showChart to dependencies

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
    // <>
    //   <header>
    //     <h1>TradingView Charting Library and Next.js Integration Example</h1>
    //   </header>
    //   <div ref={containerRef} />
    // </>
    <>
      <div
      style={{
        // height: "100%",
        width: "100%",
        transition: "all 0.3s ease-in-out",
        transform: showChart ? "scaleY(1)" : "scaleY(0)",
        transformOrigin: "top",
        // maxHeight: showChart ? "1000px" : "0",
        opacity: showChart ? 1 : 0,
        overflow: "hidden",
        visibility: showChart ? "visible" : "hidden",
        border: "1px solid",
        borderColor:
          theme === "dark"
            ? "rgba(46, 55, 71, 0.5)"
            : "rgba(209, 213, 219, 0.5)",
        borderRadius: "0.75rem",
      }}
      className={`relative bg-white dark:bg-charcoal-800 ${
        isLoading ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* Header with token logos + pair */}
      {(baseToken || quoteToken) && (
        <header className="flex w-full items-center justify-between gap-4 overflow-x-auto border-b border-gray-200 dark:border-charcoal-700 px-4 py-3">
          <div className="flex items-center gap-x-2">
            <div className="hidden -space-x-2 md:flex">
              {baseToken?.logoURI && (
                <span className="relative z-10">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img
                      src={
                      isPairInverted
                        ? quoteToken?.logoURI || "/fallback-token-icon.png"
                        : baseToken.logoURI || "/fallback-token-icon.png"
                      }
                      alt="base token"
                      className="object-cover w-full h-full"
                      width={28}
                      height={28}
                    />
                    </div>
                </span>
              )}
              {quoteToken?.logoURI && (
                <span className="relative z-0">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700">
                    <Image
                      src={
                        isPairInverted
                          ? baseToken?.logoURI || "/fallback-token-icon.png"
                          : quoteToken.logoURI || "/fallback-token-icon.png"
                      }
                      alt="quote token"
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  </div>
                </span>
              )}
            </div>
            <div className="flex gap-x-1 font-semibold">
              <span>
                {isPairInverted ? quoteToken?.symbol : baseToken?.symbol || "—"}
              </span>
              <span className="font-semibold text-gray-500">/</span>
              <span>
                {isPairInverted ? baseToken?.symbol : quoteToken?.symbol || "—"}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Market data row */}
      {showChart && (baseToken || quoteToken) && (
        <div className="flex w-full items-center justify-between gap-4 overflow-x-auto px-4 py-3">
          <div className="flex flex-row gap-x-6 overflow-x-auto w-full">
            {/* Price */}
            <div>
              <p className="text-xs text-gray-500 dark:text-charcoal-400 mb-1">
                Price
              </p>
              <div className="flex items-center gap-x-2 text-base font-bold">
                {isChartLoading ? (
                  <div className="h-4 w-12 bg-gray-200 dark:bg-charcoal-700 animate-pulse rounded"></div>
                ) : (
                  <>
                    <span className="text-gray-700 dark:text-gray-200">
                      {marketData?.price
                        ? formatNumber(Number(marketData.price))
                        : "$0"}{" "}
                      {quoteToken?.symbol}
                    </span>
                    <span
                      className={
                        marketData?.priceChange24h &&
                        Number(marketData.priceChange24h) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {marketData?.priceChange24h
                        ? formatPercentage(Number(marketData.priceChange24h))
                        : "0.00%"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Volume */}
            <div>
              <p className="text-xs text-gray-500 dark:text-charcoal-400 mb-1">
                24h Vol
              </p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {marketData?.volume24h
                  ? formatNumber(Number(marketData.volume24h))
                  : "$0"}
              </p>
            </div>

            {/* Liquidity */}
            <div>
              <p className="text-xs text-gray-500 dark:text-charcoal-400 mb-1">
                Liquidity
              </p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {marketData?.liquidity
                  ? formatNumber(Number(marketData.liquidity))
                  : "$0"}
              </p>
            </div>

            {/* Mkt Cap */}
            <div>
              <p className="text-xs text-gray-500 dark:text-charcoal-400 mb-1">
                Mkt Cap
              </p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {marketData?.mcap
                  ? formatNumber(Number(marketData.mcap))
                  : "$0"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart container */}
      {showChart && (
        <div ref={containerRef} className="w-full h-[320px]" />
      )}

      {/* Loading overlay */}
      {isLoading && showChart && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-charcoal-800 bg-opacity-75 dark:bg-opacity-75 z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Footer attribution */}
      {showChart && (
        <div className="text-xs text-center py-2 text-gray-500 dark:text-gray-400">
          Charts provided by{" "}
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            TradingView
          </a>
        </div>
      )}
    </div>
    </>
  );
});

export default TradingViewChart;
