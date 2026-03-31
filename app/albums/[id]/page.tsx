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
  Edit3,
  Check,
  Loader2,
  X
} from "lucide-react";
import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { AssetService } from "@/services/asset-service";
import { AlbumWithSongs, SongEra } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CreativeDNAEditor, ALBUM_DNA_FIELDS } from "@/components/CreativeDNAEditor";
import Link from "next/link";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

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

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editYear, setEditYear] = useState<number | "">("");
  const [editEra, setEditEra] = useState<SongEra | "">("");
  const [saving, setSaving] = useState(false);
  
  const { playSong } = useAudioPlayer();

  useEffect(() => {
    if (album) {
      setEditTitle(album.title);
      setEditYear(album.release_year || "");
      setEditEra(album.era || "");
    }
  }, [album]);

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

  if (loading && !album) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!album) return null;

  const handleSave = async () => {
    if (!album) return;
    try {
      setSaving(true);
      const newEra = editEra === "" ? undefined : editEra as SongEra;
      const updated = await AlbumService.update(album.id, {
        title: editTitle,
        release_year: editYear === "" ? null : editYear,
        era: newEra
      } as any);

      let updatedSongs = album.songs || [];
      if (newEra && newEra !== album.era) {
        // Cascade era update to all tracks
        updatedSongs = await Promise.all(
          updatedSongs.map(async (song) => {
            return await SongService.update(song.id, { era: newEra });
          })
        );
      }

      setAlbum({ ...album, ...updated, songs: updatedSongs });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update album");
    } finally {
      setSaving(false);
    }
  };

  const forceSaveAndCascade = async () => {
    if (!album) return;
    try {
      setSaving(true);
      const currentEra = isEditing && editEra !== "" ? (editEra as SongEra) : album.era;
      
      const updated = await AlbumService.update(album.id, {
        title: isEditing ? editTitle : album.title,
        release_year: isEditing ? (editYear === "" ? null : editYear) : album.release_year,
        era: currentEra
      } as any);

      // Force cascade era update to all tracks, even if it didn't change (to fix PRESENT era bugs)
      let updatedSongs = album.songs || [];
      if (currentEra) {
        updatedSongs = await Promise.all(
          updatedSongs.map(async (song) => {
            return await SongService.update(song.id, { era: currentEra });
          })
        );
      }

      setAlbum({ ...album, ...updated, songs: updatedSongs });
      setIsEditing(false);
      alert("All changes saved! Track eras synchronized.");
    } catch (err) {
      console.error(err);
      alert("Failed to update album");
    } finally {
      setSaving(false);
    }
  };

  const songs = album.songs || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/albums" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Albums</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/import/pdf-creative-dna`}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10 text-xs font-bold uppercase tracking-widest text-emerald-400 group flex items-center gap-2 transition-all hover:scale-105"
          >
            <Disc3 className="w-3 h-3 group-hover:animate-spin" />
            Import DNA
          </Link>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : (isEditing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />)}
            {isEditing ? "Save Changes" : "Edit Metadata"}
          </button>
        </div>
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
                {isEditing ? (
                  <select
                    value={editEra}
                    onChange={e => setEditEra(e.target.value as SongEra)}
                    className="bg-transparent border border-white/20 rounded-md px-2 py-1 text-[10px] uppercase font-bold text-white focus:outline-none"
                  >
                    {Object.values(SongEra).map(era => <option key={era} value={era} className="bg-zinc-900">{era}</option>)}
                  </select>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {album.era} ERA
                  </span>
                )}
                
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editYear} 
                    onChange={e => setEditYear(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="Year"
                    className="bg-transparent border-b border-white/20 w-16 text-white/40 text-[10px] font-bold uppercase tracking-[0.1em] focus:outline-none focus:border-white"
                  />
                ) : (
                  album.release_year && (
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em]">
                      {album.release_year}
                    </span>
                  )
                )}
              </div>
              
              {isEditing ? (
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-transparent border-b border-white/20 w-full text-5xl md:text-7xl font-bold tracking-tighter leading-none focus:outline-none focus:border-white"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">{album.title}</h1>
              )}
            </div>

            {album.description && (
              <p className="text-xl text-white/70 max-w-2xl leading-relaxed italic font-serif">
                &quot;{album.description}&quot;
              </p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                {songs.length} {songs.length === 1 ? "Track" : "Tracks"}
              </div>
              <button 
                onClick={forceSaveAndCascade}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest text-green-300 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
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
                    <div 
                      className="w-8 text-center relative z-10 flex items-center justify-center" 
                      onClick={(e) => {
                         if (song.audio_path || song.drive_file_id) {
                           e.preventDefault();
                           playSong(song, album);
                         }
                      }}
                    >
                      <span className="text-sm font-bold text-white/30 group-hover:hidden">
                        {song.track_number ?? idx + 1}
                      </span>
                      <div className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black transition-colors">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{song.title}</p>
                      <p className="text-[10px] text-white/40 truncate">
                        {song.emotional_summary || song.creative_dna?.emotional_summary || "—"}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-2">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${song.audio_path ? 'border-green-500/30 text-green-500/70 bg-green-500/10' : 'border-white/10 text-white/20 bg-white/5'}`}>
                        Audio {song.audio_path ? '✓' : '✗'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${song.cover_path ? 'border-green-500/30 text-green-500/70 bg-green-500/10' : 'border-white/10 text-white/20 bg-white/5'}`}>
                        Cover {song.cover_path ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-zinc-950 transition-all text-[10px] font-bold uppercase tracking-widest text-white/50">
                        <Target className="w-3 h-3" />
                        Campaign
                      </button>
                    </div>
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
