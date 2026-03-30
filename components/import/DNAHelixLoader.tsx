"use client";

import { useEffect, useRef } from "react";

interface DNAHelixLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function DNAHelixLoader({ size = 'md', text = "Analyzing...", className = "" }: DNAHelixLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Dimensions based on size
    const sizes = {
      sm: { width: 100, height: 60, radius: 2, spacing: 8, amplitude: 15 },
      md: { width: 200, height: 100, radius: 3, spacing: 12, amplitude: 30 },
      lg: { width: 300, height: 150, radius: 4, spacing: 16, amplitude: 50 },
    };
    const s = sizes[size];
    
    // Support high DPI displays
    const dpr = window.devicePixelRatio || 1;
    // Set actual size in memory (scaled to account for extra pixel density).
    canvas.width = s.width * dpr;
    canvas.height = s.height * dpr;

    // Normalize coordinate system to use css pixels.
    ctx.scale(dpr, dpr);
    // Set display size (css pixels).
    canvas.style.width = `${s.width}px`;
    canvas.style.height = `${s.height}px`;

    const draw = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, s.width, s.height);
        
        const centerY = s.height / 2;
        const numPoints = Math.floor(s.width / s.spacing);
        const speed = 0.05;
        const phaseShift = Math.PI;

        for (let i = 0; i < numPoints; i++) {
            const x = i * s.spacing;
            
            // Calculate y positions for both strands using sine waves offset by phaseShift
            const y1 = centerY + Math.sin(time + i * 0.4) * s.amplitude;
            const y2 = centerY + Math.sin(time + i * 0.4 + phaseShift) * s.amplitude;

            // Draw connecting lines with opacity based on z-depth (simulated by distance between strands)
            // Lines are brighter when strands are further apart
            const distance = Math.abs(y1 - y2);
            const opacity = distance / (s.amplitude * 2);
            
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw nodes
            ctx.beginPath();
            ctx.arc(x, y1, s.radius, 0, Math.PI * 2);
            // Front strand has solid cyan flow, back is dimmer
            if (y1 > centerY) {
              ctx.fillStyle = `rgba(167, 139, 250, ${0.4 + opacity * 0.6})`; // Purple glow
            } else {
              ctx.fillStyle = `rgba(167, 139, 250, ${0.2 + opacity * 0.3})`;
            }
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y2, s.radius, 0, Math.PI * 2);
            if (y2 > centerY) {
               ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + opacity * 0.6})`; // Blue glow
            } else {
               ctx.fillStyle = `rgba(56, 189, 248, ${0.2 + opacity * 0.3})`;
            }
            ctx.fill();
        }

        time += speed;
        animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size]);

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full mix-blend-screen" />
          <canvas ref={canvasRef} className="relative z-10" />
      </div>
      {text && (
        <p className="text-sm font-bold uppercase tracking-widest text-white/50 animate-pulse">
            {text}
        </p>
      )}
    </div>
  );
}
