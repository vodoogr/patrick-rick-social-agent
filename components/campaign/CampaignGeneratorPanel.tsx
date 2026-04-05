"use client";

import { useEffect, useState } from "react";
import { Song, Album, Campaign } from "@/types";
import { SongService } from "@/services/song-service";
import { AlbumService } from "@/services/album-service";
import { CampaignService } from "@/services/campaign-service";
import { AssetService } from "@/services/asset-service";
import { 
  generateFullCampaign, 
  generateCampaignHook,
  generateCampaignCaption
} from "@/services/aiCampaignGenerator";
import { generateSongCoverConcept } from "@/services/coverGenerator";
import { generateReelThumbnailVisual, generateVideoPrompt } from "@/services/videoPromptGenerator";
import { Loader2, RefreshCw, Save, Image as ImageIcon, Video, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function CampaignGeneratorPanel({ initialSongId }: { initialSongId?: string }) {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>(initialSongId || "");
  const [song, setSong] = useState<Song | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated state
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [campaignConcept, setCampaignConcept] = useState("");
  const [songCoverPrompt, setSongCoverPrompt] = useState("");
  const [reelVisualPrompt, setReelVisualPrompt] = useState("");

  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSongs() {
      try {
        const allSongs = await SongService.getAll();
        setSongs(allSongs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadSongs();
  }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedSongId) {
        setSong(null);
        setAlbum(null);
        setActiveCampaign(null);
        return;
      }
      try {
        setLoading(true);
        const s = await SongService.getById(selectedSongId);
        setSong(s);
        if (s.album_id) {
          const a = await AlbumService.getById(s.album_id);
          setAlbum(a);
        }
        
        const campaigns = await CampaignService.getAll();
        const active = campaigns.find(c => c.song_id === selectedSongId && c.status === 'active');
        if (active) setActiveCampaign(active);
        else setActiveCampaign(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [selectedSongId]);

  const handleGenerateAll = async () => {
    if (!song || !album) return;
    setGenerating(true);
    try {
      const params = { song, album, existingCampaigns: [] };
      const [campaignInfo, cover, video, reel] = await Promise.all([
        generateFullCampaign(params),
        generateSongCoverConcept(params),
        generateVideoPrompt(params),
        generateReelThumbnailVisual(params)
      ]);

      setHook(campaignInfo.campaign_hook);
      setCaption(campaignInfo.caption);
      setHashtags(campaignInfo.hashtags);
      setCampaignConcept(campaignInfo.campaign_concept);
      setSongCoverPrompt(cover);
      setVideoPrompt(video);
      setReelVisualPrompt(reel);
    } catch (e: any) {
      alert("Error generating campaign: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateHook = async () => {
    if (!song || !album) return;
    setHook("...");
    setHook(await generateCampaignHook({ song, album }));
  };

  const handleRegenerateCaption = async () => {
    if (!song || !album) return;
    setCaption("...");
    setCaption(await generateCampaignCaption({ song, album }));
  };

  const handleRegenerateCover = async () => {
    if (!song || !album) return;
    setSongCoverPrompt("...");
    setSongCoverPrompt(await generateSongCoverConcept({ song, album }));
  };

  const handleRegenerateReel = async () => {
    if (!song || !album) return;
    setReelVisualPrompt("...");
    setReelVisualPrompt(await generateReelThumbnailVisual({ song, album }));
  };

  const handleSave = async () => {
    if (!song) return;
    setSaving(true);
    try {
      let campaignId = activeCampaign?.id;
      if (!campaignId) {
        // start a new campaign if none exists
        campaignId = await CampaignService.startNew(song.id);
      }

      // We need to update the campaign with the newly generated content
      // Note: we can use a direct supabase call here or a custom service method.
      // Assuming we extended Campaign interface, we use a raw patch via CampaignService if we need to.
      // But we don't have update function in CampaignService that modifies arbitrary fields.
      // Let's implement an API route or just use the Supabase client.
      
      const res = await fetch("/api/campaigns/update-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          song_id: song.id,
          hook,
          caption,
          hashtags,
          campaign_concept: campaignConcept,
          video_prompt: videoPrompt,
          song_cover_prompt: songCoverPrompt,
          reel_visual_prompt: reelVisualPrompt
        })
      });

      if (!res.ok) throw new Error("Failed to save campaign assets");
      
      setLastSavedId(campaignId);
      alert("Campaign assets saved successfully!");
    } catch (e: any) {
      alert("Error saving campaign: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/40"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/> Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-white/50 block">Select Song</label>
        <select 
          value={selectedSongId}
          onChange={e => setSelectedSongId(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
        >
          <option value="">-- Choose a song to generate a campaign for --</option>
          {songs.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      {song && album && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/5">
              <h3 className="text-xl font-bold mb-2 tracking-tighter">Creative Context</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-4">Inputs for Generation</p>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Song & Album Era</span>
                  <p className="text-sm border border-white/10 bg-white/5 px-3 py-2 rounded-xl">{song.title} / {album.title} ({album.era})</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Visual Identity</span>
                  <p className="text-sm border border-white/10 bg-white/5 px-3 py-2 rounded-xl text-white/70 italic">{song.creative_dna?.visual_identity || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Emotional Core</span>
                  <p className="text-sm border border-white/10 bg-white/5 px-3 py-2 rounded-xl text-white/70 italic">{song.creative_dna?.emotional_summary || "N/A"}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateAll}
              disabled={generating}
              className="w-full h-14 bg-white text-zinc-950 font-black tracking-widest uppercase text-sm rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {generating ? "Generating..." : "Generate Campaign Assets"}
            </button>
          </div>

          <div className="space-y-6">
            {(hook || generating) && (
              <div className="glass p-6 rounded-3xl border border-white/5 space-y-6 slide-in-from-right-8 animate-in">
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Campaign Hook
                    </label>
                    <button onClick={handleRegenerateHook} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-10 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={hook} onChange={e => setHook(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[60px] focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Caption Copy
                    </label>
                    <button onClick={handleRegenerateCaption} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-24 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={caption} onChange={e => setCaption(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[120px] focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2 mb-2">
                    <FileText className="w-3 h-3" /> Hashtags
                  </label>
                  {generating ? <div className="h-10 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={hashtags} onChange={e => setHashtags(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-blue-400 font-bold focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2 mb-2">
                    <Video className="w-3 h-3" /> Video Prompt (Runway/Sora/Kling)
                  </label>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2 mb-2">
                      <ImageIcon className="w-3 h-3" /> Song Cover Concept
                    </label>
                    <button onClick={handleRegenerateCover} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={songCoverPrompt} onChange={e => setSongCoverPrompt(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2 mb-2">
                      <ImageIcon className="w-3 h-3" /> Reel Thumbnail Visual
                    </label>
                    <button onClick={handleRegenerateReel} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <textarea 
                      value={reelVisualPrompt} onChange={e => setReelVisualPrompt(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 bg-blue-600 text-white font-black tracking-widest uppercase text-xs rounded-xl shadow-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving Data & Assets..." : "Save Campaign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
