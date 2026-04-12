"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, Video, Music, FileText, Search, Plus, Filter, MoreVertical, Download, Trash2, Eye, X } from "lucide-react";
import { AssetService } from "@/services/asset-service";
import { Asset, AssetType } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const typeIcons: Record<AssetType, any> = {
  [AssetType.IMAGE]: ImageIcon,
  [AssetType.VIDEO]: Video,
  [AssetType.CAMPAIGN_VIDEO]: Video,
  [AssetType.AUDIO]: Music,
  [AssetType.SUBTITLE]: FileText,
  [AssetType.THUMBNAIL]: ImageIcon,
  [AssetType.COVER]: ImageIcon,
  [AssetType.SONG_COVER]: ImageIcon,
  [AssetType.REEL_VISUAL]: ImageIcon,
  [AssetType.OTHER]: FileText,
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AssetType | "ALL">("ALL");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AssetService.getAll();
      setAssets(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to delete ${asset.file_name || "this asset"}?`)) {
      return;
    }
    
    try {
      await AssetService.delete(asset.id, asset.storage_path);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err: any) {
      alert("Failed to delete asset: " + err.message);
    }
  };

  const handleDownload = (asset: Asset) => {
    const url = asset.storage_path.startsWith('http') || asset.storage_path.startsWith('data:') 
      ? asset.storage_path 
      : AssetService.getPublicUrl(asset.storage_path);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.file_name || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredAssets = filter === "ALL" ? assets : assets.filter(a => a.asset_type === filter);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creative Assets</h2>
          <p className="text-white/40 text-sm mt-1">Manage all source files, generated visuals, and audio tracks.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="h-11 px-6 rounded-2xl glass border border-white/10 font-bold text-sm bg-transparent appearance-none hover:bg-white/5 transition-all outline-none"
          >
            <option value="ALL" className="bg-zinc-900 text-white">All Types</option>
            {Object.values(AssetType).map(type => (
              <option key={type} value={type} className="bg-zinc-900 text-white">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <button className="h-11 px-6 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-zinc-200 transition-all">
            <Plus className="w-4 h-4" /> Upload Asset
          </button>
        </div>
      </div>

      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => {
            const Icon = typeIcons[asset.asset_type] || FileText;
            return (
              <div key={asset.id} className="group glass border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all">
                <div className="aspect-square bg-white/5 flex items-center justify-center relative overflow-hidden">
                  {[AssetType.IMAGE, AssetType.COVER, AssetType.SONG_COVER, AssetType.REEL_VISUAL].includes(asset.asset_type) ? (
                    <img 
                      src={asset.storage_path.startsWith('http') || asset.storage_path.startsWith('data:') ? asset.storage_path : AssetService.getPublicUrl(asset.storage_path)} 
                      alt={asset.file_name || ""} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <Icon className="w-12 h-12 text-white/20" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <button 
                        onClick={() => setPreviewAsset(asset)}
                        className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform"
                        title="Preview"
                     >
                        <Eye className="w-5 h-5" />
                     </button>
                     <button 
                        onClick={() => handleDownload(asset)}
                        className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all border border-white/10"
                        title="Download"
                     >
                        <Download className="w-5 h-5" />
                     </button>
                     <button 
                        onClick={() => handleDelete(asset)}
                        className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Delete"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold truncate">{asset.file_name || "Untitled Asset"}</p>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">{asset.asset_type}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={ImageIcon}
          title="Asset library is empty"
          description={filter !== "ALL" ? `No assets found for type ${filter}.` : "Start by uploading source audio or branding assets for Patrick Rick's eras."}
          action={filter !== "ALL" ? { label: "Show All", onClick: () => setFilter("ALL") } : undefined}
        />
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <button 
            onClick={() => setPreviewAsset(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-6">
            <div className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden border border-white/10 glass shadow-2xl">
              {[AssetType.IMAGE, AssetType.COVER, AssetType.SONG_COVER, AssetType.REEL_VISUAL].includes(previewAsset.asset_type) ? (
                <img 
                  src={previewAsset.storage_path.startsWith('http') || previewAsset.storage_path.startsWith('data:') ? previewAsset.storage_path : AssetService.getPublicUrl(previewAsset.storage_path)} 
                  alt={previewAsset.file_name || ""} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : [AssetType.VIDEO, AssetType.CAMPAIGN_VIDEO].includes(previewAsset.asset_type) ? (
                <video 
                  src={previewAsset.storage_path.startsWith('http') || previewAsset.storage_path.startsWith('data:') ? previewAsset.storage_path : AssetService.getPublicUrl(previewAsset.storage_path)} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
                />
              ) : (
                <div className="p-20 flex flex-col items-center gap-4">
                  {(typeIcons[previewAsset.asset_type] || FileText) && (
                    <div className="p-8 rounded-full bg-white/5 border border-white/10 mb-4">
                      {(() => {
                        const Icon = typeIcons[previewAsset.asset_type];
                        return <Icon className="w-16 h-16 text-white/40" />;
                      })()}
                    </div>
                  )}
                  <p className="text-white font-bold">{previewAsset.file_name}</p>
                </div>
              )}
            </div>
            
            <div className="glass p-6 rounded-3xl border border-white/10 w-full max-w-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">{previewAsset.file_name}</h4>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                  {previewAsset.asset_type.replace('_', ' ')} • Created {new Date(previewAsset.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDownload(previewAsset)}
                  className="px-6 py-3 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
