import axios from "axios";
import {
  Bar,
  ResolutionString,
} from "public/static/charting_library/charting_library";

type DexRow = {
  Block?: { Time?: string };
  Trade?: {
    high?: number;
    low?: number;
    open?: number;
    close?: number;
  };
  volume?: number;
};

type GraphQLResp = {
  data?: {
    Solana?: {
      DEXTradeByTokens?: DexRow[];
    };
  };
};

const BITQUERY_HTTP =
  process.env.NEXT_PRIVATE_BITQUERY_HTTP ?? "https://streaming.bitquery.io/eap"; // GraphQL over HTTP
const BITQUERY_TOKEN = process.env.NEXT_PRIVATE_BITQUERY_API_KEY ?? "";

const TOKEN_DETAILS = `{
    Solana {
      DEXTradeByTokens(
        
        orderBy: {descendingByField: "Block_Timefield"}
        where: {
          Trade: { Currency: 
              { MintAddress: { is: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump" } },
              Side: {
                  Currency: { MintAddress: { is: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" } }
              }
          },
          
        },
      ) {
        Block {
          Timefield: Time(interval: {in: minutes, count: 1})
        }
        volume: sum(of: Trade_Amount)
        Trade {
          high: Price(maximum: Trade_Price)
          low: Price(minimum: Trade_Price)
          open: Price(minimum: Block_Slot)
          close: Price(maximum: Block_Slot)
        }
      }
    }
  }`;

const DEX_OHLC = `
query OHLC(
  $base: String!,
  $quote: String!,
) {
  Solana(dataset: archive) {
    DEXTradeByTokens(
      where: {
        Trade: {
          Currency: { MintAddress: { is: $base } },
          Side: { Currency: { MintAddress: { is: $quote } } }
        },
      },
      
      orderBy: {descendingByField: "Block_Timefield"}
    ) {
      Block {
        Timefield: Time(interval: {in: minutes, count: 1})
      }
      volume: sum(of: Trade_Amount)
      Trade {
        high: Price(maximum: Trade_Price)
        low: Price(minimum: Trade_Price)
        open: Price(minimum: Block_Slot)
        close: Price(maximum: Block_Slot)
      }
    }
  }
}
`;

function toMs(time: string | number | Date | undefined): number {
  if (!time) return 0;
  return new Date(time).getTime();
}

function resolutionToMs(resolution: string | number): number {
  if (typeof resolution === "number") return resolution * 60_000;

  const resMap: { [key: string]: number } = {
    "1": 60 * 1000, // 1 minute
    "5": 5 * 60 * 1000, // 5 minutes
    "15": 15 * 60 * 1000, // 15 minutes
    "30": 30 * 60 * 1000, // 30 minutes
    "60": 60 * 60 * 1000, // 1 hour
    "240": 4 * 60 * 60 * 1000, // 4 hours
    "1D": 24 * 60 * 60 * 1000, // 1 day
    "1W": 7 * 24 * 60 * 60 * 1000, // 1 week
    "1M": 30 * 24 * 60 * 60 * 1000, // 1 month
  };

  return resMap[resolution] || 60_000;
}

