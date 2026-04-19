"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md mx-4 glass border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/40" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
          isDanger ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          {isDanger
            ? <AlertTriangle className="w-6 h-6 text-red-400" />
            : <Info className="w-6 h-6 text-blue-400" />
          }
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line mb-8">{message}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-bold text-white/60 hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all shadow-lg ${
              isDanger
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-500/20'
                : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
