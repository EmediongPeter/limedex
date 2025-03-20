import { TokenInfo } from "@/types/token-info";
import useSWR from "swr";

// utils/token-utils.ts
export const fetchTokenPrice = async (mintAddress: string) => {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/price?ids=${mintAddress}&vsToken=USDC`
  );
  if (!response.ok) throw new Error("Failed to fetch token price");
  const data = await response.json();
  return data.data[mintAddress].price;
};

export const fetchSwapQuote = async (
  inputMint: string,
  outputMint: string,
  amount: string
) => {
  try {
    const swapRoutes = await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true`
      // `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`,
      // `https://ultra-api.jup.ag/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`
      // `https://ultra-api.jup.ag/order?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1`
    );
    const response = await swapRoutes.json();
    console.log({ response });
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch swap quote");
  }
};

// const { data: tokens = [], isLoading, error } =

export const fetchTokens = async (query: string) => {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  console.log(query);

  try {
    const {
      data: tokens = [],
      isLoading,
      error,
    } = useSWR<TokenInfo[]>(
      `https://fe-api.jup.ag/api/v1/tokens/search?query=${encodeURIComponent(
        query
      )}`,
      fetcher,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
      }
    );
    console.log({ tokensInfo: tokens });
    return tokens;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch swap quote");
  }
};
