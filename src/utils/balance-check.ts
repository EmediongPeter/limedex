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
) {
  const toast = useToaster();
  const { showErrorToast } = useCustomToasts(toast);
  // const [result, setResult] = useState<BalanceCheckResult>({
  //   hasSufficientBalance: false,
  //   error: undefined,
  //   isLoading: false,
  // });
  // console.log(amount, solBalance, decimals, baseToken);
  if (!amount || !solBalance || !decimals) return ;

  const isSolSwap = baseToken === NATIVE_MINT.toString();
  const MIN_SOL_FOR_GAS = 0.01 * LAMPORTS_PER_SOL;
  const amountInBaseUnits = isNaN( parseFloat(amount)) ? 0 :  parseFloat(amount) * Math.pow(10, decimals);
  // }, [amount, decimals]);

  if (solBalance < MIN_SOL_FOR_GAS) {
    // setResult({
    //   hasSufficientBalance: false,
    //   error: "Insufficient SOL for gas fees",
    //   isLoading: false,
    // });
    showErrorToast("Insufficient SOL for this swap");
    return false;
  }

  if (isSolSwap) {
    const sufficient = solBalance >= amountInBaseUnits;
    // setResult({
    //   hasSufficientBalance: sufficient,
    //   error: sufficient ? undefined : "Insufficient SOL balance",
    //   isLoading: false,
    // });
    return sufficient;
  } else  {
    
  }

  if (tokenAccounts) {
    if (!tokenAccounts) {
      console.error("Not found token");
    }
    const tokenAccount = tokenAccounts.find(
      (account) => account?.account.data.parsed.info.mint === baseToken
    );

    const tokenBalance =
      tokenAccount?.account.data.parsed.info.tokenAmount.amount;
    const sufficient = parseFloat(tokenBalance) >= amountInBaseUnits;

    // setResult({
    //   hasSufficientBalance: sufficient,
    //   error: sufficient ? undefined : "Insufficient token balance",
    //   isLoading: false,
    // });
    return sufficient
  }

  // return true;
}
