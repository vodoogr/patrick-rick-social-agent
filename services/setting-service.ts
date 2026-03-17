import { createClient } from '@/lib/supabase/client';
import { AppSettings } from '@/types';

export const SettingService = {
  async get(userId: string): Promise<AppSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data;
  },

  async update(userId: string, settings: Partial<AppSettings>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('app_settings')
      .update(settings)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};
