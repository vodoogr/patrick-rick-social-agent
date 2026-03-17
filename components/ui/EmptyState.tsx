import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-vh-[400px] border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-xs mx-auto mb-8">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-white text-zinc-950 rounded-full font-bold hover:bg-zinc-200 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
