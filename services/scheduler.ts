import { createAdminClient } from '@/lib/supabase/server';
import { CampaignStatus } from '@/types';

export const SchedulerService = {
  async processDailyUpdate() {
    const supabase = createAdminClient();

    // 1. Increment days via RPC for all active campaigns
    const { error } = await supabase.rpc('increment_current_campaign_day');
    if (error) console.error('Error incrementing campaign days:', error);

    // 2. Find campaigns needing generation
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', CampaignStatus.ACTIVE);

    if (!campaigns) return;

    for (const campaign of campaigns) {
      console.log(`Processing daily update for campaign ${campaign.id}`);
      // Logic for AI generation would go here
    }
  }
};

