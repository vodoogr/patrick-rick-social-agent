import { createClient } from '@/lib/supabase/client';
import { GeneratedPost, PostStatus } from '@/types';

export const PostService = {
  async getQueue(campaignId?: string): Promise<GeneratedPost[]> {
    const supabase = createClient();
    let query = supabase.from('generated_posts').select('*');
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await supabase
      .from('generated_posts')
      .select('*')
      .order('scheduled_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async updateStatus(id: string, status: PostStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('generated_posts')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  }
};
