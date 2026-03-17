"use client";

import { useEffect, useState } from "react";
import { Plus, Music2, Play, MoreHorizontal } from "lucide-react";
import { SongService } from "@/services/song-service";
import { Song, SongEra } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const eraColors: Record<SongEra, string> = {
  [SongEra.BLUE]: "bg-blue-500",
  [SongEra.YELLOW]: "bg-yellow-400",
  [SongEra.RED]: "bg-red-600",
  [SongEra.GREEN]: "bg-green-500",
  [SongEra.PURPLE]: "bg-purple-600",
  [SongEra.BLACK]: "bg-zinc-800",
  [SongEra.WHITE]: "bg-white",
  [SongEra.EIGHTIES]: "bg-pink-500",
  [SongEra.NINETIES]: "bg-orange-500",
  [SongEra.BALLADS]: "bg-cyan-500",
  [SongEra.UNPLUGGED]: "bg-amber-700",
  [SongEra.PRESENT]: "bg-zinc-400",
};

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filter, setFilter] = useState<SongEra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSongs() {
      try {
        setLoading(true);
        const data = await SongService.getAll();
        setSongs(data);
      } catch (err: any) {
        setError(err.message || "Failed to load songs");
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, []);

  const filteredSongs = filter ? songs.filter(s => s.era === filter) : songs;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Song Library</h2>
          <p className="text-white/40 text-sm mt-1">Manage your repertoire and start new campaigns.</p>
        </div>
        <button className="h-11 px-6 rounded-2xl bg-white text-zinc-950 text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all uppercase tracking-widest">
          <Plus className="w-5 h-5" />
          Import Music
        </button>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-xl glass border ${!filter ? 'border-white/40 bg-white/10' : 'border-white/5'} text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all`}
        >
          All Eras
        </button>
        {Object.values(SongEra).map((era) => (
          <button 
            key={era} 
            onClick={() => setFilter(era)}
            className={`px-4 py-2 rounded-xl glass border ${filter === era ? 'border-white/40 bg-white/10' : 'border-white/5'} text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap`}
          >
            <div className={`w-2 h-2 rounded-full ${eraColors[era]}`} />
            {era} Era
          </button>
        ))}
      </div>

      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSongs.map((song) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <div className="glass border border-white/5 rounded-3xl p-6 group hover:border-white/20 transition-all cursor-pointer">
                <div className="relative aspect-square rounded-2xl bg-white/5 mb-4 overflow-hidden flex items-center justify-center">
                   <Music2 className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform">
                       <Play className="w-5 h-5 fill-current" />
                     </div>
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="flex items-center justify-between">
                     <h4 className="font-bold text-sm truncate">{song.title}</h4>
                     <MoreHorizontal className="w-4 h-4 text-white/30" />
                   </div>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                     {song.era} Era {song.album ? `• ${song.album}` : ''}
                   </p>
                </div>
                
                <div className="mt-6 flex items-center gap-2">
                  <div className="flex-1 py-3 text-center rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest group-hover:bg-white group-hover:text-zinc-950 transition-all">
                    View & Campaign
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Music2} 
          title="No songs found" 
          description={filter ? `No songs found for the ${filter} era in your library.` : "Your library is currently empty. Import your first track to get started."}
          action={!filter ? { label: "Import Music", onClick: () => {} } : undefined}
        />
      )}
    </div>
  );
}

