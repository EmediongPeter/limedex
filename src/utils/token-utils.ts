import { TokenInfo } from "@/types/token-info";
import useSWR from "swr";
import {
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID, // Standard SPL Token program
  TOKEN_2022_PROGRAM_ID, // For Token-2022 tokens
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { fetcher } from "./fetcher";
import axios from "axios";
import { VersionedTransaction } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useNotificationToast } from "@/components/ui/ui-layout";
import toast from "react-hot-toast";
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
    `https://api.jup.ag/price/v2?ids=${mintAddress}`
  );
  if (!response.ok) throw new Error("Failed to fetch token price");
  const data = await response.json();
  console.log(data);
  return data.data[mintAddress];
};

export const fetchSwapQuote = async (
  inputMint: string,
  outputMint: string,
  amount: string
) => {
  try {
    const swapRoutes = await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&restrictIntermediateTokens=true&platformFeeBps=${Number(
        15
      )}&onlyDirectRoutes=true`
      // `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true&platformFeeBps=${Number(10)}&feeAccount=BgofVtUQk5WfWq2iHS8RHDvWs9BYcNEWrrxxvPBFUft4&onlyDirectRoutes=${true}`,
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

const wait = (time: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

async function ensureFeeAccountExists(
  connection: Connection,
  wallet: WalletContextState, // From wallet adapter
  mint: PublicKey,
  feeAccountOwner: PublicKey,
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID
): Promise<PublicKey> {
  console.log({ wallet, w: wallet.signTransaction });
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const feeAccount = await getAssociatedTokenAddress(
    mint,
    feeAccountOwner,
    false,
    tokenProgram
  );

  try {
    const _accInfo = await getAccount(
      connection,
      feeAccount,
      undefined,
      tokenProgram
    );
    return feeAccount;
  } catch (error) {
    const createIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      feeAccount,
      feeAccountOwner,
      mint,
      tokenProgram
    );

    const tx = new Transaction().add(createIx);
    tx.feePayer = wallet.publicKey;

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // Sign and send
    const signedTx = await wallet.signTransaction(tx);
    const rawTransaction = signedTx.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
    });

    // Confirm
    await connection.confirmTransaction({
      signature: txid,
      blockhash,
      lastValidBlockHeight: (await connection.getBlockHeight()) + 150,
    });
    return feeAccount;
  }
}

export const signAndExxecuteSwap = async (
  wallet: any,
  quoteResponse: any,
  connection: Connection
) => {
  if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
    console.error("Wallet not connected");
    return;
  }
  // 1. Determine token program (check your token)
  const outputMint = new PublicKey(quoteResponse.outputMint);
  const tokenProgram = TOKEN_PROGRAM_ID; // Default to standard

  // For Token-2022 tokens you would use:
  // const tokenProgram = TOKEN_2022_PROGRAM_ID;

  // 2. Your platform's fee account owner key
  const feeAccountOwner = new PublicKey(
    "H57TwQHeaFxiKz1cGArtEkG6xTYvwXida7Mf358KSr8N"
  );
  const feeAccount = await ensureFeeAccountExists(
    connection,
    wallet.publicKey, // Payer
    outputMint,
    feeAccountOwner,
    tokenProgram
  );
  console.log({
    n: wallet.connected,
    wl: wallet?.publicKey.toString(),
    con: connection.rpcEndpoint,
  });
  const response = await axios.post("https://api.jup.ag/swap/v1/swap", {
    quoteResponse,
    userPublicKey: wallet?.publicKey.toString(),
    wrapAndUnwrapSol: true,
    platformFeeBps: 15,
    feeAccount: feeAccount.toString(),
    // tokenProgram: tokenProgram.toString() // Your fee percentage (0.5%)
    // feeAccount: "GQqS2np5FTfzuzaG3fjJGjPie3GjDWz9UfibNEemnnC3",
    // tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    // onlyDirectRoutes: true,
    // asLegacyTransaction: true,
    // network: 'devnet',
  });
  // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
  //   programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  // });

  // console.log({response});

  try {
    const swapTransactionBuffer = Buffer.from(
      response.data.swapTransaction,
      "base64"
    );
    // const transaction = VersionedTransaction.deserialize(swapTransactionBuffer);

    let transaction: VersionedTransaction | Transaction;

    try {
      transaction = VersionedTransaction.deserialize(swapTransactionBuffer);
      // transaction = Transaction.from(swapTransactionBuffer);  // Legacy transaction
      // console.log("✅ Legacy Transaction");
    } catch (error) {
      console.error("Error deserializing transaction", error);
      throw new Error("Failed to deserialize transaction");
      console.log("🔄 Trying VersionedTransaction...");
      console.log("✅ Versioned Transaction");
    }

    // const simulation = await connection.simulateTransaction(transaction, {
    //   commitment: "processed",
    // });

    // if (simulation.value.err) {
    //   console.error("Transaction simulation failed:", simulation.value.err);
    //   return;
    // }
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet.publicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );
    // const signedTransaction = await wallet.signTransaction(transaction);

    // console.log(tokenAccounts);
    const simulation = await connection.simulateTransaction(transaction, {
      commitment: "processed",
      replaceRecentBlockhash: true,
      sigVerify: false,
    });

    // Check if simulation was successful
    if (simulation.value.err) {
      console.error("Transaction simulation failed:", simulation.value.err);
      console.log({ v: simulation.value });
      // return;
    }

    console.log("Simulation successful. Estimated fee:", simulation.value);

    const signedTransaction = await wallet.signTransaction(transaction);
    // await wallet.signTransaction(transaction);

    // console.log(signedTransaction instanceof VersionedTransaction)
    // const simulation = await connection.simulateTransaction(signedTransaction, { commitment: "processed" });
    // sendAndConfirmTransaction(connect)
    // await sendandcon

    console.log({ signedTransaction });
    const latestBlockHash = await connection.getLatestBlockhash();
    // const latestBlockHash = (
    //   await connection.getLatestBlockhashAndContext("finalized")
    // ).value;

    const rawTransaction = signedTransaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
      preflightCommitment: "confirmed",
    });
    // if (simulation.value.err) {
    //   throw new Error('Simulate failed: ' + simulation.value.err);
    // }
    const controller = new AbortController();
    const abortableResender = async () => {
      while (true) {
        await wait(2000);
        if (controller.signal.aborted) return;
        try {
          await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2,
            preflightCommitment: "confirmed",
          });
        } catch (e) {
          console.warn("Failed to resend", e);
        }
      }
    };

    console.log({ txid });
    try {
      abortableResender();

      await Promise.race([
        connection.confirmTransaction(
          {
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid,
            abortSignal: controller.signal,
          },
          "confirmed"
        ),
        new Promise(async (resolve) => {
          while (!controller.signal.aborted) {
            await wait(2000);
            const status = await connection.getSignatureStatus(txid);
            if (status?.value?.confirmationStatus === "confirmed") {
              resolve(status);
            }
          }
        }),
      ]);
    } catch (e) {
      console.error({ retryError: e });
    }

    // const confirmation = await c
    // const confirmation = await connection.confirmTransaction(
    //   {
    //     blockhash: latestBlockHash.blockhash,
    //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //     signature: txid,
    //   },
    //   "finalized"
    // );

    // console.log({ confirmation });

    console.log(`https://solscan.io/tx/${txid}`);
  } catch (error: any) {
    console.error("Error sigining and sending transactioin");
    console.error(error);
    console.log({ errror: error.message });
  }
};

