"use client";

import { useEffect, useState } from "react";
import { Disc3, Music2, Plus, ChevronDown, Check, Filter } from "lucide-react";
import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { ProfileService } from "@/services/profile-service";
import { AssetService } from "@/services/asset-service";
import { Album, SongEra } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

const eraColors: Record<SongEra, string> = {
  [SongEra.BLUE]: "from-blue-600/30",
  [SongEra.YELLOW]: "from-yellow-400/30",
  [SongEra.RED]: "from-red-600/30",
  [SongEra.GREEN]: "from-green-500/30",
  [SongEra.PURPLE]: "from-purple-600/30",
  [SongEra.BLACK]: "from-zinc-700/30",
  [SongEra.WHITE]: "from-zinc-300/20",
  [SongEra.EIGHTIES]: "from-pink-500/30",
  [SongEra.NINETIES]: "from-orange-500/30",
  [SongEra.BALLADS]: "from-cyan-500/30",
  [SongEra.UNPLUGGED]: "from-amber-700/30",
  [SongEra.PRESENT]: "from-zinc-400/30",
};

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [eraFilter, setEraFilter] = useState<SongEra | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        setLoading(true);
        const data = eraFilter
          ? await AlbumService.search("", eraFilter)
          : await AlbumService.getAll();
        setAlbums(data);
      } catch (err) {
        console.error("Error loading albums:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, [eraFilter]);

  const handleCreateExample = async () => {
    try {
      setLoading(true);

      // 0. Get current profile to avoid RLS violation
      const profile = await ProfileService.getCurrent();
      if (!profile) throw new Error("Could not find active profile. Please login again.");

      // 1. Create album
      const album = await AlbumService.create({
        owner_id: profile.id,
        title: "The Sin Collection",
        slug: "the-sin-collection-" + Date.now(),
        era: SongEra.RED,
        release_year: 2024,
        description: "A collection of tracks exploring human desire and red-era intensity.",
        creative_dna: {
          narrative_summary: "The exploration of heat, pulse, and impulse.",
          canonical_phrase: "Some fires are softer when they know your name."
        }
      } as any);

      // 2. Link a song (try to find 'Warmth of Sin')
      const songs = await SongService.search("Warmth");
      if (songs.length > 0) {
        await SongService.update(songs[0].id, { 
          album_id: album.id,
          track_number: 1 
        } as any);
      }

      // 3. Refresh
      const data = await AlbumService.getAll();
      setAlbums(data);
    } catch (err) {
      console.error("Error creating example album:", err);
      alert("Failed to create example album. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Albums</h2>
          <p className="text-white/40 text-sm mt-1">Browse the complete album collection.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Era Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              <Filter className="w-4 h-4 text-white/30" />
              {eraFilter ? `${eraFilter} Era` : "All Eras"}
              <ChevronDown className="w-3 h-3 text-white/30" />
            </button>
            {showDropdown && (
              <div className="absolute top-full mt-2 right-0 z-50 w-48 glass border border-white/10 rounded-2xl p-2 space-y-1 shadow-2xl">
                <button
                  onClick={() => { setEraFilter(null); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  All Eras {!eraFilter && <Check className="w-3 h-3 text-green-500" />}
                </button>
                {Object.values(SongEra).map(era => (
                  <button
                    key={era}
                    onClick={() => { setEraFilter(era); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between capitalize"
                  >
                    {era} Era {eraFilter === era && <Check className="w-3 h-3 text-green-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map(album => (
            <Link key={album.id} href={`/albums/${album.id}`}>
              <div className="glass border border-white/5 rounded-3xl overflow-hidden group hover:border-white/20 transition-all cursor-pointer">
                <div className={`relative aspect-[4/3] bg-gradient-to-br ${eraColors[album.era] || 'from-zinc-800/30'} to-transparent flex items-center justify-center overflow-hidden`}>
                  {album.cover_path ? (
                    <img
                      src={album.cover_path.startsWith('http') ? album.cover_path : AssetService.getPublicUrl(album.cover_path)}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Disc3 className="w-16 h-16 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {album.era} Era
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-bold tracking-tight truncate">{album.title}</h3>
                  <p className="text-xs text-white/40 line-clamp-2">{album.description || "No description yet."}</p>
                  <div className="flex items-center gap-3 pt-2">
                    {album.release_year && (
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{album.release_year}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Disc3 className="w-16 h-16 text-white/10 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white/40">No albums found</h3>
          <p className="text-sm text-white/20 mb-8">Albums will appear here once created.</p>
          <button
            onClick={handleCreateExample}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Create Example Album
          </button>
        </div>
      )}
    </div>
  );
}
