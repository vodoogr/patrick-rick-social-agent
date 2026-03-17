import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ error, onRetry }: { error: string; onRetry?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-950/20 border border-red-900/30 rounded-2xl">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-bold text-red-100 mb-2">Something went wrong</h3>
      <p className="text-red-300 text-sm max-w-md mb-6">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-sm font-bold transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
