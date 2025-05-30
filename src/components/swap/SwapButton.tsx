'use client';
import React from 'react';
import Button from '../ui/Button';

const Spinner = ({ className = "" }) => (
  <svg
    className={`animate-spin h-5 w-5 text-white ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface SwapButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  walletConnected?: boolean;
  hasSufficientBalance?: boolean | undefined;
  balanceError?: string;
}

const SwapButton: React.FC<SwapButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  walletConnected = false,
  hasSufficientBalance,
  balanceError,
}) => {
  // Safely handle the console log and avoid null/undefined errors
  const safeBalance = hasSufficientBalance === undefined ? undefined : !!hasSufficientBalance;
  
  const getButtonText = () => {
    if (loading) return "Processing...";
    if (!walletConnected) return "Connect Wallet";
    if (hasSufficientBalance === false) return balanceError || "Insufficient Balance";
    if (hasSufficientBalance === undefined) return "Enter amount"
    return "Swap";
  };
  
  return (
    <Button
      variant="primary"
      className={`
        w-full py-3 sm:py-4 mt-4 text-base font-semibold rounded-xl transition-all duration-300
        ${disabled ? 'opacity-60 cursor-not-allowed bg-opacity-80' : 'hover:bg-opacity-90'}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Spinner className="mr-2" />
          {getButtonText()}
        </span>
      ) : (
        getButtonText()
      )}
    </Button>
  );
};

export default SwapButton;