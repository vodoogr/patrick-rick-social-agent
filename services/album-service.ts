import { createClient } from '@/lib/supabase/client';
import { Album, AlbumWithSongs, AlbumCreativeDNA, SongEra } from '@/types';

export const AlbumService = {
  async getAll(): Promise<Album[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<AlbumWithSongs | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('albums')
      .select('*, songs(*)')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (data && data.songs) {
      data.songs = (data.songs as any[]).sort(
        (a: any, b: any) => (a.track_number ?? 999) - (b.track_number ?? 999)
      );
    }
    return data as AlbumWithSongs | null;
  },

  async create(album: Partial<Album>): Promise<Album> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('albums')
      .insert(album)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Album>): Promise<Album> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('albums')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCreativeDNA(id: string, dna: AlbumCreativeDNA): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('albums')
      .update({ creative_dna: dna })
      .eq('id', id);
    
    if (error) throw error;
  },

  async search(query: string, era?: SongEra): Promise<Album[]> {
    const supabase = createClient();
    let q = supabase
      .from('albums')
      .select('*')
      .order('sort_order', { ascending: true });

    if (query) {
      q = q.ilike('title', `%${query}%`);
    }
    if (era) {
      q = q.eq('era', era);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async getSongCount(albumId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', albumId);
    
    if (error) throw error;
    return count || 0;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    
    // Eliminar las canciones vinculadas a este álbum primero (si no hay CASCADE en DB)
    await supabase
      .from('songs')
      .delete()
      .eq('album_id', id);
      
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
