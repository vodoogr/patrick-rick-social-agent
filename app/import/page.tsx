"use client";

import { useState } from "react";
import { 
  FolderSync, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Music2, 
  Image as ImageIcon, 
  FileQuestion,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { generateImportPreview } from "@/app/actions/drive-actions";
import { AlbumImportPreview, TrackCandidate } from "@/types/import";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { AssetService } from "@/services/asset-service";
import { ProfileService } from "@/services/profile-service";
import { SongEra, ReleaseStatus, AssetType } from "@/types/enums";

export default function ImportPage() {
  const router = useRouter();
  const [folderIdInput, setFolderIdInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AlbumImportPreview | null>(null);

  const updateTrack = (index: number, field: keyof TrackCandidate, value: any) => {
    if (!preview) return;
    const newTracks = [...preview.trackCandidates];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setPreview({ ...preview, trackCandidates: newTracks });
  };

  const toggleSkip = (index: number) => {
    if (!preview) return;
    const track = preview.trackCandidates[index];
    const newStatus = track.status === 'skip' ? (track.existingSongId ? 'update' : 'new') : 'skip';
    updateTrack(index, 'status', newStatus);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderIdInput.trim()) return;

    // Clean up input: extract ID if it's a full URL
    let extractedId = folderIdInput.trim();
    const match = extractedId.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    } else if (extractedId.includes("?id=")) {
      const parts = extractedId.split("?id=");
      extractedId = parts[1].split("&")[0];
    }

    try {
      setScanning(true);
      setError(null);
      setPreview(null);
      const data = await generateImportPreview(extractedId);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred scanning the folder.");
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      setImporting(true);
      setError(null);

      const profile = await ProfileService.getCurrent();
      if (!profile) throw new Error("Could not find active profile to assign ownership.");

      let albumId = preview.existingAlbumId;

      // 1. Create or Update Album
      if (preview.status === 'new' || !albumId) {
        const newAlbum = await AlbumService.create({
          owner_id: profile.id,
          title: preview.inferredAlbumTitle,
          slug: preview.inferredAlbumTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
          era: SongEra.PRESENT,
          drive_folder_id: preview.folderId,
        });
        albumId = newAlbum.id;
      } else {
        await AlbumService.update(albumId, {
          drive_folder_id: preview.folderId
        });
      }

      if (!albumId) throw new Error("Failed to resolve Album ID.");

      // 2. Handle Cover Asset
      if (preview.coverCandidate) {
        const coverUrl = preview.coverCandidate.driveFile.thumbnailLink || preview.coverCandidate.driveFile.webContentLink;
        if (coverUrl) {
          await AlbumService.update(albumId, { cover_path: coverUrl });
        }
        await AssetService.create({
          owner_id: profile.id,
          album_id: albumId,
          asset_type: AssetType.COVER,
          storage_path: 'external',
          external_source_url: preview.coverCandidate.driveFile.webContentLink,
          file_name: preview.coverCandidate.driveFile.name,
          mime_type: preview.coverCandidate.driveFile.mimeType,
          size_bytes: parseInt(preview.coverCandidate.driveFile.size?.toString() || '0', 10) || 0
        });
      }

      // 3. Create or Update Songs
      for (const track of preview.trackCandidates) {
        if (track.status === 'skip') continue;

        if (track.status === 'update' && track.existingSongId) {
          await SongService.update(track.existingSongId, {
            drive_file_id: track.driveFile.id,
            audio_path: track.driveFile.webContentLink
          });
        } else {
          await SongService.create({
            owner_id: profile.id,
            title: track.inferredTitle,
            slug: track.inferredTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
            album_id: albumId,
            track_number: track.inferredTrackNumber ?? 1,
            drive_file_id: track.driveFile.id,
            audio_path: track.driveFile.webContentLink,
            era: SongEra.PRESENT,
            release_status: ReleaseStatus.UNRELEASED
          });
        }
      }

      // All done!
      router.push(`/albums/${albumId}`);

    } catch (err: any) {
      setError(err.message || "Failed to finalize import.");
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drive Import</h2>
          <p className="text-white/40 text-sm mt-1">Connect a Google Drive folder to ingest assets to your catalog.</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass border border-white/5 rounded-3xl p-8">
        <form onSubmit={handleScan} className="max-w-2xl mx-auto space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">
            Google Drive Folder URL or ID
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={folderIdInput}
                onChange={e => setFolderIdInput(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={scanning || !folderIdInput.trim()}
              className="px-8 py-4 rounded-xl bg-white text-zinc-950 font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />}
              Scan Folder
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Preview UI */}
      {preview && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="glass border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
            {/* Header: Album mapping */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-48 aspect-square rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                {(preview.coverCandidate?.driveFile.thumbnailLink || preview.coverCandidate?.driveFile.webContentLink) ? (
                  <img src={preview.coverCandidate.driveFile.thumbnailLink || preview.coverCandidate.driveFile.webContentLink} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/20" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${
                    preview.status === 'new' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'
                  }`}>
                    {preview.status === 'new' ? 'New Album' : 'Update Existing Album'}
                  </span>
                  <p className="text-xs text-white/30 truncate">Folder ID: {preview.folderId}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Detected Album Title</label>
                  <input 
                    type="text" 
                    value={preview.inferredAlbumTitle} 
                    onChange={e => setPreview({ ...preview, inferredAlbumTitle: e.target.value })}
                    className="w-full bg-transparent text-3xl md:text-5xl font-bold tracking-tight border-b border-white/10 pb-2 focus:outline-none focus:border-white/30 transition-colors hover:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Tracklist Preview */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Music2 className="w-5 h-5 text-white/40" />
                Detected Tracks ({preview.trackCandidates.length})
              </h3>
              
              {preview.trackCandidates.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {preview.trackCandidates.map((track, i) => (
                    <div key={track.driveFile.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${track.status === 'skip' ? 'bg-white/5 border-white/5 opacity-50 grayscale' : 'bg-white/10 border-white/10'}`}>
                      {/* Checkbox */}
                      <button 
                        onClick={() => toggleSkip(i)} 
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                          track.status !== 'skip' ? 'bg-green-500 border-green-500' : 'bg-transparent border-white/20 hover:border-white/40'
                        }`}
                      >
                        {track.status !== 'skip' && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </button>

                      <div className="w-12">
                        <input
                          type="number"
                          value={track.inferredTrackNumber || ''}
                          onChange={e => updateTrack(i, 'inferredTrackNumber', e.target.value ? parseInt(e.target.value) : null)}
                          disabled={track.status === 'skip'}
                          className="w-full bg-transparent text-sm font-bold text-white/50 text-center border-b border-white/5 focus:border-white/30 focus:outline-none focus:text-white transition-colors"
                          placeholder="#"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          value={track.inferredTitle} 
                          onChange={e => updateTrack(i, 'inferredTitle', e.target.value)}
                          disabled={track.status === 'skip'}
                          className="w-full bg-transparent text-sm font-bold truncate focus:outline-none border-b border-transparent focus:border-white/30 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 truncate">{track.driveFile.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className={`hidden sm:flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                            track.status === 'skip' ? 'border-white/10 text-white/30 bg-transparent' :
                            track.status === 'new' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'
                          }`}>
                            {track.status === 'skip' ? 'Skipped' : track.status === 'new' ? '+ Create' : '↻ Update'}
                          </span>
                          {track.driveFile.webViewLink && (
                            <a 
                              href={track.driveFile.webViewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white"
                              title="Open in Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-sm font-bold text-white/40">No audio files found in this folder.</p>
                </div>
              )}
            </div>

            {/* Other Files */}
            {preview.otherFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white/40">
                  <FileQuestion className="w-4 h-4" />
                  Unmapped Files ({preview.otherFiles.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {preview.otherFiles.slice(0, 8).map(file => (
                    <div key={file.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold truncate" title={file.name}>{file.name}</p>
                      <p className="text-[8px] text-white/30 truncate">{file.mimeType}</p>
                    </div>
                  ))}
                  {preview.otherFiles.length > 8 && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <p className="text-[10px] font-bold text-white/40">+{preview.otherFiles.length - 8} more</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-8 flex items-center justify-end gap-4 border-t border-white/10">
              <button 
                onClick={() => setPreview(null)}
                disabled={importing}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={importing}
                className="px-8 py-3 rounded-xl bg-green-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {importing ? "Importing..." : "Import to Catalog"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
