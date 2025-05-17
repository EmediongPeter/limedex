import {
  AccountInfo,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
} from "@solana/spl-token";
import { useCustomToasts } from "@/components/ui/Toast";
import { useToaster } from "react-hot-toast";

export function checkBalance(
  amount: string,
  solBalance: number | undefined,
  tokenAccounts:
    | {
        pubkey: PublicKey;
        account: AccountInfo<ParsedAccountData>;
      }[]
    | undefined[] = [],
  decimals: number,
  baseToken: PublicKey | string
): boolean | undefined {
  // Safely check inputs - return undefined for indeterminate state
  if (!amount || amount === "0" || !decimals) {
    return undefined;
  }

  if (solBalance === undefined || solBalance === null) {
    return undefined;
  }

  try {
    const isSolSwap = baseToken === NATIVE_MINT.toString();
    const MIN_SOL_FOR_GAS = 0.01 * LAMPORTS_PER_SOL;
    
    // Safely parse amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return undefined;
    }
    
    const amountInBaseUnits = parsedAmount * Math.pow(10, decimals);

    // Check for SOL gas fees
    if (solBalance < MIN_SOL_FOR_GAS) {
      return false;
    }

    // If swapping SOL, check SOL balance
    if (isSolSwap) {
      return solBalance >= amountInBaseUnits;
    } 
    
    // Otherwise, check token balance
    if (!Array.isArray(tokenAccounts) || tokenAccounts.length === 0) {
      return undefined;
    }
    
    const tokenAccount = tokenAccounts.find(
      (account) => account?.account?.data?.parsed?.info?.mint === baseToken
    );

    if (!tokenAccount || !tokenAccount.account?.data?.parsed?.info?.tokenAmount?.amount) {
      return undefined;
    }

    const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.amount;
    return parseFloat(tokenBalance) >= amountInBaseUnits;
  } catch (error) {
    console.error("Error in balance check:", error);
    return undefined;
  }
}
