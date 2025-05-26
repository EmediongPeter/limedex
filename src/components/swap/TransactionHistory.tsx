"use client";
import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Transaction {
  signature: string;
  timestamp: number;
  status: 'success' | 'failed';
  amount: string;
  fromToken: string;
  toToken: string;
  explorerUrl: string;
}

interface TransactionHistoryProps {
  className?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ className = '' }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) return;

      try {
        setLoading(true);
        // Fetch transaction signatures for the wallet
        const signatures = await connection.getSignaturesForAddress(
          publicKey,
          { limit: 10 } // Get last 10 transactions
        );

        // Map the signatures to a more useful format
        const txList = await Promise.all(
          signatures.map(async (sig) => {
            try {
              // Get transaction details
              const tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
              });

              // This is a simplified example - you'll need to parse the transaction
              // to get the actual token amounts and types based on your specific transaction structure
              return {
                signature: sig.signature,
                timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
                status: sig.err ? 'failed' : 'success',
                amount: '0', // You'll need to parse this from the transaction
                fromToken: 'SOL', // Parse from transaction
                toToken: 'USDC', // Parse from transaction
                explorerUrl: `https://explorer.solana.com/tx/${sig.signature}?cluster=mainnet-beta`,
              };
            } catch (err) {
              console.error('Error fetching transaction details:', err);
              return null;
            }
          })
        );

        setTransactions(txList.filter(Boolean) as Transaction[]);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [publicKey, connection]);

  const [isExpanded, setIsExpanded] = useState(true);

  if (!publicKey) {
    return null; // Don't show anything if wallet is not connected
  }


  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No transactions found
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`${className} bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
      >
        <span>Recent Transactions</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-100 dark:bg-slate-700 rounded-lg"></div>
            ))
          ) : error ? (
            <div className="text-center py-3 text-sm text-red-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-3 text-sm text-gray-500">No transactions found</div>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <a
                key={tx.signature}
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border border-gray-100 dark:border-slate-700"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      Swap {tx.amount} {tx.fromToken} → {tx.toToken}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {tx.status === 'success' ? '✓' : '✗'}
                    </div>
                    <ExternalLink className="ml-2 text-gray-400" size={14} />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