export const signAndExecuteSwap = async (
  wallet: any,
  quoteResponse: any,
  connection: Connection,
  maxRetries = 3
) => {
  // const notificationToast = useNotificationToast();
  if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  let attempt = 0;
  let lastError: Error | unknown | null = null;

  const outputMint = new PublicKey(quoteResponse.outputMint);
  const tokenProgram = TOKEN_PROGRAM_ID;

  while (attempt < maxRetries) {
    attempt++;
    try {
      // 1. Get fresh blockhash for each attempt
      const latestBlockHash = await connection.getLatestBlockhash();

      const feeAccountOwner = new PublicKey(
        "H57TwQHeaFxiKz1cGArtEkG6xTYvwXida7Mf358KSr8N"
      );
      const feeAccount = await ensureFeeAccountExists(
        connection,
        wallet, // Payer
        outputMint,
        feeAccountOwner,
        tokenProgram
      );

      console.log({feeAccountOwner: feeAccountOwner.toString(), feeAccount:feeAccount.toString()})
      // 2. Get fresh swap transaction (important for retries)
      const response = await axios.post("https://api.jup.ag/swap/v1/swap", {
        quoteResponse,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        // onlyDirectRoutes: true,
        // asLegacyTransaction: true,
        // network: "devnet",
        feeAccount: feeAccount.toString()

        // Include other parameters
      });

      const swapTransaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.swapTransaction, "base64")
      );

      const simulation = await connection.simulateTransaction(swapTransaction, {
        commitment: "processed",
        replaceRecentBlockhash: true,
        sigVerify: false,
      });

      // Check if simulation was successful
      if (simulation.value.err) {
        console.error("Transaction simulation failed:", simulation.value.err);
        console.log({ v: simulation.value });
        throw new Error("SimulationError: network overloaded");
      }

      console.log("Simulation successful. Estimated fee:", simulation.value);

      // notificationToast();
      // 3. Sign with fresh blockhash
      const signedTx = await wallet.signTransaction(swapTransaction);
      // 4. Send with skipPreflight=false for better reliability
      const txid = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 2,
      });

      console.log({ txid });

      // 5. Enhanced confirmation with timeout
      const result = await connection.confirmTransaction(
        {
          signature: txid,
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        },
        "confirmed"
      );

      console.log({ result });

      if (result.value.err) {
        throw new Error(`Transaction failed: ${result.value.err}`);
      } else {
        // toast.remove("transaction-loading");
        console.log('')
      }

      return txid; // Success case
    } catch (error) {
      // toast.remove("transaction-loading");
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);

      // Specific handling for blockheight exceeded
      if (error instanceof TransactionExpiredBlockheightExceededError) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      // For other errors, decide whether to retry
      if (shouldRetryError(error)) {
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("Max retries exceeded");
};

// Helper function to determine retryable errors
function shouldRetryError(error: any): boolean {
  return (
    error instanceof TransactionExpiredBlockheightExceededError ||
    error.message.includes("Blockhash not found") ||
    error.message.includes("was not confirmed")
  );
}
/**
 * import { createJupiterApiClient } from '@jup-ag/api';

const jupiterQuoteApi = createJupiterApiClient(config); // config is optional
Now, you can call methods provided by the API client to interact with Jupiter's API. For example:

jupiterQuoteApi.quoteGet({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "100000000",
    slippageBps: 100,
})
 */
