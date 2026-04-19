import { Album, Song } from '../types/database';

export interface VideoPromptParams {
  album: Album;
  song: Song;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate visual prompt');
  }

  const data = await response.json();
  return data.text.trim();
}

export async function generateVideoPrompt(params: VideoPromptParams): Promise<string> {
  const { album, song } = params;

  return callGemini(
    "You are a specialized AI prompt engineer for Google Veo 3.1. Create a highly detailed, cinematic video prompt (50-100 words). Describe camera movement, lighting, and specific actions. Output ONLY the prompt string.",
    `Song: ${song.title}
Album: ${album.title} (${album.era} Era)
Emotional Core: ${song.creative_dna?.emotional_summary || 'N/A'}
Visual Identity: ${song.creative_dna?.visual_identity || 'N/A'}
Themes: ${song.creative_dna?.themes?.join(', ') || 'N/A'}`
  );
}

export async function generateReelThumbnailVisual(params: VideoPromptParams): Promise<string> {
  const { song, album } = params;
  
  return callGemini(
    "You are a specialized AI prompt engineer for Imagen 4. Create a prompt for a high-impact REEL thumbnail visual in 9:16 aspect ratio. Focus on vertical composition and stopping power. Output ONLY the prompt string.",
    `Song: ${song.title}
Era: ${album.era}
Campaign Tone: ${song.creative_dna?.campaign_tone || 'N/A'}
Visual ID: ${song.creative_dna?.visual_identity || 'N/A'}`
  );
}

