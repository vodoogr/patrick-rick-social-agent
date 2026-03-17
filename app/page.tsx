"use client";

import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight,
  MoreVertical,
  Instagram,
  Youtube,
  Music2
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 w-32 h-32 bg-era-blue/20 blur-3xl rounded-full group-hover:bg-era-blue/30 transition-all duration-700" />
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">ACTIVE CAMPAIGN</p>
           <h3 className="text-3xl font-bold mb-1">Blue Night City</h3>
           <p className="text-sm text-white/60 mb-6 italic">"A journey through silence."</p>
           <div className="flex items-center justify-between mt-auto">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold">
                72% COMPLETE
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/30" />
           </div>
        </div>

        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 w-32 h-32 bg-era-yellow/10 blur-3xl rounded-full group-hover:bg-era-yellow/20 transition-all duration-700" />
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">NEXT SCHEDULED</p>
           <h3 className="text-xl font-bold mb-1">Lyric Fragment</h3>
           <p className="text-xs text-white/60 mb-6">Today • 10:00 AM</p>
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                 <Instagram className="w-4 h-4 text-white/40" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                 <Youtube className="w-4 h-4 text-white/40" />
              </div>
           </div>
        </div>

        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 w-32 h-32 bg-era-red/10 blur-3xl rounded-full group-hover:bg-era-red/20 transition-all duration-700" />
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">TOTAL REACH</p>
           <h3 className="text-3xl font-bold mb-1">428.5K</h3>
           <p className="text-sm text-green-400 font-bold flex items-center gap-1">
             <TrendingUp className="w-4 h-4" /> +12.4%
           </p>
           <div className="h-12 w-full mt-4 flex items-end gap-1">
              {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rotation Timeline */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold tracking-tight">Creative Rotation</h4>
              <button className="text-xs text-white/40 hover:text-white transition-colors">View All</button>
           </div>
           
           <div className="space-y-4">
              {[
                { day: 1, name: "Atmospheric Teaser", status: "published", time: "2 days ago" },
                { day: 2, name: "Lyric Fragment", status: "published", time: "1 day ago" },
                { day: 3, name: "Emotional Hook", status: "queued", time: "Scheduled Today" },
                { day: 4, name: "Cinematic Visual", status: "upcoming", time: "Mar 18" },
                { day: 5, name: "Era Storytelling", status: "upcoming", time: "Mar 19" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 group hover:translate-x-1 transition-transform cursor-pointer">
                  <div className="w-12 text-center">
                    <p className="text-[10px] text-white/30 font-bold tracking-tighter">DAY</p>
                    <p className="text-lg font-bold">{item.day}</p>
                  </div>
                  <div className="flex-1 glass border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-[10px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </p>
                    </div>
                    {item.status === 'published' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500/50" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/10" />
                    )}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
           <div className="glass border border-white/5 rounded-3xl p-6">
              <h4 className="text-sm font-bold mb-6">Discovery Queue</h4>
              <div className="space-y-4">
                 {[1, 2, 3].map((item) => (
                   <div key={item} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 group cursor-pointer hover:bg-white/10 transition-colors">
                     <div className="w-12 h-12 rounded-xl bg-era-blue/20 flex items-center justify-center overflow-hidden">
                        <Music2 className="w-5 h-5 text-white/40" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">New Track: Echoes</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Pre-Production</p>
                     </div>
                     <button className="text-white/20 group-hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                Import from Spotify
              </button>
           </div>

           <div className="glass border border-white/5 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-era-red/10 to-transparent pointer-events-none" />
             <h4 className="text-sm font-bold mb-4">Platform Health</h4>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-white/50">TikTok API</span>
                   <span className="text-green-500 font-bold">STABLE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-white/50">Instagram Graph</span>
                   <span className="text-green-500 font-bold">STABLE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-white/50">YouTube Data</span>
                   <span className="text-yellow-500 font-bold">SLOW</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
