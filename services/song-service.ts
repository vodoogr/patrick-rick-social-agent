import { createClient } from '@/lib/supabase/client';
import { Song, SongWithAlbum, SongCreativeDNA, SongEra, Campaign, GeneratedPost } from '@/types';
import { CampaignStatus } from '@/types/enums';

const PAGE_SIZE = 24;

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

  async getById(id: string): Promise<SongWithAlbum | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(*)')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as SongWithAlbum | null;
  },

  async getByAlbum(albumId: string): Promise<Song[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('album_id', albumId)
      .order('track_number', { ascending: true });
    
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

  async search(query: string, filters?: { era?: SongEra; albumId?: string; campaignStatus?: CampaignStatus; page?: number }): Promise<{ songs: Song[]; total: number }> {
    const supabase = createClient();
    const page = filters?.page ?? 0;

    let q = supabase
      .from('songs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.campaignStatus) {
      const { data: campData } = await supabase.from('campaigns')
        .select('song_id')
        .eq('status', filters.campaignStatus)
        .eq('is_current', true);
      const songIds = campData?.map((c: any) => c.song_id) || [];
      if (songIds.length === 0) {
        return { songs: [], total: 0 };
      }
      q = q.in('id', songIds);
    }

    q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (query) {
      q = q.ilike('title', `%${query}%`);
    }
    if (filters?.era) {
      q = q.eq('era', filters.era);
    }
    if (filters?.albumId) {
      q = q.eq('album_id', filters.albumId);
    }

    const { data, count, error } = await q;
    if (error) throw error;
    return { songs: data || [], total: count || 0 };
  },

  async create(song: Partial<Song>): Promise<Song> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .insert(song)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Song>): Promise<Song> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCreativeDNA(id: string, dna: SongCreativeDNA): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('songs')
      .update({ creative_dna: dna })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCampaignHistory(songId: string): Promise<Campaign[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('song_id', songId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPostHistory(songId: string): Promise<GeneratedPost[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('generated_posts')
      .select('*')
      .eq('song_id', songId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data || [];
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
