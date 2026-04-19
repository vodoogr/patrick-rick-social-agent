"use client";

import { useEffect, useState } from "react";
import { Song, Album, Campaign } from "@/types";
import { SongService } from "@/services/song-service";
import { AlbumService } from "@/services/album-service";
import { CampaignService } from "@/services/campaign-service";
import { AssetService } from "@/services/asset-service";
import { AssetType } from "@/types/enums";
import { ProfileService } from "@/services/profile-service";
import { 
  generateFullCampaign, 
  generateCampaignHook,
  generateCampaignCaption
} from "@/services/aiCampaignGenerator";
import { generateSongCoverConcept } from "@/services/coverGenerator";
import { generateReelThumbnailVisual, generateVideoPrompt } from "@/services/videoPromptGenerator";
import { GoogleImageGeneration, ImageGenerationResult } from "@/services/googleImageGeneration";
import { GoogleVideoGeneration, VideoGenerationResult } from "@/services/googleVideoGeneration";
import { 
  Loader2, RefreshCw, Save, Image as ImageIcon, Video, FileText, 
  Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CampaignActionButtons } from "./CampaignActionButtons";
import { GeneratedAssetPreview } from "./GeneratedAssetPreview";
import { VideoGenerationModal } from "./VideoGenerationModal";

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

  // Generated text state
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [campaignConcept, setCampaignConcept] = useState("");
  const [songCoverPrompt, setSongCoverPrompt] = useState("");
  const [reelVisualPrompt, setReelVisualPrompt] = useState("");

  // Media generation state
  const [generatingCoverImage, setGeneratingCoverImage] = useState(false);
  const [generatingReelImage, setGeneratingReelImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [coverImageResult, setCoverImageResult] = useState<ImageGenerationResult | null>(null);
  const [reelImageResult, setReelImageResult] = useState<ImageGenerationResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null);

  // Asset save state
  const [coverSaved, setCoverSaved] = useState(false);
  const [reelSaved, setReelSaved] = useState(false);
  const [videoSaved, setVideoSaved] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
        // Reset media state on song change
        setCoverImageResult(null);
        setReelImageResult(null);
        setVideoResult(null);
        setCoverSaved(false);
        setReelSaved(false);
        setVideoSaved(false);

        const s = await SongService.getById(selectedSongId);
        setSong(s);
        if (s && s.album_id) {
          const a = await AlbumService.getById(s.album_id);
          setAlbum(a);
        } else {
          setAlbum(null);
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
    if (!song) {
      alert("Error: No se ha cargado la canción.");
      return;
    }
    if (!album) {
      alert("Error: Esta canción no tiene un álbum asociado o no se ha podido cargar el álbum.");
      return;
    }
    setGenerating(true);
    try {
      const params = { song, album, existingCampaigns: [] };
      const fullCampaign = await generateFullCampaign(params);

      setHook(fullCampaign.campaign_hook);
      setCaption(fullCampaign.caption);
      setHashtags(fullCampaign.hashtags);
      setCampaignConcept(fullCampaign.campaign_concept);
      setSongCoverPrompt(fullCampaign.song_cover_prompt);
      setVideoPrompt(fullCampaign.video_prompt);
      setReelVisualPrompt(fullCampaign.reel_visual_prompt);
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
    setCoverImageResult(null);
    setCoverSaved(false);
    setSongCoverPrompt(await generateSongCoverConcept({ song, album }));
  };

  const handleRegenerateReel = async () => {
    if (!song || !album) return;
    setReelVisualPrompt("...");
    setReelImageResult(null);
    setReelSaved(false);
    setReelVisualPrompt(await generateReelThumbnailVisual({ song, album }));
  };

  // ════════════════════════════════════════════
  // Google Media Generation Handlers
  // ════════════════════════════════════════════

  const handleGenerateCoverImage = async () => {
    if (!songCoverPrompt) return;
    setGeneratingCoverImage(true);
    try {
      const result = await GoogleImageGeneration.generateSongCover(songCoverPrompt);
      setCoverImageResult(result);
    } catch (e: any) {
      alert("Image generation error: " + e.message);
    } finally {
      setGeneratingCoverImage(false);
    }
  };

  const handleGenerateReelImage = async () => {
    if (!reelVisualPrompt) return;
    setGeneratingReelImage(true);
    try {
      const result = await GoogleImageGeneration.generateReelThumbnail(reelVisualPrompt);
      setReelImageResult(result);
    } catch (e: any) {
      alert("Image generation error: " + e.message);
    } finally {
      setGeneratingReelImage(false);
    }
  };

  const handleGenerateVideo = async (imageReference?: string | File) => {
    if (!videoPrompt || !song) return;
    setGeneratingVideo(true);
    try {
      let referenceUrl: string | undefined;

      if (imageReference instanceof File) {
        // Upload the temporary reference file to storage
        const storagePath = `temp_references/${Date.now()}_ref_${imageReference.name}`;
        const asset = await AssetService.upload(imageReference, storagePath, AssetType.OTHER, song.id);
        referenceUrl = AssetService.getPublicUrl(asset.storage_path);
      } else {
        referenceUrl = imageReference;
      }

      const result = await GoogleVideoGeneration.generate({
        prompt: videoPrompt,
        aspectRatio: '9:16',
        durationSeconds: 10,
        style: 'cinematic',
        // Pass reference image if available for VEO
        ...(referenceUrl && { imageReference: referenceUrl })
      });
      setVideoResult(result);
    } catch (e: any) {
      alert("Video generation error: " + e.message);
    } finally {
      setGeneratingVideo(false);
    }
  };

  // ════════════════════════════════════════════
  // Save Asset Handlers
  // ════════════════════════════════════════════

  const handleSaveCoverAsset = async () => {
    if (!coverImageResult || !song) return;
    try {
      await AssetService.uploadFromDataUrl(
        coverImageResult.imageUrl,
        `${song.title}_cover_ai.png`,
        AssetType.SONG_COVER,
        song.id,
        {
          prompt: coverImageResult.prompt,
          source: 'ai_generated',
          provider: 'google',
          model: coverImageResult.model,
          generatedAt: coverImageResult.generatedAt,
        }
      );
      setCoverSaved(true);
    } catch (e: any) {
      alert("Failed to save asset: " + e.message);
    }
  };

  const handleSaveReelAsset = async () => {
    if (!reelImageResult || !song) return;
    try {
      await AssetService.uploadFromDataUrl(
        reelImageResult.imageUrl,
        `${song.title}_reel_ai.png`,
        AssetType.REEL_VISUAL,
        song.id,
        {
          prompt: reelImageResult.prompt,
          source: 'ai_generated',
          provider: 'google',
          model: reelImageResult.model,
          generatedAt: reelImageResult.generatedAt,
        }
      );
      setReelSaved(true);
    } catch (e: any) {
      alert("Failed to save asset: " + e.message);
    }
  };

  const handleSaveVideoAsset = async () => {
    if (!videoResult || !song) return;
    try {
      await AssetService.uploadFromDataUrl(
        videoResult.videoUrl,
        `${song.title}_video_ai.mp4`,
        AssetType.CAMPAIGN_VIDEO,
        song.id,
        {
          prompt: videoResult.prompt,
          source: 'ai_generated',
          provider: 'google',
          model: videoResult.model,
          durationSeconds: videoResult.durationSeconds,
          generatedAt: videoResult.generatedAt,
        }
      );
      setVideoSaved(true);
    } catch (e: any) {
      alert("Failed to save asset: " + e.message);
    }
  };

  // ════════════════════════════════════════════
  // Save Campaign
  // ════════════════════════════════════════════

  const handleSave = async () => {
    if (!song) return;
    setSaving(true);
    try {
      let campaignId = activeCampaign?.id;
      if (!campaignId) {
        campaignId = await CampaignService.startNew(song.id);
      }

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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save campaign assets");
      }
      
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* Left Column: Creative Context */}
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
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? "Generating..." : "Generate All Campaign Assets"}
            </button>

            {/* Generation Status Summary */}
            {(hook || coverImageResult || reelImageResult || videoResult) && (
              <div className="glass p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Generation Status
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Prompts', done: !!hook },
                    { label: 'Cover Image', done: !!coverImageResult },
                    { label: 'Reel Visual', done: !!reelImageResult },
                    { label: 'Campaign Video', done: !!videoResult },
                    { label: 'Cover Saved', done: coverSaved },
                    { label: 'Reel Saved', done: reelSaved },
                    { label: 'Video Saved', done: videoSaved },
                    { label: 'Campaign Saved', done: !!lastSavedId },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-[10px] font-bold">
                      {item.done ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-white/20" />
                      )}
                      <span className={item.done ? 'text-green-400' : 'text-white/30'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Generated Outputs */}
          <div className="space-y-6">
            {(hook || generating) && (
              <div className="glass p-6 rounded-3xl border border-white/5 space-y-6 slide-in-from-right-8 animate-in">
                
                {/* Campaign Hook */}
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

                {/* Caption */}
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

                {/* Hashtags */}
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

                {/* ═══════ Song Cover Concept (with action buttons) ═══════ */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Song Cover Concept
                    </label>
                    <button onClick={handleRegenerateCover} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <>
                      <textarea 
                        value={songCoverPrompt} onChange={e => setSongCoverPrompt(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                      />
                      <CampaignActionButtons
                        type="image"
                        prompt={songCoverPrompt}
                        onGenerate={handleGenerateCoverImage}
                        onSaveAsset={handleSaveCoverAsset}
                        isGenerating={generatingCoverImage}
                        isGenerated={!!coverImageResult}
                        isSaved={coverSaved}
                      />
                      <GeneratedAssetPreview
                        type="image"
                        url={coverImageResult?.imageUrl || null}
                        prompt={songCoverPrompt}
                        model={coverImageResult?.model}
                        generatedAt={coverImageResult?.generatedAt}
                        isPlaceholder={coverImageResult?.model?.includes('dev')}
                      />
                    </>
                  )}
                </div>

                {/* ═══════ Reel Thumbnail Visual (with action buttons) ═══════ */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Reel Thumbnail Visual
                    </label>
                    <button onClick={handleRegenerateReel} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Regenerate</button>
                  </div>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <>
                      <textarea 
                        value={reelVisualPrompt} onChange={e => setReelVisualPrompt(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                      />
                      <CampaignActionButtons
                        type="image"
                        prompt={reelVisualPrompt}
                        onGenerate={handleGenerateReelImage}
                        onSaveAsset={handleSaveReelAsset}
                        isGenerating={generatingReelImage}
                        isGenerated={!!reelImageResult}
                        isSaved={reelSaved}
                      />
                      <GeneratedAssetPreview
                        type="image"
                        url={reelImageResult?.imageUrl || null}
                        prompt={reelVisualPrompt}
                        model={reelImageResult?.model}
                        generatedAt={reelImageResult?.generatedAt}
                        isPlaceholder={reelImageResult?.model?.includes('dev')}
                      />
                    </>
                  )}
                </div>

                {/* ═══════ Video Prompt (with action buttons) ═══════ */}
                <div className="border-t border-white/5 pt-6">
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2 mb-2">
                    <Video className="w-3 h-3" /> Video Prompt (Google Veo)
                  </label>
                  {generating ? <div className="h-16 bg-white/5 animate-pulse rounded-xl" /> : (
                    <>
                      <textarea 
                        value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30"
                      />
                      <CampaignActionButtons
                        type="video"
                        prompt={videoPrompt}
                        onGenerate={() => setIsVideoModalOpen(true)}
                        onSaveAsset={handleSaveVideoAsset}
                        isGenerating={generatingVideo}
                        isGenerated={!!videoResult}
                        isSaved={videoSaved}
                      />
                      <GeneratedAssetPreview
                        type="video"
                        url={videoResult?.videoUrl || null}
                        prompt={videoPrompt}
                        model={videoResult?.model}
                        generatedAt={videoResult?.generatedAt}
                        isPlaceholder={videoResult?.model?.includes('dev')}
                        hue={videoResult ? 280 : undefined}
                      />
                    </>
                  )}
                </div>

                {/* Save Campaign Button */}
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

      {song && (
        <VideoGenerationModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          songId={song.id}
          promptText={videoPrompt}
          onGenerate={handleGenerateVideo}
        />
      )}
    </div>
  );
}
