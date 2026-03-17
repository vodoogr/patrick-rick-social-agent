import { createAdminClient } from '@/lib/supabase/server';
import { CampaignStatus } from '@/types';
import { CampaignEngine } from './campaign-engine';

export const SchedulerService = {
  async processDailyUpdate() {
    const supabase = createAdminClient();

    // 1. Increment days via RPC for all active campaigns
    const { error: incError } = await supabase.rpc('increment_current_campaign_day');
    if (incError) throw incError;

    // 2. Find campaigns needing generation
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('status', CampaignStatus.ACTIVE);

    if (!campaigns) return;

    // 3. Generate next post for each active campaign
    for (const campaign of campaigns) {
      await CampaignEngine.generateNextPost(campaign.id);
    }
  }
};

