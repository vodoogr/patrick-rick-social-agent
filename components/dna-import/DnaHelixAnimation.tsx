"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function DnaHelixAnimation({ message = "Parsing Creative DNA..." }: { message?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Render a CSS-based cinematic DNA helix 
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-12 select-none animate-in fade-in duration-1000">
      <div className="relative w-32 h-64 perspective-1000">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-1 flex justify-between items-center preserve-3d"
            style={{
              top: `${(i / 11) * 100}%`,
              animation: `dna-spin 3s linear infinite`,
              animationDelay: `-${i * 0.2}s`,
            }}
          >
            {/* Left Node */}
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            
            {/* Connecting Bridge */}
            <div className="flex-1 h-[1px] bg-gradient-to-r from-blue-500/50 via-white/20 to-purple-500/50" />
            
            {/* Right Node */}
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
          </div>
        ))}
        
        <style jsx>{`
          @keyframes dna-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
          .perspective-1000 {
            perspective: 1000px;
          }
          .preserve-3d {
            transform-style: preserve-3d;
          }
        `}</style>
      </div>
      
      <div className="flex items-center gap-3 text-white/60 font-medium tracking-[0.2em] text-sm uppercase">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        {message}
      </div>
    </div>
  );
}
