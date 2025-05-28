export interface TokenInfo {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI?: string;
    icon?: string;
    tokens?: any;
    volumeUsd?: string; // 24h volume in USD
    price?: number; // Current price in USD
    priceChangePercentage?: number; // 24h price change percentage
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