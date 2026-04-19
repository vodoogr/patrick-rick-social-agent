import { Album, Song } from '../types/database';

export interface CoverGeneratorParams {
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

export async function generateSongCoverConcept(params: CoverGeneratorParams): Promise<string> {
  const { song, album } = params;
  
  return callGemini(
    "You are a specialized AI prompt engineer for Imagen 4. Create a highly detailed, evocative visual prompt (1 paragraph) for a song cover. Focus on lighting, textures, and emotional atmosphere. Output ONLY the prompt string.",
    `Song: ${song.title}
Album: ${album.title}
Era: ${album.era} (Use this for color palette/aesthetic)
Visual DNA: ${song.creative_dna?.visual_identity || 'modern aesthetic'}
Symbolism: ${song.creative_dna?.symbolism?.join(', ') || 'elegant minimal'}
Themes: ${song.creative_dna?.themes?.join(', ') || 'N/A'}`
  );
}
