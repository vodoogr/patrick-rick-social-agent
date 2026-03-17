import { createClient } from '@/lib/supabase/client';
import { Campaign, CampaignStatus } from '@/types';

export const CampaignService = {
  async getActive(userId: string): Promise<Campaign | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, songs(*)')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();
    
    if (error) return null;
    return data as any;
  },

  async startNew(songId: string, userId: string): Promise<Campaign> {
    const supabase = createClient();
    
    // Deactivate others
    await supabase
      .from('campaigns')
      .update({ is_current: false, status: CampaignStatus.PAUSED })
      .eq('user_id', userId)
      .eq('is_current', true);

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        song_id: songId,
        user_id: userId,
        status: CampaignStatus.ACTIVE,
        is_current: true,
        campaign_day: 1
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
