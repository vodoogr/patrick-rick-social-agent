import { Album, Song, Campaign } from '../types/database';

export interface CampaignGeneratorParams {
  album: Album;
  song: Song;
  existingCampaigns?: Campaign[];
}

export interface GeneratedCampaign {
  campaign_hook: string;
  caption: string;
  hashtags: string;
  campaign_concept: string;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `Failed to generate content (${response.status})`);
  }

  const data = await response.json();
  return data.text.trim();
}

/**
 * Generates the entire campaign package in a single call to save on API quota
 * and maintain creative cohesion across all assets.
 */
export async function generateFullCampaign(params: CampaignGeneratorParams): Promise<GeneratedCampaign & {
  song_cover_prompt: string;
  video_prompt: string;
  reel_visual_prompt: string;
}> {
  const { song, album } = params;
  
  const systemPrompt = `You are a world-class Music Marketing Creative Director. 
Your task is to generate a comprehensive social media campaign pack for a song.
You must output ONLY valid JSON in the following format:
{
  "campaign_hook": "one punchy sentence",
  "caption": "2-3 sophisticated sentences",
  "hashtags": "#tag1 #tag2 ...",
  "campaign_concept": "2 sentences describing the narrative arc",
  "song_cover_prompt": "detailed Imagen 4 prompt for a 1:1 cover",
  "video_prompt": "detailed Veo 3.1 prompt for a 9:16 cinematic video",
  "reel_visual_prompt": "detailed Imagen 4 prompt for a 9:16 high-impact thumbnail"
}`;

  const userPrompt = `Generate a campaign pack for:
Song: ${song.title}
Album: ${album.title} (${album.era} Era)
Emotional Core: ${song.creative_dna?.emotional_summary || 'N/A'}
Visual ID: ${song.creative_dna?.visual_identity || 'N/A'}
Symbolism: ${song.creative_dna?.symbolism?.join(', ') || 'N/A'}
Tone: ${song.creative_dna?.campaign_tone || 'N/A'}
Themes: ${song.creative_dna?.themes?.join(', ') || 'N/A'}`;

  const rawResult = await callGemini(systemPrompt, userPrompt);
  
  try {
    // Attempt to extract JSON if Gemini wrapped it in markdown blocks
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    const data = JSON.parse(jsonStr);
    
    return {
      campaign_hook: data.campaign_hook || "",
      caption: data.caption || "",
      hashtags: data.hashtags || "",
      campaign_concept: data.campaign_concept || "",
      song_cover_prompt: data.song_cover_prompt || "",
      video_prompt: data.video_prompt || "",
      reel_visual_prompt: data.reel_visual_prompt || ""
    };
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", rawResult);
    throw new Error("Gemini returned invalid campaign data format.");
  }
}

// Keep individual functions for specialized regeneration, but wrapped in single calls
export async function generateCampaignHook(params: CampaignGeneratorParams): Promise<string> {
  const result = await generateFullCampaign(params);
  return result.campaign_hook;
}

export async function generateCampaignCaption(params: CampaignGeneratorParams): Promise<string> {
  const result = await generateFullCampaign(params);
  return result.caption;
}

export async function generateCampaignHashtags(params: CampaignGeneratorParams): Promise<string> {
  const result = await generateFullCampaign(params);
  return result.hashtags;
}

export async function generateCampaignConcept(params: CampaignGeneratorParams): Promise<string> {
  const result = await generateFullCampaign(params);
  return result.campaign_concept;
}


