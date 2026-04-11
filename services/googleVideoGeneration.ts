/**
 * Google Video Generation Service
 * Uses Google's Veo API via Vertex AI for generating video assets.
 * 
 * This service handles:
 * - Campaign video generation (vertical 9:16 for reels/shorts)
 * - Video prompt-based generation
 */

export interface VideoGenerationRequest {
  prompt: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  durationSeconds?: 5 | 10 | 15;
  style?: 'cinematic' | 'documentary' | 'artistic';
}

export interface VideoGenerationResult {
  videoUrl: string;
  mimeType: string;
  prompt: string;
  provider: 'google';
  model: string;
  durationSeconds: number;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
}

export const GoogleVideoGeneration = {

  /**
   * Generate a video using Google's Veo API.
   * Calls the server-side API route to avoid exposing credentials client-side.
   */
  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const response = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Video generation failed (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Generate a campaign video. Defaults to 9:16 vertical for social platforms.
   */
  async generateCampaignVideo(prompt: string): Promise<VideoGenerationResult> {
    return this.generate({
      prompt,
      aspectRatio: '9:16',
      durationSeconds: 10,
      style: 'cinematic',
    });
  },
};
