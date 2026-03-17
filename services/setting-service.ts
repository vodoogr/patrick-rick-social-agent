import { createClient } from '@/lib/supabase/client';
import { AppSettings } from '@/types';

export const SettingService = {
  async get(): Promise<AppSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();
    
    if (error) return null;
    return data;
  },

  async update(settings: Partial<AppSettings>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('app_settings')
      .update(settings)
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
  }
};

