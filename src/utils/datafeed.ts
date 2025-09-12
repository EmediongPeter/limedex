import { TokenInfo } from "@/types/token-info";
import { fetchHistoricalData } from "./histOHLC";
import { subscribeToWebSocket } from "./subscribeOHLC";
import {
  LibrarySymbolInfo,
  ResolutionString,
  PeriodParams,
  HistoryCallback,
  DatafeedErrorCallback,
  DatafeedConfiguration,
  OnReadyCallback,
  SearchSymbolsCallback,
  ResolveCallback,
  SubscribeBarsCallback,
} from "public/static/charting_library/datafeed-api";

// --- Types ---
interface Exchange {
  value: string;
  name: string;
  desc: string;
}

interface SymbolType {
  name: string;
  value: string;
}

interface SymbolItem {
  symbol: string;
  ticker: string;
  description: string;
  exchange: string;
  type: string;
}

// --- Configuration ---
const configurationData: DatafeedConfiguration = {
  supported_resolutions: [
    "1",
    "5",
    "15",
    "30",
    "60",
    "1D",
    "1W",
    "1M",
  ] as ResolutionString[],
  // exchanges: [
  //   { value: "Solana", name: "Solana", desc: "Solana Blockchain" },
  // ],
  // symbols_types: [{ name: "crypto", value: "crypto" }],
};

// --- Datafeed Implementation ---
const subscribers: { [key: string]: any } = {};

const datafeed = (baseMint: TokenInfo, quoteMint: TokenInfo) => {
return {
  onReady: (callback: OnReadyCallback): void => {
    console.log("[onReady]: Method call");
    setTimeout(() => callback(configurationData), 0);
  },

  searchSymbols: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback
  ): void => {
    console.log("[searchSymbols]: Method call");
    // Return empty array for now - you can implement symbol search later
    onResult([]);
  },

  resolveSymbol: (
    symbolName: string,
    onResolve: ResolveCallback,
    onError: DatafeedErrorCallback,
    extension?: any
  ): void => {
    console.log("[resolveSymbol]: Method call", symbolName);

    const displaySymbol = `${baseMint}/${quoteMint}`; // fallback to mints as symbol name

    const symbolInfo: LibrarySymbolInfo = {
      ticker: symbolName,
      name: symbolName,
      description: symbolName,
      type: "crypto",
      session: "24x7",
      timezone: "Etc/UTC",
      exchange: "Solana",
      listed_exchange: "Solana",
      minmov: 1,
      pricescale: 10 ** quoteMint.decimals,
      has_intraday: true,
      intraday_multipliers: ["1", "5", "15", "30", "60"],
      has_empty_bars: false,
      has_weekly_and_monthly: false,
      supported_resolutions: [
        "1",
        "5",
        "15",
        "30",
        "60",
        "1D",
        "1W",
        "1M",
      ] as ResolutionString[],
      volume_precision: 2,
      visible_plots_set: "ohlcv",
      format: "price",
      data_status: "streaming",
      // countBack: 30,
      // supports_timescale_marks: true,
      // supported_intervals: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    };

    onResolve(symbolInfo);
  },

  getBars: async (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: DatafeedErrorCallback
  ): Promise<void> => {
    const { from, to } = periodParams;
    console.log("[getBars]: Method call", symbolInfo, resolution, from, to);

    try {
      const bars = await fetchHistoricalData({
        baseMint: baseMint.address,
        quoteMint: quoteMint.address,
        resolution,
        from: from * 1000, // seconds
        to: to * 1000, // seconds
      });

      if (!bars.length) {
        onResult([], { noData: true });
        return;
      }
      onResult(bars, { noData: false });
    } catch (e: any) {
      console.error("[getBars] error", e);
      onError(e?.message ?? "getBars failed");
    }
  },

  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ): void => {
    console.log(
      "[subscribeBars]: Method call with subscriberUID:",
      subscriberUID
    );
    setTimeout(() => {
      subscribeToWebSocket({
      baseMint: baseMint.address,
      quoteMint: quoteMint.address,
      resolution: String(resolution),
      onRealtimeCallback: onTick,
      subscriberUID: subscriberUID,
      });
    }, 10000); // 10 seconds delay
  },

  unsubscribeBars: (subscriberUID: string): void => {
    console.log(
      "[unsubscribeBars]: Method call with subscriberUID:",
      subscriberUID
    );
    // Implement unsubscribe logic here
    delete subscribers[subscriberUID];
  },
  }
};

export default datafeed;
