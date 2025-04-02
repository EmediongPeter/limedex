
export interface TokenInfo {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI?: string;
    icon?: string;
    tokens?: any;
}
  
export interface QuoteResponse {
  inAmount: string;
  outAmount: string;
  inputMint: string;
  outputMint: string;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  slippageBps: number;
}