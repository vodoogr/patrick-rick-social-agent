import React from 'react';

export const LoadingState = ({ message = 'Loading cinematic experience...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-4 border-t-red-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-zinc-400 font-medium animate-pulse">{message}</p>
    </div>
  );
};
