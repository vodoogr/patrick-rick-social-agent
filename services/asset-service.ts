import { createClient } from '@/lib/supabase/client';
import { Asset, AssetType } from '@/types';

export const AssetService = {
  async getBySong(songId: string): Promise<Asset[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('song_id', songId);
    
    if (error) throw error;
    return data || [];
  },

  async upload(file: File, path: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(path, file);
    
    if (error) throw error;
    return data.path;
  }
};
