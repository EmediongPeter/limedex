"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";

interface TradingViewChartProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
}

/**
 * TradingViewChart component using TradingView's recommended embedding approach
 * This uses their advanced chart widget which is more stable and feature-rich
 */
const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  width = "100%",
  height = 400,
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
    // TradingView expects format like "COINBASE:SOLUSDC"
    const formattedSymbol = symbol.includes(":") ? symbol : `COINBASE:${symbol}`;

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
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: "https://www.tradingview.com",
        studies: [
          "MASimple@tv-basicstudies"
        ],
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
          "header_settings",
          "header_compare",
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
          "use_localstorage_for_settings",
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
      <div className="flex items-center justify-center h-80 text-gray-500 bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-700">
        {error}
      </div>
    );
  }

  // Main chart UI
  return (
    <div 
      ref={containerRef}
      style={{ width, height, minHeight: 320 }}
      className="relative rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
    >
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