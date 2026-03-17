"use client";

import { Plus, Music2, ExternalLink, Play, MoreHorizontal } from "lucide-react";

const songs = [
  { id: 1, title: "Blue Night City", era: "Blue", album: "Midnight Chronicles", status: "Active Campaign" },
  { id: 2, title: "Golden Rebirth", era: "Yellow", album: "Light Seekers", status: "Ready" },
  { id: 3, title: "Nocturnal Passion", era: "Red", album: "Inner Fire", status: "Ready" },
  { id: 4, title: "Spiritual Balance", era: "Green", album: "Harmonics", status: "Draft" },
];

const eras = [
  { name: "Blue", color: "bg-era-blue" },
  { name: "Yellow", color: "bg-era-yellow" },
  { name: "Red", color: "bg-era-red" },
  { name: "Green", color: "bg-era-green" },
];

export default function SongsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Song Library</h2>
          <p className="text-white/40 text-sm mt-1">Manage your repertoire and start new campaigns.</p>
        </div>
        <button className="h-11 px-6 rounded-2xl bg-white text-black font-bold flex items-center gap-2 hover:bg-white/90 transition-all">
          <Plus className="w-5 h-5" />
          Import Music
        </button>
      </div>

      <div className="flex items-center gap-2 pb-2">
        {eras.map((era) => (
          <button key={era.name} className="px-4 py-2 rounded-xl glass border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${era.color}`} />
            {era.name} Era
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {songs.map((song) => (
          <div key={song.id} className="glass border border-white/5 rounded-3xl p-6 group hover:border-white/20 transition-all cursor-pointer">
            <div className="relative aspect-square rounded-2xl bg-white/5 mb-4 overflow-hidden flex items-center justify-center">
               <Music2 className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform">
                   <Play className="w-5 h-5 fill-current" />
                 </button>
               </div>
            </div>
            <div className="space-y-1">
               <div className="flex items-center justify-between">
                 <h4 className="font-bold text-sm truncate">{song.title}</h4>
                 <MoreHorizontal className="w-4 h-4 text-white/30" />
               </div>
               <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{song.era} Era • {song.album}</p>
            </div>
            
            <div className="mt-6 flex items-center gap-2">
              <button className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all">
                {song.status === 'Active Campaign' ? 'View Campaign' : 'Start Campaign'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
