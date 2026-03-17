import { createClient } from '@/lib/supabase/client';
import { Song } from '@/types';

export const SongService = {
  async getAll(): Promise<Song[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getBySlug(slug: string): Promise<Song | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) return null;
    return data;
  },

  async create(song: Partial<Song>): Promise<Song> {
    const supabase = createClient();
    
    // owner_id is handled by RLS/Trigger but good to be explicit if needed
    const { data, error } = await supabase
      .from('songs')
      .insert(song)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async toggleActive(id: string, is_active: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('songs')
      .update({ is_active })
      .eq('id', id);
    
    if (error) throw error;
  }
};

