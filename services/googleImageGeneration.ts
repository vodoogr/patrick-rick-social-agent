/**
 * Google Image Generation Service
 * Uses Google's Imagen API via Vertex AI for generating still image assets.
 * 
 * This service handles:
 * - Song cover concept images
 * - Reel thumbnail visuals
 * - Any still image campaign asset
 */

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  style?: 'photographic' | 'cinematic' | 'digital_art' | 'illustration';
  sampleCount?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  mimeType: string;
  prompt: string;
  provider: 'google';
  model: string;
  generatedAt: string;
}

export const GoogleImageGeneration = {

  /**
   * Generate an image using Google's Imagen API.
   * Calls the server-side API route to avoid exposing credentials client-side.
   */
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const response = await fetch('/api/generate/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Image generation failed (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Generate a song cover image. Uses 1:1 aspect ratio.
   */
  async generateSongCover(prompt: string): Promise<ImageGenerationResult> {
    return this.generate({
      prompt,
      aspectRatio: '1:1',
      style: 'cinematic',
      negativePrompt: 'text, watermark, logo, blurry, low quality, amateur',
    });
  },

  /**
   * Generate a reel thumbnail. Uses 9:16 vertical aspect ratio.
   */
  async generateReelThumbnail(prompt: string): Promise<ImageGenerationResult> {
    return this.generate({
      prompt,
      aspectRatio: '9:16',
      style: 'cinematic',
      negativePrompt: 'text, watermark, logo, blurry, low quality, amateurish',
    });
  },
};
