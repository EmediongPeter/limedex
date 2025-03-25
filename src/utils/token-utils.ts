import { TokenInfo } from "@/types/token-info";
import useSWR from "swr";


import { Jupiter, RouteInfo } from '@jup-ag/core';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// async function executeSwapWithFee() {
//   // 1. Initialize
//   const connection = new Connection('https://api.devnet.solana.com');
//   const userKeypair = Keypair.fromSecretKey(Uint8Array.from([/* Your private key */]));
//   const jupiter = await Jupiter.load({ connection, user: userKeypair, cluster: 'devnet' });

//   // 2. Swap params
//   const inputToken = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
//   const outputToken = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
//   const inputAmount = 1 * 1e9; // 1 SOL
//   const slippage = 1; // 1%

//   // 3. Get best route
//   const routes = await jupiter.computeRoutes({
//     inputMint: inputToken,
//     outputMint: outputToken,
//     inputAmount,
//     slippage,
//   });
//   const bestRoute = routes.routesInfos[0];

//   // 4. Calculate fee (0.15%)
//   const PLATFORM_FEE_PCT = 0.15;
//   const platformFee = Math.floor((bestRoute.outAmount * PLATFORM_FEE_PCT) / 100);
//   const feeOutput = {
//     outputMint: outputToken,
//     recipient: new PublicKey('YOUR_TREASURY_WALLET'),
//     amount: platformFee,
//   };

//   // 5. Execute swap
//   const { execute } = await jupiter.exchange({
//     routeInfo: bestRoute,
//     userPublicKey: userKeypair.publicKey,
//     feeOutput,
//   });

//   const result = await execute();
//   console.log(`Swap successful: https://solscan.io/tx/${result.txid}`);
// }


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
      // `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true`
      // `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`,
      `https://ultra-api.jup.ag/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`
      
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
