"use client";

import { useEffect, useState, useCallback } from "react";
import { Target, Play, Pause, RefreshCw, ChevronRight, LayoutList, CheckCircle2 } from "lucide-react";
import { CampaignService } from "@/services/campaign-service";
import { PostService } from "@/services/post-service";
import { Campaign, GeneratedPost, CampaignStatus, SongEra } from "@/types";
import { CampaignEngine } from "@/services/campaign-engine";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const eraColors: Record<string, string> = {
  [SongEra.BLUE]: "bg-blue-500",
  [SongEra.YELLOW]: "bg-yellow-400",
  [SongEra.RED]: "bg-red-600",
  [SongEra.GREEN]: "bg-green-500",
  [SongEra.PURPLE]: "bg-purple-600",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [queue, setQueue] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allCampaigns, active] = await Promise.all([
        CampaignService.getAll(),
        CampaignService.getActive()
      ]);
      setCampaigns(allCampaigns);
      setActiveCampaign(active);
      
      if (active) {
        const posts = await PostService.getQueue(active.id);
        setQueue(posts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id: string, status: CampaignStatus) => {
    try {
      setActionLoading(id);
      if (status === CampaignStatus.COMPLETED) {
        await CampaignService.complete(id);
      } else {
        await CampaignService.updateStatus(id, status);
      }
      await fetchData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateNext = async () => {
    if (!activeCampaign) return;
    try {
      setActionLoading('generate');
      await CampaignEngine.generateNextPost(activeCampaign.id);
      await fetchData();
      alert("Next post draft generated!");
    } catch (err: any) {
      alert("Failed to generate post: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Engine</h2>
          <p className="text-white/40 text-sm mt-1">Monitor active narratives and content flows.</p>
        </div>
      </div>

      {activeCampaign ? (
        <div className="glass border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l ${activeCampaign.songs?.era ? eraColors[activeCampaign.songs.era] + '/10' : 'from-zinc-800/20'} to-transparent pointer-events-none`} />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/3 space-y-6">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    {activeCampaign.status}
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">{activeCampaign.songs?.title}</h3>
                  <p className="text-white/50 text-base leading-relaxed italic">
                    {activeCampaign.songs?.emotional_summary}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                     <p className="text-[10px] text-white/40 font-bold uppercase mb-1">CAMPAIGN DAY</p>
                     <p className="text-2xl font-black">{activeCampaign.day_number} <span className="text-xs text-white/20">/ 07</span></p>
                  </div>
                  <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                     <p className="text-[10px] text-white/40 font-bold uppercase mb-1">ERA</p>
                     <p className="text-2xl font-black uppercase tracking-tighter">{activeCampaign.songs?.era}</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 pt-4">
                  {activeCampaign.status === CampaignStatus.ACTIVE ? (
                    <button 
                      onClick={() => handleStatusUpdate(activeCampaign.id, CampaignStatus.PAUSED)}
                      disabled={actionLoading === activeCampaign.id}
                      className="flex-1 h-12 rounded-2xl glass border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                    >
                      <Pause className="w-4 h-4" /> {actionLoading === activeCampaign.id ? "Wait..." : "Pause"}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusUpdate(activeCampaign.id, CampaignStatus.ACTIVE)}
                      disabled={actionLoading === activeCampaign.id}
                      className="flex-1 h-12 rounded-2xl bg-white text-zinc-950 font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-sm uppercase tracking-widest"
                    >
                      <Play className="w-4 h-4" /> {actionLoading === activeCampaign.id ? "Wait..." : "Resume"}
                    </button>
                  )}
                  <button 
                    onClick={() => handleStatusUpdate(activeCampaign.id, CampaignStatus.COMPLETED)}
                    className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                    title="Complete & Archive"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white/40" />
                  </button>
               </div>
               
               <button 
                onClick={handleGenerateNext}
                disabled={actionLoading === 'generate' || activeCampaign.status !== CampaignStatus.ACTIVE}
                className="w-full h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all text-xs uppercase tracking-widest mt-4 disabled:opacity-50"
               >
                 <RefreshCw className={`w-4 h-4 ${actionLoading === 'generate' ? 'animate-spin' : ''}`} />
                 {actionLoading === 'generate' ? 'Generating...' : 'Generate Next Narrative Post'}
               </button>
            </div>

            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Sequence Flow</h4>
                   <LayoutList className="w-4 h-4 text-white/20" />
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                   {queue.map((post, i) => (
                     <div key={post.id} className="flex items-center gap-4 group">
                        <div className={`w-1.5 h-12 rounded-full ${post.status === 'published' ? 'bg-green-500' : 'bg-white/10'}`} />
                        <div className="flex-1 glass border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                           <div>
                              <p className="text-xs font-bold">{post.hook || "Generated Content"}</p>
                              <p className="text-[10px] text-white/30 uppercase font-black">Day {post.campaign_day} • {post.status}</p>
                           </div>
                           <Link href="/posts">
                              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all" />
                           </Link>
                        </div>
                     </div>
                   ))}
                   {queue.length === 0 && (
                     <div className="py-12 text-center text-white/20 uppercase text-[10px] font-black tracking-widest border border-dashed border-white/5 rounded-2xl">
                        Awaiting next daily generation...
                     </div>
                   )}
                </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={Target}
          title="No current campaign"
          description="Your creative engine is idle. Select a song from your library to initiate the next narrative chapter."
          action={{ label: "Go to Library", onClick: () => router.push("/songs") }}
        />
      )}

      {/* Campaign History */}
      <div className="space-y-4 pt-12">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/20">Archive of Eras</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.filter(c => !c.is_current).map(campaign => (
            <div key={campaign.id} className="glass border border-white/5 rounded-3xl p-6 group hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">{campaign.status}</span>
                <span className="text-[10px] font-black tracking-widest text-white/20">Day {campaign.day_number}</span>
              </div>
              <h4 className="font-bold text-lg mb-1">{campaign.songs?.title}</h4>
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">{campaign.songs?.era} Era</p>
              <div className="mt-6">
                <button 
                  onClick={() => handleStatusUpdate(campaign.id, CampaignStatus.ACTIVE)}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-zinc-950 transition-all"
                >
                  Reactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

