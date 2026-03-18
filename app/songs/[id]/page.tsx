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
  Activity,
  Loader2,
  Target,
  Clock,
  Disc3,
  CheckCircle2,
} from "lucide-react";
import { SongService } from "@/services/song-service";
import { AssetService } from "@/services/asset-service";
import { CampaignService } from "@/services/campaign-service";
import { SongWithAlbum, Asset, SongEra, Campaign, GeneratedPost } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CreativeDNAEditor, SONG_DNA_FIELDS } from "@/components/CreativeDNAEditor";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const eraGradients: Record<string, string> = {
  [SongEra.RED]: "from-red-600/20 to-transparent",
  [SongEra.BLUE]: "from-blue-600/20 to-transparent",
  [SongEra.YELLOW]: "from-yellow-400/20 to-transparent",
  [SongEra.GREEN]: "from-green-500/20 to-transparent",
  [SongEra.PURPLE]: "from-purple-600/20 to-transparent",
};

const statusColors: Record<string, string> = {
  active: "text-green-500 bg-green-500/10 border-green-500/30",
  paused: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
  completed: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  draft: "text-white/40 bg-white/5 border-white/10",
};

export default function SongDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [song, setSong] = useState<SongWithAlbum | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingCampaign, setStartingCampaign] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState<"assets" | "campaigns" | "posts">("assets");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const songId = typeof id === "string" ? id : id?.[0];
        if (!songId) throw new Error("Invalid song ID");

        const [foundSong, songAssets, campaignHistory, postHistory] = await Promise.all([
          SongService.getById(songId),
          AssetService.getBySong(songId),
          SongService.getCampaignHistory(songId),
          SongService.getPostHistory(songId),
        ]);

        if (!foundSong) throw new Error("Song not found");

        setSong(foundSong);
        setAssets(songAssets);
        setCampaigns(campaignHistory);
        setPosts(postHistory);
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
      router.push("/campaigns");
      router.refresh();
    } catch (err: any) {
      console.error("Error starting campaign:", err);
      alert("Failed to start campaign: " + (err.message || JSON.stringify(err)));
    } finally {
      setStartingCampaign(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!song) return null;

  // Merge legacy flat fields into creative_dna for display
  const creativeDNA = {
    emotional_summary: song.emotional_summary || "",
    visual_identity: song.visual_identity || "",
    canonical_phrase: song.canonical_phrase || "",
    ...((song.creative_dna as Record<string, any>) || {}),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/40">
          {song.albums ? (
            <>
              <Link href="/albums" className="hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Albums</Link>
              <span className="text-white/20">/</span>
              <Link href={`/albums/${song.album_id}`} className="hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">{song.albums.title}</Link>
              <span className="text-white/20">/</span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{song.title}</span>
            </>
          ) : (
            <Link href="/songs" className="flex items-center gap-2 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Library</span>
            </Link>
          )}
        </div>
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
        <div className={`absolute inset-0 bg-gradient-to-br ${eraGradients[song.era] || "from-zinc-800/20 to-transparent"}`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group shadow-2xl relative">
            {song.cover_path && !imgError ? (
              <img
                src={song.cover_path.startsWith("http") ? song.cover_path : AssetService.getPublicUrl(song.cover_path)}
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <Music2 className="w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center scale-90 group-hover:scale-100 transition-all shadow-xl">
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {song.era} ERA
                </span>
                {song.albums ? (
                  <Link href={`/albums/${song.album_id}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors">
                    <Disc3 className="w-3 h-3" />
                    {song.albums.title}
                  </Link>
                ) : song.album ? (
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em]">
                    Album: {song.album}
                  </span>
                ) : null}
                {song.track_number && (
                  <span className="text-white/30 text-[10px] font-bold">Track #{song.track_number}</span>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">{song.title}</h1>
            </div>

            <p className="text-xl text-white/70 max-w-2xl leading-relaxed italic font-serif">
              &quot;{song.emotional_summary || song.creative_dna?.emotional_summary || "No emotional summary yet."}&quot;
            </p>

            {/* Asset Indicators */}
            <div className="flex items-center gap-3 pt-2">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${song.audio_path ? "border-green-500/30 text-green-500/70 bg-green-500/10" : "border-white/10 text-white/20 bg-white/5"}`}>
                <FileAudio className="w-3 h-3 inline mr-1" />
                Audio {song.audio_path ? "✓" : "✗"}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${song.cover_path ? "border-green-500/30 text-green-500/70 bg-green-500/10" : "border-white/10 text-white/20 bg-white/5"}`}>
                <ImageIcon className="w-3 h-3 inline mr-1" />
                Cover {song.cover_path ? "✓" : "✗"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={handleStartCampaign}
                disabled={startingCampaign}
                className="px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {startingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Initiate Social Campaign"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Assets / Campaigns / Posts */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-0">
        {(["assets", "campaigns", "posts"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === tab
                ? "border-white text-white"
                : "border-transparent text-white/30 hover:text-white/60"
            }`}
          >
            {tab} {tab === "campaigns" ? `(${campaigns.length})` : tab === "posts" ? `(${posts.length})` : `(${assets.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Assets Tab */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-white/40" />
                  Linked Assets
                </h3>
                <button className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white">
                  Upload New
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {assets.map(asset => (
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
          )}

          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-white/40" />
                Campaign History
              </h3>
              {campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="flex items-center gap-4 p-4 glass border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${campaign.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : campaign.status === "paused" ? "bg-yellow-500" : "bg-zinc-600"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">Day {campaign.day_number}</p>
                        <p className="text-[10px] text-white/40">
                          {campaign.start_date ? formatDistanceToNow(new Date(campaign.start_date), { addSuffix: true }) : "No start date"}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${statusColors[campaign.status] || statusColors.draft}`}>
                        {campaign.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center text-white/20">
                  <Target className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">No campaigns yet</p>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-white/40" />
                Generated Posts
              </h3>
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map(post => (
                    <div key={post.id} className="flex items-center gap-4 p-4 glass border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                      <div className="w-8 text-center">
                        <p className="text-[9px] text-white/30 font-bold">DAY</p>
                        <p className="text-sm font-bold">{post.campaign_day}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{post.title || "Untitled Post"}</p>
                        <p className="text-[10px] text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.scheduled_for ? formatDistanceToNow(new Date(post.scheduled_for), { addSuffix: true }) : "Draft"}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                        post.status === "published" ? "border-green-500/30 text-green-500/70 bg-green-500/10" :
                        post.status === "scheduled" ? "border-blue-500/30 text-blue-500/70 bg-blue-500/10" :
                        "border-white/10 text-white/40 bg-white/5"
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center text-white/20">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">No posts generated yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Creative DNA */}
        <div className="space-y-8">
          <CreativeDNAEditor
            title="Song Creative DNA"
            fields={SONG_DNA_FIELDS}
            data={creativeDNA}
            onSave={async (data) => {
              await SongService.updateCreativeDNA(song.id, data);
            }}
          />
        </div>
      </div>
    </div>
  );
}
