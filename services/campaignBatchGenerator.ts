/**
 * Campaign Batch Generator Service
 * Orchestrates album-wide campaign generation for all songs in an album.
 */

import { Album, Song } from '@/types/database';
import { generateFullCampaign, GeneratedCampaign } from './aiCampaignGenerator';
import { generateSongCoverConcept } from './coverGenerator';
import { generateVideoPrompt, generateReelThumbnailVisual } from './videoPromptGenerator';

export interface SongCampaignResult {
  songId: string;
  songTitle: string;
  trackNumber: number | null;
  campaign: GeneratedCampaign;
  songCoverPrompt: string;
  reelVisualPrompt: string;
  videoPrompt: string;
  status: 'completed' | 'failed';
  error?: string;
  // Media generation status  
  imageGenerated: boolean;
  videoGenerated: boolean;
  assetSaved: boolean;
}

export interface AlbumBatchResult {
  albumId: string;
  albumTitle: string;
  totalSongs: number;
  completed: number;
  failed: number;
  results: SongCampaignResult[];
}

export const CampaignBatchGenerator = {

  /**
   * Generate campaign text outputs for all provided songs in an album.
   * Does NOT generate media (images/videos) — that's done per-song on demand.
   */
  async generateForAlbum(
    album: Album,
    songs: Song[],
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<AlbumBatchResult> {
    const results: SongCampaignResult[] = [];
    const total = songs.length;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      onProgress?.(i, total, song.title);

      try {
        const params = { song, album, existingCampaigns: [] };
        
        const [campaign, coverPrompt, vidPrompt, reelPrompt] = await Promise.all([
          generateFullCampaign(params),
          generateSongCoverConcept(params),
          generateVideoPrompt(params),
          generateReelThumbnailVisual(params)
        ]);

        results.push({
          songId: song.id,
          songTitle: song.title,
          trackNumber: song.track_number,
          campaign,
          songCoverPrompt: coverPrompt,
          reelVisualPrompt: reelPrompt,
          videoPrompt: vidPrompt,
          status: 'completed',
          imageGenerated: false,
          videoGenerated: false,
          assetSaved: false,
        });
      } catch (err: any) {
        results.push({
          songId: song.id,
          songTitle: song.title,
          trackNumber: song.track_number,
          campaign: { campaign_hook: '', caption: '', hashtags: '', campaign_concept: '' },
          songCoverPrompt: '',
          reelVisualPrompt: '',
          videoPrompt: '',
          status: 'failed',
          error: err.message,
          imageGenerated: false,
          videoGenerated: false,
          assetSaved: false,
        });
      }

      onProgress?.(i + 1, total, song.title);
    }

    return {
      albumId: album.id,
      albumTitle: album.title,
      totalSongs: total,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  },

  /**
   * Save a single song's batch result to the campaign system via API.
   */
  async saveSongCampaign(result: SongCampaignResult): Promise<string> {
    const response = await fetch('/api/campaigns/update-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        song_id: result.songId,
        hook: result.campaign.campaign_hook,
        caption: result.campaign.caption,
        hashtags: result.campaign.hashtags,
        campaign_concept: result.campaign.campaign_concept,
        video_prompt: result.videoPrompt,
        song_cover_prompt: result.songCoverPrompt,
        reel_visual_prompt: result.reelVisualPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save campaign');
    }

    const data = await response.json();
    return data.campaign_id || 'saved';
  },
};
