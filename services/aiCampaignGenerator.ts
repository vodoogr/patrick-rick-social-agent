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

export async function generateCampaignHook(params: CampaignGeneratorParams): Promise<string> {
  const { song, album } = params;
  const canonicalPhrase = album.creative_dna?.canonical_phrase || song.title;
  await new Promise(r => setTimeout(r, 800));
  return `"Some nights are not dark. They are waiting for light." - inspired by ${canonicalPhrase}`;
}

export async function generateCampaignCaption(params: CampaignGeneratorParams): Promise<string> {
  const { song } = params;
  const emotionalSummary = song.creative_dna?.emotional_summary || 'emotional journey';
  await new Promise(r => setTimeout(r, 1200));
  return `There is a moment between the notes where everything stands still. This song captures the ${emotionalSummary}. Listen closely, because sometimes the quietest moments echo the loudest. Join us on this journey.`;
}

export async function generateCampaignHashtags(params: CampaignGeneratorParams): Promise<string> {
  const { song, album } = params;
  const era = album.era || 'Pop';
  const themes = song.creative_dna?.themes || ['EmotionalMusic'];
  await new Promise(r => setTimeout(r, 500));
  
  const baseTags = ['#PatrickRick', '#CinematicPop', `#${era}Era`];
  const themeTags = themes.map(t => `#${t.replace(/\s+/g, '')}`);
  
  return [...baseTags, ...themeTags, '#LateNightPop', '#NewMusic'].join(' ').substring(0, 150);
}

export async function generateCampaignConcept(params: CampaignGeneratorParams): Promise<string> {
  const { song, album } = params;
  const tone = song.creative_dna?.campaign_tone || 'emotionally intelligent adult pop';
  await new Promise(r => setTimeout(r, 1000));
  return `A refined, ${tone} campaign focusing on the transition from darkness to light. It relies on subtle storytelling to draw the listener in, using elegance and restraint to slowly reveal the track's emotional core.`;
}

export async function generateFullCampaign(params: CampaignGeneratorParams): Promise<GeneratedCampaign> {
  const [hook, caption, hashtags, concept] = await Promise.all([
    generateCampaignHook(params),
    generateCampaignCaption(params),
    generateCampaignHashtags(params),
    generateCampaignConcept(params)
  ]);

  return {
    campaign_hook: hook,
    caption: caption,
    hashtags: hashtags,
    campaign_concept: concept
  };
}
