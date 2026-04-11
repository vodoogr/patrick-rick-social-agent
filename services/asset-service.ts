import { createClient } from '@/lib/supabase/client';
import { Asset, AssetType } from '@/types';
import { ProfileService } from './profile-service';

export const AssetService = {
  async getBySong(songId: string): Promise<Asset[]> {
    const supabase = createClient();
    const profile = await ProfileService.getCurrent();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('song_id', songId)
      .eq('owner_id', profile?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Asset[];
  },

  async getAll(): Promise<Asset[]> {
    const supabase = createClient();
    const profile = await ProfileService.getCurrent();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('owner_id', profile?.id)
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
       const text = dataUrl.replace('placeholder:', '');
       const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="white" font-size="32" text-anchor="middle" font-family="sans-serif">DEV MEDIA: ${text}</text></svg>`;
       blob = new Blob([svg], { type: 'image/svg+xml' });
       fileName = fileName.endsWith('.mp4') ? fileName.replace('.mp4', '.svg') : fileName;
    } else {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    }
    const file = new File([blob], fileName, { type: blob.type });
    const storagePath = `ai_generated/${Date.now()}_${fileName}`;
    return this.upload(file, storagePath, type, songId, metadata);
  },

  async delete(assetId: string, storagePath?: string): Promise<void> {
    const supabase = createClient();
    
    // 1. Delete from database first to make UI optimistic, or delete from storage first.
    // If we have a storage path, delete the physical file.
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('assets')
        .remove([storagePath]);
      if (storageError) console.error("Error removing file from storage:", storageError);
    }
    
    // 2. Delete database record
    const { error: dbError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);
      
    if (dbError) throw dbError;
  }
};

