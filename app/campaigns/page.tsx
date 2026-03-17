"use client";

import { Target, Play, Pause, RefreshCw, ChevronRight, LayoutList } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Engine</h2>
          <p className="text-white/40 text-sm mt-1">Monitor active narratives and content flows.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="h-11 px-6 rounded-2xl glass border border-white/10 font-bold flex items-center gap-2 hover:bg-white/5 transition-all text-sm">
             <Pause className="w-4 h-4" />
             Global Pause
           </button>
        </div>
      </div>

      {/* Active Campaign Detail */}
      <div className="glass border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-era-blue/20 to-transparent pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/3 space-y-6">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    ACTIVE NOW
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">Blue Night City</h3>
                  <p className="text-white/50 text-base leading-relaxed">Phase 1: Intellectual Introspection. Focus on the contrast between industrial noise and spiritual silence.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                     <p className="text-[10px] text-white/40 font-bold uppercase mb-1">CAMPAIGN DAY</p>
                     <p className="text-2xl font-black">03 <span className="text-xs text-white/20">/ 07</span></p>
                  </div>
                  <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                     <p className="text-[10px] text-white/40 font-bold uppercase mb-1">CONVERSION</p>
                     <p className="text-2xl font-black">4.2%</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 pt-4">
                  <button className="flex-1 h-12 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> REGENERATE
                  </button>
                  <button className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                    <Pause className="w-5 h-5" />
                  </button>
               </div>
            </div>

            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Content Flow Timeline</h4>
                   <LayoutList className="w-4 h-4 text-white/20" />
                </div>

                <div className="space-y-3">
                   {[
                     { day: 1, angle: "Atmospheric Teaser", status: "Completed", color: "bg-green-500" },
                     { day: 2, angle: "Lyric Fragment", status: "Completed", color: "bg-green-500" },
                     { day: 3, angle: "Emotional Hook", status: "Processing", color: "bg-yellow-500 animate-pulse" },
                     { day: 4, angle: "Cinematic Visual", status: "Upcoming", color: "bg-white/10" },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 group cursor-pointer">
                        <div className={`w-1.5 h-12 rounded-full ${item.color}`} />
                        <div className="flex-1 glass border border-white/5 rounded-2xl p-4 flex items-center justify-between group-hover:bg-white/5 transition-colors">
                           <div>
                              <p className="text-xs font-bold">{item.angle}</p>
                              <p className="text-[10px] text-white/30 uppercase font-black">Day 0{item.day} • {item.status}</p>
                           </div>
                           <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all" />
                        </div>
                     </div>
                   ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
