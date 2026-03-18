"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Disc3,
  Music2,
  ArrowLeft,
  Play,
  Target,
  Calendar,
  FileAudio,
  Image as ImageIcon,
} from "lucide-react";
import { AlbumService } from "@/services/album-service";
import { AssetService } from "@/services/asset-service";
import { AlbumWithSongs, SongEra } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CreativeDNAEditor, ALBUM_DNA_FIELDS } from "@/components/CreativeDNAEditor";
import Link from "next/link";

const eraGradients: Record<string, string> = {
  [SongEra.RED]: "from-red-600/20 to-transparent",
  [SongEra.BLUE]: "from-blue-600/20 to-transparent",
  [SongEra.YELLOW]: "from-yellow-400/20 to-transparent",
  [SongEra.GREEN]: "from-green-500/20 to-transparent",
  [SongEra.PURPLE]: "from-purple-600/20 to-transparent",
};

export default function AlbumDetailPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function fetchAlbum() {
      try {
        setLoading(true);
        const albumId = typeof id === "string" ? id : id?.[0];
        if (!albumId) throw new Error("Invalid album ID");
        const data = await AlbumService.getById(albumId);
        if (!data) throw new Error("Album not found");
        setAlbum(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbum();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!album) return null;

  const songs = album.songs || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/albums" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Albums</span>
        </Link>
      </div>

      {/* Hero */}
      <div className={`relative glass border border-white/5 rounded-[40px] p-8 md:p-12 overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${eraGradients[album.era] || 'from-zinc-800/20 to-transparent'}`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group shadow-2xl relative">
            {album.cover_path && !imgError ? (
              <img
                src={album.cover_path.startsWith("http") ? album.cover_path : AssetService.getPublicUrl(album.cover_path)}
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <Disc3 className="w-24 h-24 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {album.era} ERA
                </span>
                {album.release_year && (
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em]">
                    {album.release_year}
                  </span>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">{album.title}</h1>
            </div>

            {album.description && (
              <p className="text-xl text-white/70 max-w-2xl leading-relaxed italic font-serif">
                &quot;{album.description}&quot;
              </p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                {songs.length} {songs.length === 1 ? "Track" : "Tracks"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Music2 className="w-5 h-5 text-white/40" />
            Tracklist
          </h3>

          {songs.length > 0 ? (
            <div className="space-y-2">
              {songs.map((song, idx) => (
                <Link key={song.id} href={`/songs/${song.id}`}>
                  <div className="flex items-center gap-4 p-4 glass border border-white/5 rounded-2xl group hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
                    <div className="w-8 text-center">
                      <span className="text-sm font-bold text-white/30 group-hover:hidden">
                        {song.track_number ?? idx + 1}
                      </span>
                      <Play className="w-4 h-4 text-white hidden group-hover:block mx-auto fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{song.title}</p>
                      <p className="text-[10px] text-white/40 truncate">
                        {song.emotional_summary || song.creative_dna?.emotional_summary || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${song.audio_path ? 'bg-green-500' : 'bg-white/10'}`} title={song.audio_path ? 'Audio available' : 'No audio'} />
                      <span className={`w-2 h-2 rounded-full ${song.cover_path ? 'bg-blue-500' : 'bg-white/10'}`} title={song.cover_path ? 'Cover available' : 'No cover'} />
                    </div>
                    <Target className="w-4 h-4 text-white/20 group-hover:text-white transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center text-center">
              <Music2 className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-sm font-bold text-white/30">No tracks linked to this album yet.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Creative DNA */}
        <div className="space-y-8">
          <CreativeDNAEditor
            title="Album Creative DNA"
            fields={ALBUM_DNA_FIELDS}
            data={album.creative_dna || {}}
            onSave={async (data) => {
              await AlbumService.updateCreativeDNA(album.id, data);
            }}
          />
        </div>
      </div>
    </div>
  );
}
