"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Album, Song } from "@/types";
import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { CampaignBatchGenerator, SongCampaignResult, AlbumBatchResult } from "@/services/campaignBatchGenerator";
import { GoogleImageGeneration } from "@/services/googleImageGeneration";
import { GoogleVideoGeneration } from "@/services/googleVideoGeneration";
import { AssetService } from "@/services/asset-service";
import { ProfileService } from "@/services/profile-service";
import { AssetType } from "@/types/enums";
import {
  Loader2, Disc3, Music2, Sparkles, CheckCircle2, 
  AlertCircle, Image as ImageIcon, Video, FileText,
  ChevronDown, ChevronRight, Copy, Save, Check,
  RefreshCw, Zap, Target
} from "lucide-react";
import Link from "next/link";

type SongSelection = Record<string, boolean>;

export default function AlbumBatchCampaignPage() {
  const searchParams = useSearchParams();
  const albumIdParam = searchParams.get("album_id");

  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(albumIdParam || "");
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Batch generation state
  const [generating, setGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<AlbumBatchResult | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: "" });
  const [songSelection, setSongSelection] = useState<SongSelection>({});
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

  // Per-song media generation
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState<string | null>(null);
  const [savingCampaign, setSavingCampaign] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const allAlbums = await AlbumService.getAll();
        setAlbums(allAlbums);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadAlbum() {
      if (!selectedAlbumId) {
        setAlbum(null);
        setSongs([]);
        return;
      }
      setLoading(true);
      try {
        const a = await AlbumService.getById(selectedAlbumId);
        setAlbum(a);
        const allSongs = await SongService.getAll();
        const albumSongs = allSongs
          .filter(s => s.album_id === selectedAlbumId)
          .sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
        setSongs(albumSongs);

        // Select all by default
        const sel: SongSelection = {};
        albumSongs.forEach(s => { sel[s.id] = true; });
        setSongSelection(sel);
        setBatchResult(null);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [selectedAlbumId]);

  const selectedCount = useMemo(() => Object.values(songSelection).filter(Boolean).length, [songSelection]);
  const toggleAll = () => {
    const allSelected = selectedCount === songs.length;
    const newSel: SongSelection = {};
    songs.forEach(s => { newSel[s.id] = !allSelected; });
    setSongSelection(newSel);
  };

  const handleBatchGenerate = async () => {
    if (!album) return;
    const selectedSongs = songs.filter(s => songSelection[s.id]);
    if (selectedSongs.length === 0) {
      alert("Please select at least one song.");
      return;
    }

    setGenerating(true);
    setBatchResult(null);
    setProgress({ completed: 0, total: selectedSongs.length, current: "" });

    try {
      const result = await CampaignBatchGenerator.generateForAlbum(
        album,
        selectedSongs,
        (completed, total, current) => {
          setProgress({ completed, total, current });
        }
      );
      setBatchResult(result);
    } catch (e: any) {
      alert("Batch generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSongCampaign = async (songResult: SongCampaignResult) => {
    setSavingCampaign(songResult.songId);
    try {
      await CampaignBatchGenerator.saveSongCampaign(songResult);
      // Update result status
      if (batchResult) {
        const updated = { ...batchResult };
        const idx = updated.results.findIndex(r => r.songId === songResult.songId);
        if (idx >= 0) updated.results[idx].assetSaved = true;
        setBatchResult(updated);
      }
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setSavingCampaign(null);
    }
  };

  const handleGenerateImage = async (songResult: SongCampaignResult) => {
    setGeneratingImage(songResult.songId);
    try {
      const result = await GoogleImageGeneration.generateSongCover(songResult.songCoverPrompt);
      // Save as asset
      await AssetService.uploadFromDataUrl(
        result.imageUrl,
        `${songResult.songTitle}_cover_ai.png`,
        AssetType.SONG_COVER,
        songResult.songId,
        { prompt: result.prompt, source: 'ai_generated', provider: 'google', model: result.model }
      );
      
      // Update result
      if (batchResult) {
        const updated = { ...batchResult };
        const idx = updated.results.findIndex(r => r.songId === songResult.songId);
        if (idx >= 0) updated.results[idx].imageGenerated = true;
        setBatchResult(updated);
      }
    } catch (e: any) {
      alert("Image generation failed: " + e.message);
    } finally {
      setGeneratingImage(null);
    }
  };

  const handleGenerateVideoForSong = async (songResult: SongCampaignResult) => {
    setGeneratingVideo(songResult.songId);
    try {
      const result = await GoogleVideoGeneration.generateCampaignVideo(songResult.videoPrompt);
      await AssetService.uploadFromDataUrl(
        result.videoUrl,
        `${songResult.songTitle}_video_ai.mp4`,
        AssetType.CAMPAIGN_VIDEO,
        songResult.songId,
        { prompt: result.prompt, source: 'ai_generated', provider: 'google', model: result.model }
      );

      if (batchResult) {
        const updated = { ...batchResult };
        const idx = updated.results.findIndex(r => r.songId === songResult.songId);
        if (idx >= 0) updated.results[idx].videoGenerated = true;
        setBatchResult(updated);
      }
    } catch (e: any) {
      alert("Video generation failed: " + e.message);
    } finally {
      setGeneratingVideo(null);
    }
  };

  const handleSaveAll = async () => {
    if (!batchResult) return;
    for (const result of batchResult.results) {
      if (result.status === 'completed' && !result.assetSaved) {
        await handleSaveSongCampaign(result);
      }
    }
  };

  if (loading && albums.length === 0) {
    return <div className="text-white/40"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Zap className="w-7 h-7 text-purple-400" />
          Album Campaign Generator
        </h2>
        <p className="text-white/40 text-sm mt-1">Generate campaign assets for all songs in an album at once.</p>
      </div>

      {/* Album Selector */}
      <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-white/50 block">Select Album</label>
        <select
          value={selectedAlbumId}
          onChange={e => setSelectedAlbumId(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
        >
          <option value="">-- Choose an album --</option>
          {albums.map(a => (
            <option key={a.id} value={a.id}>{a.title} ({a.era})</option>
          ))}
        </select>
      </div>

      {/* Album Content */}
      {album && songs.length > 0 && (
        <div className="space-y-6">
          {/* Album Header Card */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
              {album.cover_path ? (
                <img src={album.cover_path} alt="" className="w-full h-full object-cover" />
              ) : (
                <Disc3 className="w-8 h-8 text-white/20" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold tracking-tight">{album.title}</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">{album.era} Era • {songs.length} tracks</p>
              {album.creative_dna?.canonical_phrase && (
                <p className="text-sm text-white/50 italic mt-2">&quot;{album.creative_dna.canonical_phrase}&quot;</p>
              )}
            </div>
          </div>

          {/* Song Selection */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Music2 className="w-4 h-4" /> Song Selection
              </h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-300"
                >
                  {selectedCount === songs.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-[10px] text-white/30 font-bold">{selectedCount}/{songs.length} selected</span>
              </div>
            </div>

            <div className="space-y-2">
              {songs.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    songSelection[s.id]
                      ? 'bg-white/5 border border-white/10'
                      : 'border border-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={songSelection[s.id] || false}
                    onChange={() => setSongSelection(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-[10px] text-white/30 font-bold w-6">{s.track_number || '—'}</span>
                  <span className="text-sm font-bold flex-1">{s.title}</span>
                  {s.creative_dna?.emotional_summary ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-500/50" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleBatchGenerate}
            disabled={generating || selectedCount === 0}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black tracking-widest uppercase text-sm rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {progress.completed}/{progress.total} — {progress.current}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Campaigns for {selectedCount} Songs
              </>
            )}
          </button>

          {/* Progress Bar */}
          {generating && (
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
              />
            </div>
          )}

          {/* Batch Results */}
          {batchResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="glass p-6 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Generation Results
                  </h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      {batchResult.completed} completed
                    </span>
                    {batchResult.failed > 0 && (
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                        {batchResult.failed} failed
                      </span>
                    )}
                    <button
                      onClick={handleSaveAll}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      <Save className="w-3 h-3" /> Save All Campaigns
                    </button>
                  </div>
                </div>

                {/* Individual Song Results */}
                <div className="space-y-3">
                  {batchResult.results.map(result => (
                    <div
                      key={result.songId}
                      className={`rounded-2xl border transition-all ${
                        result.status === 'failed'
                          ? 'border-red-500/20 bg-red-500/5'
                          : result.assetSaved
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      {/* Song Row Header */}
                      <button
                        onClick={() => setExpandedSong(expandedSong === result.songId ? null : result.songId)}
                        className="w-full flex items-center gap-4 p-4 text-left"
                      >
                        <span className="text-[10px] text-white/30 font-bold w-6">{result.trackNumber || '—'}</span>
                        <span className="text-sm font-bold flex-1">{result.songTitle}</span>
                        
                        {/* Status indicators */}
                        <div className="flex items-center gap-2">
                          <StatusBadge label="Prompts" done={result.status === 'completed'} />
                          <StatusBadge label="Image" done={result.imageGenerated} />
                          <StatusBadge label="Video" done={result.videoGenerated} />
                          <StatusBadge label="Saved" done={result.assetSaved} />
                        </div>

                        {expandedSong === result.songId ? (
                          <ChevronDown className="w-4 h-4 text-white/30" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        )}
                      </button>

                      {/* Expanded Song Details */}
                      {expandedSong === result.songId && result.status === 'completed' && (
                        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                          {/* Text outputs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoCard label="Campaign Hook" value={result.campaign.campaign_hook} />
                            <InfoCard label="Caption" value={result.campaign.caption} />
                            <InfoCard label="Hashtags" value={result.campaign.hashtags} />
                            <InfoCard label="Cover Prompt" value={result.songCoverPrompt} />
                            <InfoCard label="Reel Prompt" value={result.reelVisualPrompt} />
                            <InfoCard label="Video Prompt" value={result.videoPrompt} />
                          </div>

                          {/* Action Buttons Row */}
                          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                            <button
                              onClick={() => handleGenerateImage(result)}
                              disabled={generatingImage === result.songId || result.imageGenerated}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500/20 disabled:opacity-40"
                            >
                              {generatingImage === result.songId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : result.imageGenerated ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <ImageIcon className="w-3 h-3" />
                              )}
                              {result.imageGenerated ? 'Image Done' : 'Generate Image'}
                            </button>

                            <button
                              onClick={() => handleGenerateVideoForSong(result)}
                              disabled={generatingVideo === result.songId || result.videoGenerated}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 disabled:opacity-40"
                            >
                              {generatingVideo === result.songId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : result.videoGenerated ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Video className="w-3 h-3" />
                              )}
                              {result.videoGenerated ? 'Video Done' : 'Generate Video'}
                            </button>

                            <button
                              onClick={() => handleSaveSongCampaign(result)}
                              disabled={savingCampaign === result.songId || result.assetSaved}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-40 ml-auto"
                            >
                              {savingCampaign === result.songId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : result.assetSaved ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              {result.assetSaved ? 'Saved' : 'Save Campaign'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error display */}
                      {expandedSong === result.songId && result.status === 'failed' && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-red-400">{result.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// Helper Sub-Components
// ════════════════════════════════════════════

function StatusBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
      done
        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
        : 'bg-white/5 text-white/20 border border-white/5'
    }`}>
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-black/20 rounded-xl p-3 space-y-1.5 group relative">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase font-bold tracking-widest text-white/30">{label}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <p className="text-[11px] text-white/60 line-clamp-3">{value || '—'}</p>
    </div>
  );
}
