'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenInfo } from '@/types/token-info';
import { useGetBalance, useGetTokenAccounts } from '@/components/account/account-data-access';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { fetchTokenPrice } from '@/utils/token-utils';
import { NATIVE_MINT } from '@solana/spl-token';
import { SearchProvider } from './SearchContext';

// Define the types for our context
type SwapContextType = {
  // Token balances
  fromTokenBalance: string;
  toTokenBalance: string;
  fromTokenBalanceUsd: string | null;
  fromTokenDecimals: number;
  
  // Half and Max functionality
  setHalfAmount: () => void;
  setMaxAmount: () => void;
  
  // Current selected tokens
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
  
  // Amount being swapped
  amount: string;
  setAmount: (amount: string) => void;
  setFromToken: (token: TokenInfo) => void;
  setToToken: (token: TokenInfo) => void;
};

// Create the context with default values
const SwapContext = createContext<SwapContextType>({
  fromTokenBalance: '0',
  toTokenBalance: '0',
  fromTokenBalanceUsd: null,
  fromTokenDecimals: 9, // Default to SOL decimals
  
  setHalfAmount: () => {},
  setMaxAmount: () => {},
  
  fromToken: null,
  toToken: null,
  
  amount: '',
  setAmount: () => {},
  setFromToken: () => {},
  setToToken: () => {},
});

// Main provider that wraps all other providers
export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SearchProvider>
      <SwapProvider>{children}</SwapProvider>
    </SearchProvider>
  );
};

// Swap provider for token swap functionality
export const SwapProvider = ({ children }: { children: ReactNode }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const solBalance = useGetBalance({ address: wallet.publicKey });
  const tokenAccounts = useGetTokenAccounts({ address: wallet.publicKey });
  
  // State for the swap
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [fromTokenBalance, setFromTokenBalance] = useState('0');
  const [toTokenBalance, setToTokenBalance] = useState('0');
  const [fromTokenBalanceUsd, setFromTokenBalanceUsd] = useState<string | null>(null);
  const [fromTokenDecimals, setFromTokenDecimals] = useState(9); // Default to SOL decimals

  // Calculate the fromToken balance whenever relevant data changes
  useEffect(() => {
    const calculateFromTokenBalance = async () => {
      if (!fromToken || !wallet.publicKey) {
        setFromTokenBalance('0');
        setFromTokenBalanceUsd(null);
        return;
      }
      
      try {
        // Handle SOL balance
        if (fromToken.address === NATIVE_MINT.toString()) {
          if (solBalance.data !== undefined) {
            const balanceInSol = solBalance.data / LAMPORTS_PER_SOL;
            setFromTokenBalance(balanceInSol.toFixed(4));
            setFromTokenDecimals(9); // SOL has 9 decimals
            
            // Get USD price for SOL
            try {
              const priceData = await fetchTokenPrice(fromToken.address);
              if (priceData && priceData.price) {
                const balanceUsd = balanceInSol * priceData.price;
                setFromTokenBalanceUsd(balanceUsd.toFixed(2));
              }
            } catch (error) {
              console.error('Error fetching token price:', error);
              setFromTokenBalanceUsd(null);
            }
          }
        } else {
          // Handle other token balances
          const safeTokenAccounts = Array.isArray(tokenAccounts.data) ? tokenAccounts.data : [];
          const tokenAccount = safeTokenAccounts.find(
            (account) => account?.account?.data?.parsed?.info?.mint === fromToken.address
          );
          
          if (tokenAccount && tokenAccount.account?.data?.parsed?.info?.tokenAmount) {
            const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
            const balance = parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
            setFromTokenBalance(balance.toFixed(4));
            setFromTokenDecimals(tokenAmount.decimals);
            
            // Get USD price for token
            try {
              const priceData = await fetchTokenPrice(fromToken.address);
              if (priceData && priceData.price) {
                const balanceUsd = balance * priceData.price;
                setFromTokenBalanceUsd(balanceUsd.toFixed(2));
              }
            } catch (error) {
              console.error('Error fetching token price:', error);
              setFromTokenBalanceUsd(null);
            }
          } else {
            setFromTokenBalance('0');
            setFromTokenBalanceUsd(null);
          }
        }
      } catch (error) {
        console.error('Error calculating token balance:', error);
        setFromTokenBalance('0');
        setFromTokenBalanceUsd(null);
      }
    };
    
    calculateFromTokenBalance();
  }, [fromToken, wallet.publicKey, solBalance.data, tokenAccounts.data]);
  
  // Set half of the balance as the amount
  const setHalfAmount = useCallback(() => {
    if (fromTokenBalance && parseFloat(fromTokenBalance) > 0) {
      const halfBalance = (parseFloat(fromTokenBalance) / 2).toString();
      setAmount(halfBalance);
    }
  }, [fromTokenBalance]);
  
  // Set maximum available balance as the amount
  const setMaxAmount = useCallback(() => {
    if (fromTokenBalance && parseFloat(fromTokenBalance) > 0) {
      // If it's SOL, leave a small amount for gas fees
      if (fromToken?.address === NATIVE_MINT.toString()) {
        const maxAmount = Math.max(parseFloat(fromTokenBalance) - 0.01, 0);
        setAmount(maxAmount.toString());
      } else {
        setAmount(fromTokenBalance);
      }
    }
  }, [fromToken, fromTokenBalance]);
  
  // Create the context value
  const contextValue = {
    fromTokenBalance,
    toTokenBalance,
    fromTokenBalanceUsd,
    fromTokenDecimals,
    setHalfAmount,
    setMaxAmount,
    fromToken,
    toToken,
    amount,
    setAmount,
    setFromToken,
    setToToken,
  };

  return (
    <SwapContext.Provider value={contextValue}>
      {children}
    </SwapContext.Provider>
  );
};

// Custom hook to use the swap context
export const useSwapContext = () => useContext(SwapContext);
