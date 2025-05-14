import React from 'react';
import { CheckCircle, AlertCircle, Loader, ExternalLink, X } from 'lucide-react';

// Toast components for different states
export const ToastSuccess = ({ signature, onClose }: {signature: string, onClose: () => void}) => (
  <div className="flex items-center p-4 bg-[#1E2B33] border-l-4 border-emerald-500 rounded-lg shadow-lg max-w-md animate-in slide-in-from-top">
    <div className="flex-shrink-0">
      <CheckCircle className="h-6 w-6 text-emerald-500" />
    </div>
    <div className="ml-3 flex-grow">
      <p className="text-sm font-medium text-emerald-500">Success</p>
      <p className="mt-1 text-sm text-gray-200">Transaction sent successfully</p>
      {signature && (
        <a 
          href={`https://explorer.solana.com/tx/${signature}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View transaction <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      )}
    </div>
    <button onClick={onClose} className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-200">
      <X className="h-5 w-5" />
    </button>
  </div>
);

export const ToastError = ({ message, onClose }: {message: string, onClose: () => void}) => (
  <div className="flex items-center p-4 bg-[#1E2B33] border-l-4 border-red-500 rounded-lg shadow-lg max-w-md animate-in slide-in-from-top">
    <div className="flex-shrink-0">
      <AlertCircle className="h-6 w-6 text-red-500" />
    </div>
    <div className="ml-3 flex-grow">
      <p className="text-sm font-medium text-red-500">Error</p>
      <p className="mt-1 text-sm text-gray-200">{message || "Transaction failed"}</p>
      <p className="mt-2 text-xs text-red-400">
        Please try again or contact support if the issue persists
      </p>
    </div>
    <button onClick={onClose} className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-200">
      <X className="h-5 w-5" />
    </button>
  </div>
);

export const ToastLoading = ({ message, onClose }: {message: string, onClose: () => void}) => (
  <div className="flex items-center p-4 bg-[#1E2B33] border-l-4 border-blue-500 rounded-lg shadow-lg max-w-md animate-in slide-in-from-top">
    <div className="flex-shrink-0">
      <Loader className="h-6 w-6 text-blue-500 animate-spin" />
    </div>
    <div className="ml-3 flex-grow">
      <p className="text-sm font-medium text-blue-500">Processing</p>
      <p className="mt-1 text-sm text-gray-200">{message || "Waiting for wallet confirmation"}</p>
      <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
        <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
    <button onClick={onClose} className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-200">
      <X className="h-5 w-5" />
    </button>
  </div>
);

// Usage examples
export const useCustomToasts = (toast: any) => {
  const showSuccessToast = (signature:any) => {
    toast.dismiss('transaction-loading');
    toast.custom(
      (t:any) => <ToastSuccess signature={signature} onClose={() => toast.remove(t.id)} />,
      {
        duration: 10000,
        id: 'transaction-success',
      }
    );
  };

  const showErrorToast = (message:string) => {
    toast.dismiss('transaction-loading');
    toast.custom(
      (t: { id: any; }) => <ToastError message={message} onClose={() => toast.remove(t.id)} />,
      {
        duration: 10000,
        id: 'transaction-error',
      }
    );
  };

  const showLoadingToast = (message: string) => {
    toast.custom(
      (t: { id: any; }) => <ToastLoading message={message} onClose={() => toast.remove(t.id)} />,
      {
        duration: 60000,
        id: 'transaction-loading',
      }
    );
  };

  return {
    showSuccessToast,
    showErrorToast,
    showLoadingToast
  };
};
