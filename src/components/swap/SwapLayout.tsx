"use client";

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTheme } from 'next-themes';
import TradingViewChart from '../chart/TradingViewChart';
import { TokenInfo } from '@/types/token-info';

interface SwapLayoutProps {
  children: React.ReactNode; // This will be the SwapCard
  fromToken?: TokenInfo;
  toToken?: TokenInfo;
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
  const [showChart, setShowChart] = useState(true); // Default to showing chart
  const [showHistory, setShowHistory] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');
  const [marketStats, setMarketStats] = useState({
    price: '0.00',
    change: '0.00%',
    volume: '$0.00',
    liquidity: '$0.00',
    marketCap: '$0.00',
  });
  
  useEffect(() => {
    if (!toToken) return;
    const symbol = getTradingViewSymbol(toToken);
    if (!symbol) return;
    const timer = setTimeout(() => {
      setCurrentSymbol(symbol);
      
      // In a real app, this would fetch actual market data
      // For demo, we're setting mock data
      setMarketStats({
        price: toToken.symbol === 'SOL' ? '170.3' : '1.00',
        change: '-4.57%',
        volume: '$6.2B',
        liquidity: '$109M',
        marketCap: '$89B',
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [toToken, getTradingViewSymbol]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-0 flex flex-col items-center min-h-[80vh]">
      {/* Layout row for chart and swap card */}
      <div className={`w-full flex flex-col-reverse lg:flex-row gap-8 items-stretch justify-center transition-all pb-4 ${showChart && currentSymbol ? '' : 'min-h-[500px]'}`}>
        {/* Chart Section */}
        {showChart && currentSymbol && (
          <div className="w-full lg:w-[60%] flex flex-col justify-between">
            <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
              {/* Token Pair Header */}
              <div className="flex w-full items-center justify-between gap-4 overflow-x-auto border-b border-gray-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-x-2">
                  <div className="hidden -space-x-2 md:flex">
                    {fromToken?.logoURI && (
                      <span className="relative z-10">
                        <img src={fromToken.logoURI} alt={fromToken.symbol} width="28" height="28" 
                             className="rounded-full object-cover border border-gray-200 dark:border-slate-700" style={{ maxWidth: '28px', maxHeight: '28px' }} />
                      </span>
                    )}
                    {toToken?.logoURI && (
                      <span className="relative z-0">
                        <img src={toToken.logoURI} alt={toToken.symbol} width="28" height="28" 
                             className="rounded-full object-cover border border-gray-200 dark:border-slate-700" style={{ maxWidth: '28px', maxHeight: '28px' }} />
                      </span>
                    )}
                  </div>
                  <div className="flex gap-x-1 font-semibold">
                    <span>{fromToken?.symbol || 'Token'}</span>
                    <span className="font-semibold text-gray-500">/</span>
                    <span>{toToken?.symbol || 'Token'}</span>
                  </div>
                </div>
                <div className="flex flex-row gap-x-6">
                  <div className="flex flex-col gap-y-1 whitespace-nowrap">
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400">24h Vol</p>
                    <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">{marketStats.volume}</p>
                  </div>
                  <div className="flex flex-col gap-y-1 whitespace-nowrap">
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Liquidity</p>
                    <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">{marketStats.liquidity}</p>
                  </div>
                </div>
              </div>
              {/* Market Stats Row */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-3 px-4">
                <div>
                  <div className="flex items-center gap-x-1 mb-1 font-semibold">
                    <span>{marketStats.price}</span>
                    <span className="text-sm">{toToken?.symbol}</span>
                  </div>
                  <div className="flex items-center text-xs font-medium text-red-500">
                    {marketStats.change}
                  </div>
                </div>
                <div className="flex flex-row gap-x-6">
                  <div className="flex flex-col gap-y-1 whitespace-nowrap">
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Mkt Cap</p>
                    <p className="flex h-[14px] items-center text-sm font-semibold !leading-none text-gray-600 dark:text-gray-300">{marketStats.marketCap}</p>
                  </div>
                </div>
              </div>
              {/* TradingView Chart */}
              <div className="relative flex-1 overflow-hidden transition-all" style={{ minHeight: '200px', height: isMobile ? '350px' : '500px' }}>
                <TradingViewChart
                  symbol={currentSymbol}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}
        {/* Swap Card Section */}
        <div className={`flex flex-col w-full ${showChart && currentSymbol ? 'lg:w-[40%]' : 'lg:w-[60%]'} items-center justify-center transition-all`}>
          <div className="w-full max-w-lg mx-auto">
            {children}
          </div>
        </div>
      </div>
      {/* Controls centered below both sections */}
      <div className="flex flex-row items-center justify-center gap-4 mt-4 mb-2">
        <button
          type="button"
          onClick={() => setShowChart(prev => !prev)}
          className={`flex items-center gap-1 rounded-full p-2 px-4 text-xs font-medium transition-colors ${showChart 
            ? 'bg-primary/10 text-primary' 
            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
        >
          <span>{showChart ? 'Hide Chart' : 'Show Chart'}</span>
          {showChart && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M5.37147 2.54616C5.57468 2.51612 5.7843 2.5 6.00021 2.5C8.55271 2.5 10.2276 4.75242 10.7903 5.64341C10.8585 5.75125 10.8925 5.80517 10.9116 5.88834C10.9259 5.9508 10.9259 6.04933 10.9115 6.11179C10.8925 6.19495 10.8582 6.24923 10.7896 6.35778C10.6397 6.59507 10.4111 6.92855 10.1082 7.29023M3.36216 3.35752C2.28112 4.09085 1.54723 5.10969 1.21055 5.64264C1.14214 5.75094 1.10794 5.80508 1.08887 5.88824C1.07455 5.9507 1.07454 6.04922 1.08886 6.11168C1.10791 6.19484 1.14197 6.24876 1.21007 6.35659C1.77277 7.24758 3.44771 9.5 6.00021 9.5C7.02941 9.5 7.91594 9.1338 8.64441 8.6383M1.50021 1.5L10.5002 10.5M4.93955 4.93934C4.6681 5.21079 4.50021 5.58579 4.50021 6C4.50021 6.82843 5.17178 7.5 6.00021 7.5C6.41442 7.5 6.78942 7.33211 7.06087 7.06066" 
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button
          type="button"
          disabled
          title="Coming soon!"
          className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-slate-800 p-2 px-4 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 opacity-75"
        >
          <span>Show History</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
            <path d="M5.0002 6.69446C5.0002 6.14217 5.44791 5.69446 6.0002 5.69446C6.55248 5.69446 7.0002 6.14217 7.0002 6.69446C7.0002 7.24674 6.55248 7.69446 6.0002 7.69446C5.44791 7.69446 5.0002 7.24674 5.0002 6.69446Z" 
                  fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SwapLayout;
