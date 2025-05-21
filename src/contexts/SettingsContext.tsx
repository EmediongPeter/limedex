"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

type SettingsContextType = {
  slippage: number; // in basis points (e.g., 50 = 0.5%)
  setSlippage: (value: number) => void;
  slippageInput: string;
  setSlippageInput: (value: string) => void;
};

const defaultSlippage = 50; // 0.5% default slippage

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [slippage, setSlippage] = useState<number>(defaultSlippage);
  const [slippageInput, setSlippageInput] = useState<string>('0.5');

  return (
    <SettingsContext.Provider
      value={{
        slippage,
        setSlippage,
        slippageInput,
        setSlippageInput,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
