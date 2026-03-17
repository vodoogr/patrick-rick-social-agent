import { createClient } from '@/lib/supabase/client';
import { 
  GeneratedPost, 
  PostStatus, 
  Campaign, 
  PostAngle, 
  PlatformName, 
  AppSettings,
  PublishMode
} from '@/types';
import { SettingService } from './setting-service';

export const CampaignEngine = {
  /**
   * Orchestrates the generation of the next post for a campaign.
   * Can be called manually or via scheduler.
   */
  async generateNextPost(campaignId: string): Promise<string> {
    const supabase = createClient();
    
    // 1. Fetch campaign and song details
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*, songs(*)')
      .eq('id', campaignId)
      .single();
    
    if (cError || !campaign) throw new Error('Campaign not found');

    // 2. Choose the next angle
    const angle = await this.chooseNextAngle(campaign.song_id);
    
    // 3. Fetch app settings for platform enablement and timing
    const settings = await SettingService.get();
    if (!settings) throw new Error('App settings not found');

    // 4. Determine scheduled time
    const scheduledTime = this.calculateScheduledTime(settings.daily_post_time);

    // 5. Create the generated post draft
    const { data: post, error: pError } = await supabase
      .from('generated_posts')
      .insert({
        owner_id: campaign.owner_id,
        campaign_id: campaign.id,
        song_id: campaign.song_id,
        angle_id: angle.id,
        campaign_day: campaign.day_number,
        status: PostStatus.GENERATED,
        approval_required: settings.publish_mode === PublishMode.APPROVAL,
        scheduled_for: scheduledTime,
        title: `Day ${campaign.day_number}: ${angle.label}`,
        hook: `[HOOK: Emotional insight into ${campaign.songs.title} for ${angle.label}]`,
        caption: `[CAPTION: Narrative depth for ${campaign.songs.era} era. Using ${campaign.songs.canonical_phrase || 'the song'} as anchor.]`,
        cta: `[CTA: Invitation to listen to ${campaign.songs.title}]`,
        hashtags: settings.default_hashtags || '#PatrickRick #SocialCampaign',
        subtitle_text: `[SUBTITLES: Narrative fragments from ${campaign.songs.title}]`,
        thumbnail_concept: `[THUMBNAIL: Visual identity ${campaign.songs.visual_identity || 'Cinematic'}]`,
        video_concept: `[VIDEO: Atmospheric ${campaign.songs.era} visual style]`,
        visual_prompt: `[PROMPT: ${campaign.songs.visual_identity || 'Cinematic'} style, ${campaign.songs.era} color palette]`
      })
      .select()
      .single();

    if (pError || !post) throw pError || new Error('Failed to create post');

    // 6. Create platform-specific entries
    await this.createPlatformEntries(post.id, settings);

    return post.id;
  },

  /**
   * Logic to choose the next angle avoiding recent repeats.
   */
  async chooseNextAngle(songId: string): Promise<PostAngle> {
    const supabase = createClient();
    
    // Get 3 most recent angle IDs for this song
    const { data: recentPosts } = await supabase
      .from('generated_posts')
      .select('angle_id')
      .eq('song_id', songId)
      .not('angle_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    const excludedIds = (recentPosts || []).map((p: any) => p.angle_id);

    // Get available angles
    const { data: angles, error } = await supabase
      .from('post_angles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !angles || angles.length === 0) throw new Error('No active angles found');

    // Filter out recently used ones
    const available = angles.filter((a: PostAngle) => !excludedIds.includes(a.id));
    
    // If all exhausted, just pick the one with lowest sort order (or oldest)
    return available.length > 0 ? available[0] : angles[0];
  },

  /**
   * Creates platform rows based on enabled hubs in settings.
   */
  async createPlatformEntries(postId: string, settings: AppSettings) {
    const supabase = createClient();
    const platforms = [];

    if (settings.enable_tiktok) platforms.push(PlatformName.TIKTOK);
    if (settings.enable_instagram_reels) platforms.push(PlatformName.INSTAGRAM_REELS);
    if (settings.enable_youtube_shorts) platforms.push(PlatformName.YOUTUBE_SHORTS);

    if (platforms.length === 0) return;

    const entries = platforms.map(platform => ({
        post_id: postId,
        platform,
        publish_status: PostStatus.GENERATED
    }));

    const { error } = await supabase
      .from('post_platforms')
      .insert(entries);

    if (error) throw error;
  },

  /**
   * Calculates the next occurrence of the daily post time.
   */
  calculateScheduledTime(dailyTime: string): string {
    const [hours, minutes] = dailyTime.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled.toISOString();
  }
};
