import { createClient } from '@/lib/supabase/client';
import { PostStatus, PlatformName, PublishLog } from '@/types';

export const PublishService = {
  async publishToPlatform(postId: string, platform: PlatformName): Promise<void> {
    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // 1. Log attempt
    await supabase.from('publish_logs').insert({
      post_id: postId,
      platform,
      success: false,
      response_message: `Starting publish process for ${platform}`,
      owner_id: userId,
      attempted_at: new Date().toISOString()
    });

    // 2. Logic for external API (deferred)
    console.log(`Publishing post ${postId} to ${platform}...`);

    // 3. Update status
    await supabase.from('post_platforms')
      .update({ publish_status: PostStatus.QUEUED })
      .match({ post_id: postId, platform });
  },

  async getLogs(): Promise<PublishLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('publish_logs')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
      .order('attempted_at', { ascending: false });

    if (error) throw error;
    return data as PublishLog[];
  }
};

