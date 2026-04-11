"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Copy,
  Save,
  Loader2,
  Check,
  Sparkles
} from "lucide-react";

interface CampaignActionButtonsProps {
  type: 'image' | 'video';
  prompt: string;
  onGenerate: () => Promise<void>;
  onSaveAsset?: () => Promise<void>;
  isGenerating?: boolean;
  isGenerated?: boolean;
  isSaved?: boolean;
}

export function CampaignActionButtons({
  type,
  prompt,
  onGenerate,
  onSaveAsset,
  isGenerating = false,
  isGenerated = false,
  isSaved = false,
}: CampaignActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onSaveAsset) return;
    setSaving(true);
    try {
      await onSaveAsset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
          isGenerated
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-blue-600/30'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isGenerating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isGenerated ? (
          <Check className="w-3 h-3" />
        ) : type === 'image' ? (
          <ImageIcon className="w-3 h-3" />
        ) : (
          <Video className="w-3 h-3" />
        )}
        {isGenerating
          ? 'Generating...'
          : isGenerated
            ? 'Generated'
            : type === 'image'
              ? 'Generate Image'
              : 'Generate Video'}
      </button>

      {/* Copy Prompt */}
      <button
        onClick={handleCopy}
        disabled={!prompt}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
          copied
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
        } disabled:opacity-40`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied!' : 'Copy Prompt'}
      </button>

      {/* Save as Asset */}
      {onSaveAsset && isGenerated && (
        <button
          onClick={handleSave}
          disabled={saving || isSaved}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
            isSaved
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
          } disabled:opacity-40`}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isSaved ? (
            <Check className="w-3 h-3" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save Asset'}
        </button>
      )}
    </div>
  );
}
