import { supabase } from './supabaseClient';
import { Campaign, CampaignStatus } from '../types/database';

export const CampaignEngine = {
  /**
   * Starts a new campaign for a song and pauses any other active campaigns.
   */
  async startCampaign(songId: string, userId: string): Promise<{ data: Campaign | null; error: any }> {
    // 1. Deactivate current active campaign
    await supabase
      .from('campaigns')
      .update({ is_current: false, status: 'paused' })
      .eq('user_id', userId)
      .eq('is_current', true);

    // 2. Check if there's already a campaign for this song
    const { data: existing } = await supabase
      .from('campaigns')
      .select('*')
      .eq('song_id', songId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ is_current: true, status: 'active', campaign_day: existing.campaign_day || 1 })
        .eq('id', existing.id)
        .select()
        .single();
      return { data, error };
    }

    // 3. Create new campaign
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        song_id: songId,
        user_id: userId,
        status: 'active',
        is_current: true,
        campaign_day: 1,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Increments the campaign day and returns the campaign.
   */
  async incrementDay(campaignId: string): Promise<{ data: Campaign | null; error: any }> {
    const { data, error } = await supabase
      .rpc('increment_campaign_day', { row_id: campaignId });
    
    // Fallback if RPC doesn't exist yet (simulated)
    if (error) {
       const { data: campaign } = await supabase.from('campaigns').select('campaign_day').eq('id', campaignId).single();
       if (campaign) {
         return await supabase
           .from('campaigns')
           .update({ campaign_day: (campaign.campaign_day || 0) + 1 })
           .eq('id', campaignId)
           .select()
           .single();
       }
    }

    return { data, error };
  },

  /**
   * Gets the active campaign for a user.
   */
  async getActiveCampaign(userId: string): Promise<Campaign | null> {
    const { data } = await supabase
      .from('campaigns')
      .select('*, songs(*)')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();
    return data as any;
  }
};
