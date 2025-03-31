import { TokenInfo } from "@/types/token-info";
import useSWR from "swr";

import { Jupiter, RouteInfo, signTransaction } from "@jup-ag/core";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction,  } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetcher } from "./fetcher";
import axios from "axios";
import { VersionedTransaction } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
// import {  } from "@solana/web3.js";
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
      // `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true&platformFeeBps=${Number(
      //   10
      // )}&feeAccount=BgofVtUQk5WfWq2iHS8RHDvWs9BYcNEWrrxxvPBFUft4&onlyDirectRoutes=true`
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true&platformFeeBps=${Number(10)}&feeAccount=BgofVtUQk5WfWq2iHS8RHDvWs9BYcNEWrrxxvPBFUft4&onlyDirectRoutes=${true}`,
      // `https://ultra-api.jup.ag/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`
    );

    // const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
    //   params: {
    //     inputMint,
    //     outputMint,
    //     amount,
    //     slippageBps: 50,
    //     restrictIntermediateTokens:true,
    //     platformFeeBps:10,
    //     feeAccount: "BgofVtUQk5WfWq2iHS8RHDvWs9BYcNEWrrxxvPBFUft4",
    //     onlyDirectRoutes: true
    //   }
    // });

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

export const signAndExecuteSwap = async (
  wallet: any,
  quoteResponse: any,
  connection: Connection
) => {  
  if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
    console.error("Wallet not connected");
    return;
  }

  console.log({ n: wallet.connected, wl: wallet?.publicKey.toString(), quoteResponse });
  const response = await axios.post("https://quote-api.jup.ag/v6/swap", {
    quoteResponse,
    userPublicKey: wallet?.publicKey.toString(),
    wrapAndUnwrapSol: true,
    platformFeeBps: 15, // Your fee percentage (0.5%)
    feeAccount: "BgofVtUQk5WfWq2iHS8RHDvWs9BYcNEWrrxxvPBFUft4",
    // onlyDirectRoutes: true,
    // asLegacyTransaction: true,
    // network: 'devnet', 
  });
  // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
  //   programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  // });
  
  // console.log({tokenAccounts});

  try {
    const swapTransactionBuffer = Buffer.from(
      response.data.swapTransaction,
      "base64"
    );
    // const transaction = VersionedTransaction.deserialize(swapTransactionBuffer);
    
   let transaction: VersionedTransaction | Transaction;

   try {
    transaction = Transaction.from(swapTransactionBuffer);  // Legacy transaction
    console.log("✅ Legacy Transaction");
} catch (error) {
    console.log("🔄 Trying VersionedTransaction...");
    transaction = VersionedTransaction.deserialize(swapTransactionBuffer);
    console.log("✅ Versioned Transaction");
}

    // const simulation = await connection.simulateTransaction(transaction, {
    //   commitment: "processed",
    // });
    
    // if (simulation.value.err) {
    //   console.error("Transaction simulation failed:", simulation.value.err);
    //   return;
    // }
    
    const signedTransaction = await wallet.signTransaction(transaction);
    // console.log(signedTransaction instanceof VersionedTransaction)
    // const simulation = await connection.simulateTransaction(signedTransaction, { commitment: "processed" });
// sendAndConfirmTransaction(connect)
    // await sendandcon
    const latestBlockHash = (await connection.getLatestBlockhashAndContext('finalized')).value;
   
    const rawTransaction = signedTransaction.serialize();

    
    // if (simulation.value.err) {
    //   throw new Error('Simulate failed: ' + simulation.value.err);
    // }
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });
    const confirmation = await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
      },
      "finalized"
    );

    console.log({confirmation});

    console.log(`https://solscan.io/tx/${txid}`);
  } catch (error: any) {
    console.error("Error sigining and sending transactioin");
    console.error(error);
    console.log({ errror: error.message });
  }
};
