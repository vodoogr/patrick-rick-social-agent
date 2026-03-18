"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight,
  Instagram,
  Youtube,
  Music2,
  Plus
} from "lucide-react";
import { CampaignService } from "@/services/campaign-service";
import { PostService } from "@/services/post-service";
import { SongService } from "@/services/song-service";
import { Campaign, GeneratedPost, Song, CampaignWithSong } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [activeCampaign, setActiveCampaign] = useState<CampaignWithSong | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [discoverySongs, setDiscoverySongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [campaign, songs] = await Promise.all([
          CampaignService.getActive(),
          SongService.getAll()
        ]);

        setActiveCampaign(campaign);
        setDiscoverySongs(songs.filter(s => s.is_active).slice(0, 3));

        if (campaign) {
          const queue = await PostService.getQueue(campaign.id);
          setPosts(queue);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  const nextPost = posts.find(p => p.status === 'scheduled') || posts.find(p => p.status === 'generated');
  const publishedPosts = posts.filter(p => p.status === 'published').slice(-5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all duration-700" />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">ACTIVE CAMPAIGN</p>
            {activeCampaign ? (
              <>
                <h3 className="text-2xl font-bold mb-1">{activeCampaign.songs?.title}</h3>
                <p className="text-sm text-white/60 mb-6 italic">"{activeCampaign.songs?.emotional_summary}"</p>
                <div className="flex items-center justify-between mt-auto">
                    <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold">
                      DAY {activeCampaign.day_number}
                    </div>
                    <Link href={`/songs/${activeCampaign.song_id}`}>
                      <ArrowUpRight className="w-5 h-5 text-white/30 hover:text-white transition-colors" />
                    </Link>
                </div>
              </>
            ) : (
              <div className="py-2">
                <p className="text-white/40 text-sm mb-4">No active campaign pulse detected.</p>
                <Link href="/songs" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                  START A CAMPAIGN →
                </Link>
              </div>
            )}
        </div>

        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all duration-700" />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">NEXT SCHEDULED</p>
            {nextPost ? (
              <>
                <h3 className="text-xl font-bold mb-1">{nextPost.title || "Untitled Post"}</h3>
                <p className="text-xs text-white/60 mb-6">
                  {nextPost.scheduled_for ? new Date(nextPost.scheduled_for).toLocaleString() : 'Pending Schedule'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Youtube className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-white/20 text-sm italic py-4">Nothing in the immediate wire.</p>
            )}
        </div>

        <div className="card-gradient glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-all duration-700" />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">REACH POTENTIAL</p>
            <h3 className="text-3xl font-bold mb-1">--</h3>
            <p className="text-sm text-white/40 font-bold flex items-center gap-1">
               Waiting for data...
            </p>
            <div className="h-12 w-full mt-4 flex items-end gap-1 opacity-20">
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
              <Link href="/posts" className="text-xs text-white/40 hover:text-white transition-colors uppercase font-bold tracking-widest">View Queue</Link>
            </div>
            
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.slice(0, 5).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-6 group hover:translate-x-1 transition-transform cursor-pointer">
                    <div className="w-12 text-center">
                      <p className="text-[10px] text-white/30 font-bold tracking-tighter">DAY</p>
                      <p className="text-lg font-bold">{item.campaign_day}</p>
                    </div>
                    <div className="flex-1 glass border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{item.title || "Untitled Post"}</p>
                        <p className="text-[10px] text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          {item.scheduled_for ? formatDistanceToNow(new Date(item.scheduled_for), { addSuffix: true }) : 'Draft'}
                        </p>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.status === 'published' ? 'border-green-500/30 text-green-500/70 bg-green-500/10' :
                        item.status === 'scheduled' ? 'border-blue-500/30 text-blue-500/70 bg-blue-500/10' :
                        'border-white/10 text-white/40 bg-white/5'
                      } uppercase tracking-widest`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Calendar} 
                title="No posts generated" 
                description="Once a campaign is active, the engine will start populating your creative rotation." 
              />
            )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
            <div className="glass border border-white/5 rounded-3xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-40">Discovery Queue</h4>
              <div className="space-y-4">
                  {discoverySongs.map((song) => (
                    <Link key={song.id} href={`/songs/${song.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 group cursor-pointer hover:bg-white/10 transition-colors mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                            <Music2 className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{song.title}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest">{song.era}</p>
                        </div>
                        <Plus className="w-3 h-3 text-white/20 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
              </div>
              <button className="w-full mt-2 py-3 rounded-2xl border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                Sync Library
              </button>
            </div>

            <div className="glass border border-white/5 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none" />
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-40">Platform Health</h4>
              <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50 tracking-widest uppercase">TikTok API</span>
                    <span className="text-green-500 font-bold">STABLE</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50 tracking-widest uppercase">Instagram G</span>
                    <span className="text-green-500 font-bold">STABLE</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50 tracking-widest uppercase">YouTube S</span>
                    <span className="text-green-500 font-bold">STABLE</span>
                  </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

