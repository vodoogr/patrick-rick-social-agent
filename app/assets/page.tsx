"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, Video, Music, FileText, Search, Plus, Filter, MoreVertical, Download, Trash2 } from "lucide-react";
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // We don't have a getAll for assets yet, let's assume we fetch all or add it
      const { data, error } = await (AssetService as any).getAll();
      if (error) throw error;
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
            <option value="ALL">All Types</option>
            {Object.values(AssetType).map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
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
                     <button className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                     </button>
                     <button className="p-3 rounded-full bg-white/10 text-white hover:bg-red-500 transition-colors">
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
    </div>
  );
}
