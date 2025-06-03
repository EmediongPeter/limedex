import { TokenInfo } from '@/types/token-info';

const API_BASE_URL = 'https://datapi.jup.ag/v1';

interface ApiToken {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  usdPrice?: number;
  stats24h?: {
    priceChange: number;
    buyVolume: number;
    sellVolume: number;
  };
}

function mapToTokenInfo(token: ApiToken): TokenInfo {
  return {
    address: token.id,
    chainId: 101, // Solana mainnet
    decimals: token.decimals,
    name: token.name,
    symbol: token.symbol,
    logoURI: token.icon,
    price: token.usdPrice,
    priceChangePercentage: token.stats24h?.priceChange,
    volumeUsd: token.stats24h ? 
      (token.stats24h.buyVolume + token.stats24h.sellVolume).toString() : '0',
  };
}

export const tokenService = {
  async searchTokens(query: string): Promise<TokenInfo[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/assets/search?query=${encodeURIComponent(query)}&sortBy=verified`
      );
      const data = await response.json();
      return Array.isArray(data) ? data.map(mapToTokenInfo) : [];
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  },

  async getTrendingTokens(): Promise<TokenInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/toptrending/24h`);
      const data = await response.json();
      return Array.isArray(data) ? data.map(mapToTokenInfo) : [];
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return [];
    }
  },

  async getTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
    if (tokenAddresses.length === 0) return {};
    
    try {
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${tokenAddresses.join(',')}`
      );
      const data = await response.json();
      
      // Map the response to a simple address -> price mapping
      const prices: Record<string, number> = {};
      if (data?.data) {
        Object.entries(data.data).forEach(([address, priceData]) => {
          prices[address] = (priceData as any)?.price || 0;
        });
      }
      
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }
};
