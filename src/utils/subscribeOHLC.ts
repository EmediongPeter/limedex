// bitquery-socket.ts
import { createClient, Client, SubscribePayload, Sink } from "graphql-ws";
import {
  Bar,
  ResolutionString,
} from "public/static/charting_library/charting_library";

const BITQUERY_WS =
  process.env.NEXT_PRIVATE_BITQUERY_WS ?? "wss://streaming.bitquery.io/eap";
const BITQUERY_TOKEN = process.env.NEXT_PUBLIC_BITQUERY_API_KEY ?? "";

// So11111111111111111111111111111111111111112 6ft9XJZX7wYEH1aywspW5TiXDcshGc2W2SqBHN9SLAEJ

// --- GraphQL Subscription Query ---
const subscriptionQuery = `
subscription OHLC (
  $base: String!,
) {
  Trading {
    Tokens(
      where: {
        Token: {
          Network: {is: "Solana"},
          Address: {is: $base}
        },
        Interval: {Time: {Duration: {eq: 60}}}
      }
    ) {
      Block { Time }
      Price { Ohlc { Open High Low Close } }
      Volume { Base }
    }
  }
}
`;

// --- Types from Bitquery Response ---
interface BitqueryOhlc {
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface BitqueryBlock {
  Time: string; // ISO date string
}

interface BitqueryVolume {
  Base: number;
}

interface BitqueryToken {
  Block: BitqueryBlock;
  Price: { Ohlc: BitqueryOhlc };
  Volume: BitqueryVolume;
}

interface BitqueryTrading {
  Tokens: BitqueryToken[];
}

interface BitqueryResponse {
  data?: {
    Trading: BitqueryTrading;
  };
}

// --- Client instance ---
let client: Client | null = null;

// --- Subscribe function ---
export function subscribeToWebSocket(params: {
  baseMint: string;
  quoteMint: string; // kept for parity; not used by this stream
  resolution: ResolutionString | string;
  onRealtimeCallback: (bar: Bar) => void;
  subscriberUID: string;
}): void {
  const { baseMint, resolution, onRealtimeCallback, subscriberUID } = params;

  const url = `${BITQUERY_WS}?token=${encodeURIComponent(BITQUERY_TOKEN)}`;
  console.log({ url });
  client = createClient({ url });

  const bucketMs = resToMs(resolution);
  let lastBucket = -1;
  let current: Bar | null = null;

  const onNext: Sink<BitqueryResponse>["next"] = (result: any) => {
    console.log({ result });
    const t = result.data?.Trading?.Tokens?.[0];
    if (!t) return;

    const ts = new Date(t.Block.Time).getTime();
    const price = t.Price.Ohlc.Close ?? t.Price.Ohlc.Open ?? 0;
    const vol = t.Volume.Base ?? 0;
    const bucket = Math.floor(ts / bucketMs) * bucketMs;

    if (current == null || bucket > lastBucket) {
      // new candle
      if (current) onRealtimeCallback(current); // finalize previous
      current = {
        time: bucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: vol,
      };
      lastBucket = bucket;
    } else {
      // update current candle
      current.high = Math.max(current.high, price);
      current.low = Math.min(current.low, price);
      current.close = price;
      current.volume = (current.volume ?? 0) + vol;
    }

    // push current snapshot (TradingView mutates last bar)
    onRealtimeCallback(current);
  };

  const payload: SubscribePayload = {
    query: subscriptionQuery,
    variables: { base: baseMint },
  };
  client.subscribe(payload, {
    next: onNext,
    error: (e: any) => console.error("[Bitquery WS error]:", e),
    complete: () => {},
  });
}

function resToMs(res: string | number): number {
  if (typeof res === "number") return res * 60_000;
  const r = String(res).toUpperCase();
  if (r.endsWith("D")) return (parseInt(r) || 1) * 1440 * 60_000;
  if (r.endsWith("W")) return (parseInt(r) || 1) * 10080 * 60_000;
  if (r.endsWith("M")) return (parseInt(r) || 1) * 43200 * 60_000;
  const n = parseInt(r, 10);
  return (isNaN(n) ? 1 : n) * 60_000;
}

// --- Unsubscribe function ---
export function unsubscribeFromWebSocket(): void {
  if (client) {
    client.dispose();
    client = null;
  }
}
