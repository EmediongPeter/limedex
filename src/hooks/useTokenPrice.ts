import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTokenPrice } from "@/utils/token-utils";

interface TokenPriceState {
  price: number | null;
  loading: boolean;
  error: string | null;
}

export const useTokenPrice = (tokenAddress: string): TokenPriceState => {
  const [state, setState] = useState<TokenPriceState>({
    price: null,
    loading: true,
    error: null,
  });

  const fetchPrice = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await fetchTokenPrice(tokenAddress);
      setState({ price: data.price, loading: false, error: null });
    } catch (error) {
      console.error("Failed to fetch token price:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch price",
      }));
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (tokenAddress) {
      fetchPrice();
    }
  }, [tokenAddress, fetchPrice]);

  return useMemo(
    () => ({
      price: state.price,
      loading: state.loading,
      error: state.error,
    }),
    [state]
  );
};
