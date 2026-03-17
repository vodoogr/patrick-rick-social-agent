import { createClient } from '@/lib/supabase/client';
import { Campaign } from '@/types';

export const CampaignService = {
  async getActive(): Promise<Campaign | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, songs(*)')
      .eq('is_current', true)
      .single();
    
    if (error) return null;
    return data as any;
  },

  async startNew(songId: string): Promise<string> {
    const supabase = createClient();
    
    // Use the RPC function for atomic campaign rotation
    const { data, error } = await supabase.rpc('start_campaign', {
      p_song_id: songId
    });

    if (error) throw error;
    return data; // Returns the new campaign ID
  },

  async getAll(): Promise<Campaign[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, songs(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as any;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  },

  async incrementDay(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.rpc('increment_current_campaign_day');
    if (error) throw error;
  }
};