function aggregateToBars(
  rows: any[],
  getTs: (r: any) => number,
  getPrice: (r: any) => number,
  getVol?: (r: any) => number | undefined,
  bucketSizeMs: number = 60_000
) {
  const map = new Map<
    number,
    {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
    }
  >();

  for (const r of rows) {
    const ts = getTs(r);
    if (!ts) continue;
    const bucket = Math.floor(ts / bucketSizeMs) * bucketSizeMs;
    const price = getPrice(r);
    const vol = getVol ? getVol(r) : undefined;

    const curr = map.get(bucket);
    if (!curr) {
      map.set(bucket, {
        time: bucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: vol ?? 0,
      });
    } else {
      curr.high = Math.max(curr.high, price);
      curr.low = Math.min(curr.low, price);
      curr.close = price;
      if (typeof vol === "number") curr.volume = (curr.volume ?? 0) + vol;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

// NEW: extract both the old and the new response shapes
function extractBarsFromResponse(
  resp: any,
  resolution: string | number = 1
): Bar[] {
  // Old shape
  const tokens = resp?.data?.data?.Trading?.Tokens;
  if (Array.isArray(tokens)) {
    const bars = tokens.map((t: any) => {
      const blockTime =
        toMs(t?.Block?.Time) ||
        toMs(t?.Block?.Timestamp) ||
        toMs(t?.Interval?.Time?.End) ||
        toMs(t?.Interval?.Time?.Start);
      return {
        time: blockTime,
        open: t?.Price?.Ohlc?.Open ?? 0,
        high: t?.Price?.Ohlc?.High ?? 0,
        low: t?.Price?.Ohlc?.Low ?? 0,
        close: t?.Price?.Ohlc?.Close ?? 0,
        volume: t?.Volume?.Base ?? 0,
      };
    });
    return bars;
  }

  // New shape: data.Solana.DEXTradeByTokens[]
  const dex = resp?.data?.data?.Solana?.DEXTradeByTokens;
  if (Array.isArray(dex)) {
    const bucketMs = resolutionToMs(resolution);
    return aggregateToBars(
      dex,
      (d) => toMs(d?.Block?.Timefield),
      (d) => Number(d?.Trade?.close ?? 0), // Use close price as the main price
      (d) => Number(d?.volume ?? 0),
      bucketMs
    ) as Bar[];
  }

  return [];
}

// Replace your mapping sites with extractBarsFromResponse
export async function fetchHistoricalData(params: {
  baseMint: string;
  quoteMint: string;
  resolution: ResolutionString | string;
  from: number; // seconds
  to: number; // seconds
}): Promise<Bar[]> {
  const { baseMint, quoteMint, resolution, from, to } = params;
  const requiredBars = 360;

  try {
    const response = await axios.post<GraphQLResp>(
      BITQUERY_HTTP,
      {
        query: DEX_OHLC,
        variables: {
          base: baseMint,
          quote: quoteMint,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_TOKEN}`,
        },
      }
    );

    // const response = await axios.post<GraphQLResp>("/api/bitquery", {
    //   baseMint,
    //   quoteMint,
    // });

    console.log({ response });
    let bars: Bar[] = extractBarsFromResponse(response, resolution);

    bars.sort((a, b) => a.time - b.time);
    // bars = bars.filter(bar => bar.time >= from);

    // // Fill gaps if needed
    if (bars.length > 0) {
      bars = fillGaps(bars, resolution);
    }

    if (bars.length < requiredBars) {
      const earliestTime = bars[0]?.time || from;
      const missingBarsCount = requiredBars - bars.length;
      for (let i = 1; i <= missingBarsCount; i++) {
        bars.unshift({
          time: earliestTime - i * 60_000,
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          volume: 0,
        });
      }
    }

    console.log(`Fetched ${bars.length} bars for resolution ${resolution}`);

    return bars;
  } catch (err) {
    console.error("Error fetching historical data:", err);
    throw err;
  }
}

function fillGaps(bars: Bar[], resolution: string): Bar[] {
  if (bars.length === 0) return bars;

  const bucketSizeMs = resolutionToMs(resolution);
  const filledBars: Bar[] = [];

  for (let i = 0; i < bars.length - 1; i++) {
    filledBars.push(bars[i]);

    const currentTime = bars[i].time;
    const nextTime = bars[i + 1].time;
    const gap = nextTime - currentTime;

    // If gap is more than 2 buckets, fill it
    if (gap > bucketSizeMs * 2) {
      const missingBars = Math.floor(gap / bucketSizeMs) - 1;
      const lastPrice = bars[i].close;

      for (let j = 1; j <= missingBars; j++) {
        const gapTime = currentTime + j * bucketSizeMs;
        filledBars.push({
          time: gapTime,
          open: lastPrice,
          high: lastPrice,
          low: lastPrice,
          close: lastPrice,
          volume: 0,
        });
      }
    }
  }

  filledBars.push(bars[bars.length - 1]);
  return filledBars;
}
