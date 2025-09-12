import { NextResponse } from "next/server";
import axios from "axios";

const BITQUERY_HTTP =
  process.env.NEXT_PRIVATE_BITQUERY_HTTP ??
  "https://streaming.bitquery.io/graphql";
const BITQUERY_TOKEN = process.env.NEXT_PRIVATE_BITQUERY_API_KEY ?? "";

export async function POST(req: Request) {
  try {
    const { baseMint, quoteMint } = await req.json();

    const query = `
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
}`;

    console.log("Fetching historical data for:", BITQUERY_HTTP);
    const response = await axios.post(
      BITQUERY_HTTP,
      { query, variables: { base: baseMint, quote: quoteMint } },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_TOKEN}`,
        },
        timeout: 60000,
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Error fetching historical data:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
