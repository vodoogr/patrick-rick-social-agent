import { supabase } from './supabaseClient';
import { PostAngle, GeneratedPost, Song } from '../types/database';

export const ContentGenerator = {
  /**
   * Chooses the next angle based on the campaign day (1-7 cycle).
   */
  async getNextAngle(day: number): Promise<PostAngle | null> {
    const dayInCycle = ((day - 1) % 7) + 1;
    const { data } = await supabase
      .from('post_angles')
      .select('*')
      .eq('day_number', dayInCycle)
      .single();
    return data;
  },

  /**
   * Generates a draft post based on the song and angle.
   * In a real app, this would call an LLM. Here we simulate it.
   */
  async generateDraft(campaignId: string, song: Song, angle: PostAngle): Promise<Partial<GeneratedPost>> {
    const eraContext = `In the ${song.era} Era...`;
    
    return {
      campaign_id: campaignId,
      angle_id: angle.id,
      content_angle: angle.name,
      hook: `${eraContext} ${angle.description}`,
      caption: `Experiencing ${song.title}. ${song.emotional_summary} #PatrickRick #${song.era}Era`,
      cta: "Listen now on Spotify.",
      hashtags: ['#PatrickRick', `#${song.era}Era`, '#NewMusic'],
      subtitle_text: song.canonical_phrase || "",
      thumbnail_concept: `Cinematic visual reflecting ${song.visual_identity}`,
      video_concept: `Vertical video featuring ${song.title} audio. Visual style: ${angle.visual_style || song.era}`,
      visual_prompt: `A dreamy, high-end cinematic shot of ${song.visual_identity} in ${song.era} colors.`,
      status: 'draft',
    };
  }
};
