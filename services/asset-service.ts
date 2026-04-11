import { createClient } from '@/lib/supabase/client';
import { Asset, AssetType } from '@/types';

export const AssetService = {
  async getBySong(songId: string): Promise<Asset[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('song_id', songId)
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Asset[];
  },

  async getAll(): Promise<Asset[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Asset[];
  },

  getPublicUrl(path: string): string {
    const supabase = createClient();
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    return data.publicUrl;
  },

  async upload(file: File, path: string, type: AssetType, songId?: string, metadata?: any): Promise<Asset> {
    const supabase = createClient();
    
    // 1. Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(path, file);
    
    if (uploadError) throw uploadError;

    // 2. Register in database
    const { data, error } = await supabase
      .from('assets')
      .insert({
        owner_id: (await supabase.auth.getUser()).data.user?.id,
        storage_path: uploadData.path,
        asset_type: type,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        song_id: songId,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async create(assetData: Partial<Asset>): Promise<Asset> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('assets')
      .insert({
        owner_id: assetData.owner_id || (await supabase.auth.getUser()).data.user?.id,
        ...assetData
       })
      .select()
      .single();

    if (error) throw error;
    return data as Asset;
  },

  async uploadFromDataUrl(dataUrl: string, fileName: string, type: AssetType, songId?: string, metadata?: any): Promise<Asset> {
    let blob: Blob;
    if (dataUrl.startsWith('data:')) {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    } else if (dataUrl.startsWith('placeholder:')) {
      blob = new Blob([dataUrl], { type: 'text/plain' });
    } else {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    }
    const file = new File([blob], fileName, { type: blob.type });
    const storagePath = `ai_generated/${Date.now()}_${fileName}`;
    return this.upload(file, storagePath, type, songId, metadata);
  }
};

