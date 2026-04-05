import { Album, Song } from '../types/database';

export interface VideoPromptParams {
  album: Album;
  song: Song;
}

export async function generateVideoPrompt(params: VideoPromptParams): Promise<string> {
  const { album, song } = params;

  const themes = song.creative_dna?.themes?.join(', ') ?? 'emotional restraint';
  const mood = song.creative_dna?.emotional_summary ?? 'elegant composition';

  // AI Mock sleep
  await new Promise(r => setTimeout(r, 1200));

  return `Cinematic night scene with a solitary man walking through a dark corridor toward warm golden sunrise light, reflective modern architecture, slow camera push, ${themes}, ${mood}.`;
}

export async function generateReelThumbnailVisual(params: VideoPromptParams): Promise<string> {
  const { song } = params;
  
  const visualIdentity = song.creative_dna?.visual_identity ?? 'cinematic close-up portrait';
  const campaignTone = song.creative_dna?.campaign_tone ?? 'emotional';

  // AI Mock sleep
  await new Promise(r => setTimeout(r, 1000));

  return `Vertical aspect ratio composition. 9:16. ${visualIdentity}, visually striking, ${campaignTone} framing, elegant typography placeholder, modern sophisticated style.`;
}
