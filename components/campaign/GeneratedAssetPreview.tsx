"use client";

import { Image as ImageIcon, Video, ExternalLink, X, Maximize2, Film } from "lucide-react";
import { useState } from "react";

interface GeneratedAssetPreviewProps {
  type: 'image' | 'video';
  url: string | null;
  prompt: string;
  model?: string;
  generatedAt?: string;
  isPlaceholder?: boolean;
  hue?: number;
}

export function GeneratedAssetPreview({
  type,
  url,
  prompt,
  model,
  generatedAt,
  isPlaceholder,
  hue = 220,
}: GeneratedAssetPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!url) {
    if (model?.includes('veo') && !url) {
       // Show processing state for video
       return (
         <div className="mt-3 space-y-2 animate-in fade-in duration-500">
           <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
             <div className="w-12 h-12 rounded-full border-2 border-t-blue-500 border-white/5 animate-spin" />
             <div className="text-center">
               <p className="text-xs font-bold text-white/70">Veo 3.1 is crafting your video...</p>
               <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Status: Processing Operation</p>
             </div>
           </div>
         </div>
       );
    }
    return null;
  }

  return (
    <div className="mt-3 space-y-2 animate-in fade-in duration-500">
      {/* Preview card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
        {type === 'image' ? (
          <>
            {(isPlaceholder && !url.startsWith('data:')) || url.startsWith('placeholder:') ? (
              <div
                className="w-full aspect-square flex flex-col items-center justify-center gap-3"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue}, 40%, 12%), hsl(${(hue + 40) % 360}, 50%, 18%), hsl(${hue}, 30%, 8%))`,
                }}
              >
                <ImageIcon className="w-10 h-10 text-white/20" />
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Google Imagen Preview</p>
                <p className="text-[8px] text-white/15 font-bold uppercase tracking-widest">Add GOOGLE_AI_API_KEY for real generation</p>
              </div>
            ) : (
              <img
                src={url}
                alt="Generated asset"
                className="w-full object-cover cursor-pointer"
                onClick={() => setExpanded(!expanded)}
              />
            )}
          </>
        ) : (
          <>
            {(isPlaceholder && !url.startsWith('data:')) || url.startsWith('placeholder:') ? (
              <div
                className="w-full aspect-[9/16] max-h-[300px] flex flex-col items-center justify-center gap-3"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue}, 40%, 12%), hsl(${(hue + 40) % 360}, 50%, 18%), hsl(${hue}, 30%, 8%))`,
                }}
              >
                <Film className="w-10 h-10 text-white/20" />
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Google Veo Preview</p>
                <p className="text-[8px] text-white/15 font-bold uppercase tracking-widest">Add GOOGLE_AI_API_KEY for real generation</p>
              </div>
            ) : (
              <video
                src={url}
                controls
                className="w-full max-h-[300px]"
              />
            )}
          </>
        )}

        {/* Overlay info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
              {type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
              {model || 'Google AI'}
            </span>
            {generatedAt && (
              <span className="text-[8px] text-white/30 ml-auto">
                {new Date(generatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded view (fullscreen modal) */}
      {expanded && url && (url.startsWith('data:') || url.startsWith('http')) && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setExpanded(false)}
          >
            <X className="w-5 h-5" />
          </button>
          {type === 'image' ? (
            <img src={url} alt="Generated asset full" className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" />
          ) : (
            <video src={url} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-2xl" />
          )}
        </div>
      )}
    </div>
  );
}
