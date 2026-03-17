"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Music2, 
  Calendar, 
  FileAudio, 
  Image as ImageIcon, 
  Play, 
  ArrowLeft,
  Share2,
  MoreVertical,
  Activity
} from "lucide-react";
import { SongService } from "@/services/song-service";
import { AssetService } from "@/services/asset-service";
import { CampaignService } from "@/services/campaign-service";
import { Song, Asset, SongEra } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";

const eraGradients: Record<string, string> = {
  [SongEra.RED]: "from-red-600/20 to-transparent",
  [SongEra.BLUE]: "from-blue-600/20 to-transparent",
  [SongEra.YELLOW]: "from-yellow-400/20 to-transparent",
  [SongEra.GREEN]: "from-green-500/20 to-transparent",
  [SongEra.PURPLE]: "from-purple-600/20 to-transparent",
};

export default function SongDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingCampaign, setStartingCampaign] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Supabase select single often expects a filter, but our service uses ID filter internally
        const allSongs = await SongService.getAll();
        const foundSong = allSongs.find(s => s.id === id);
        
        if (!foundSong) throw new Error("Song not found");
        
        setSong(foundSong);
        const songAssets = await AssetService.getBySong(id as string);
        setAssets(songAssets);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleStartCampaign = async () => {
    if (!song) return;
    try {
      setStartingCampaign(true);
      await CampaignService.startNew(song.id);
      router.push("/");
    } catch (err: any) {
      alert("Failed to start campaign: " + err.message);
    } finally {
      setStartingCampaign(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!song) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/songs" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Library</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-xl glass border border-white/5 hover:bg-white/5 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-3 rounded-xl glass border border-white/5 hover:bg-white/5 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`relative glass border border-white/5 rounded-[40px] p-8 md:p-12 overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${eraGradients[song.era] || 'from-zinc-800/20 to-transparent'}`} />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group shadow-2xl">
            {song.cover_path ? (
              <img src={song.cover_path} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <Music2 className="w-24 h-24 text-white/10" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center scale-90 group-hover:scale-100 transition-all shadow-xl">
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {song.era} ERA
                </span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em]">
                  Album: {song.album || "Single"}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">{song.title}</h1>
            </div>

            <p className="text-xl text-white/70 max-w-2xl leading-relaxed italic font-serif">
              "{song.emotional_summary}"
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button 
                onClick={handleStartCampaign}
                disabled={startingCampaign}
                className="px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
              >
                {startingCampaign ? "Starting Campaign..." : "Initiate Social Campaign"}
              </button>
              <button className="px-8 py-4 rounded-2xl border border-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all">
                Edit Creative DNA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-white/40" />
                Linked Assets
              </h3>
              <button className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white">Upload New</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="aspect-square glass border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-all">
                   <FileAudio className="w-8 h-8 text-white/20 mb-3 group-hover:text-blue-400 transition-colors" />
                   <p className="text-[10px] font-bold text-center truncate w-full">{asset.file_name || asset.asset_type}</p>
                   <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">{asset.asset_type}</p>
                </div>
              ))}
              {assets.length === 0 && (
                <div className="col-span-full border border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center text-white/20">
                   <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                   <p className="text-xs font-bold uppercase tracking-widest">No assets attached</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass border border-white/5 rounded-3xl p-6">
             <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 opacity-40">
               <Activity className="w-4 h-4" />
               Campaign Pulse
             </h3>
             <div className="space-y-6">
                <div className="relative pl-6 border-l border-white/10 space-y-0.5">
                   <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                   <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Currently Active</p>
                   <p className="text-xs font-medium">Auto-Pilot: Red Era Chapter</p>
                </div>
                <div className="relative pl-6 border-l border-white/10 space-y-0.5">
                   <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-zinc-600" />
                   <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Last Update</p>
                   <p className="text-xs font-medium">Day 1 Content Generated</p>
                </div>
             </div>
          </div>

          <div className="glass border border-white/5 rounded-3xl p-6">
             <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 opacity-40">
               <Calendar className="w-4 h-4" />
               Creative DNA
             </h3>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Visual Identity</p>
                   <p className="text-xs text-white/60">{song.visual_identity}</p>
                </div>
                <div>
                   <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Canonical Phrase</p>
                   <p className="text-xs text-white/60 italic">"{song.canonical_phrase}"</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
