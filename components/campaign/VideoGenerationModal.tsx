"use client";

import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, UploadCloud, Video, Sparkles } from "lucide-react";
import { AssetService } from "@/services/asset-service";
import { Asset, AssetType } from "@/types";

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  onGenerate: (referenceImage?: string | File) => void;
  promptText: string;
}

export function VideoGenerationModal({ isOpen, onClose, songId, onGenerate, promptText }: VideoGenerationModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && songId) {
      loadAssets();
    } else {
      setSelectedAsset(null);
      setUploadedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen, songId]);

  const loadAssets = async () => {
    try {
      setLoadingAssets(true);
      const allAssets = await AssetService.getBySong(songId);
      const visualAssets = allAssets.filter(a => 
        [AssetType.SONG_COVER, AssetType.IMAGE, AssetType.REEL_VISUAL].includes(a.asset_type)
      );
      setAssets(visualAssets);
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSelectedAsset(null);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setUploadedFile(null);
    const url = asset.storage_path.startsWith('http') || asset.storage_path.startsWith('data:') 
      ? asset.storage_path 
      : AssetService.getPublicUrl(asset.storage_path);
    setPreviewUrl(url);
  };

  const clearSelection = () => {
    setSelectedAsset(null);
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleGenerate = () => {
    if (uploadedFile) {
      onGenerate(uploadedFile); // pass file
    } else if (selectedAsset && previewUrl) {
      onGenerate(previewUrl); // pass url
    } else {
      onGenerate(); // pure text to video
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold tracking-tight">Generate Campaign Video</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-white/60">
            For better visual consistency, choose a start frame for this video. You can select a previously generated song cover from your assets or upload a new image.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Sources */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40">Select Existing Asset</h4>
              {loadingAssets ? (
                <div className="h-32 flex items-center justify-center border border-white/5 rounded-2xl bg-white/[0.02]">
                  <span className="text-white/20 text-xs font-bold uppercase">Loading...</span>
                </div>
              ) : assets.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {assets.map(asset => {
                    const url = asset.storage_path.startsWith('http') || asset.storage_path.startsWith('data:') 
                      ? asset.storage_path : AssetService.getPublicUrl(asset.storage_path);
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <button
                        key={asset.id}
                        onClick={() => handleAssetSelect(asset)}
                        className={`aspect-square relative rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-500 scale-95' : 'border-transparent hover:border-white/20'}`}
                      >
                        <img src={url} alt={asset.file_name || "asset"} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border border-white/5 rounded-2xl bg-white/[0.02]">
                  <span className="text-white/20 text-xs font-bold uppercase">No Visual Assets</span>
                </div>
              )}

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-xs font-bold uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40">Upload Reference</h4>
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/30 transition-all group">
                <UploadCloud className="w-6 h-6 text-white/30 group-hover:text-white/50 mb-2" />
                <span className="text-xs text-white/40 font-bold">Drop or click to upload</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* Right: Preview & Action */}
            <div className="flex flex-col h-full space-y-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40">Selected Start Frame</h4>
              <div className="flex-1 border border-white/10 rounded-2xl bg-black/40 overflow-hidden relative flex items-center justify-center min-h-[200px]">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={clearSelection}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/60 hover:text-white hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">None selected</p>
                    <p className="text-xs text-white/40 mt-1">Video will be fully AI generated</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {previewUrl ? "Generate Image-To-Video" : "Generate Text-To-Video"}
          </button>
        </div>
      </div>
    </div>
  );
}
