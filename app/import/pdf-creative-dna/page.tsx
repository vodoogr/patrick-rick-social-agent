"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { DNAHelixLoader } from "@/components/import/DNAHelixLoader";
import { PdfImportReviewTable } from "@/components/import/PdfImportReviewTable";
import { PdfCreativeDnaExtractor } from "@/services/pdfCreativeDnaExtractor";
import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { ProfileService } from "@/services/profile-service";
import { SongEra, ReleaseStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

export default function PdfDnaImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);
  const [importedAlbumId, setImportedAlbumId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setExtracting(true);

    try {
      const extractedData = await PdfCreativeDnaExtractor.extractTextFromFile(uploadedFile);
      const parsedUpdates = PdfCreativeDnaExtractor.parseExtractedText(extractedData.text);
      setPreview(parsedUpdates);
    } catch (err: any) {
      console.error(err);
      setError("Failed to extract data from PDF: " + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateTrackStatus = (index: number, status: 'create' | 'update' | 'skip') => {
    if (!preview) return;
    const newRows = [...preview.songRows];
    newRows[index].action = status;
    setPreview({ ...preview, songRows: newRows });
  };

  const handleUpdateTrackField = (index: number, field: string, value: any) => {
    if (!preview) return;
    const newRows = [...preview.songRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setPreview({ ...preview, songRows: newRows });
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      setImporting(true);
      setError(null);

      const profile = await ProfileService.getCurrent();
      if (!profile) throw new Error("Acceso denegado. No se encontró el perfil actual.");

      // Verify and map Era safely
      const rawEra = preview.albumUpdates.era?.toLowerCase() as SongEra;
      const validEra = Object.values(SongEra).includes(rawEra) ? rawEra : SongEra.PRESENT;

      // Handle Album Creation or Retrieval
      const albumTitle = preview.albumUpdates.albumTitle || 'Unknown Album';
      const existingAlbums = await AlbumService.search(albumTitle);
      let albumToUse = existingAlbums.find(a => a.title.toLowerCase() === albumTitle.toLowerCase());

      if (!albumToUse) {
        // Create new Album
        albumToUse = await AlbumService.create({
          owner_id: profile.id,
          title: albumTitle,
          slug: albumTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
          era: validEra,
        });
      } else if (validEra !== SongEra.PRESENT) {
        // Update era if it's specified in PDF
        albumToUse = await AlbumService.update(albumToUse.id, { era: validEra });
      }

      const newAlbumId = albumToUse.id;

      // Save Album DNA
      // If we got *any* relevant metadata, save it to the DB
      if (
        preview.albumUpdates.narrativeSummary || 
        preview.albumUpdates.canonicalPhrase || 
        preview.albumUpdates.visualIdentity ||
        preview.albumUpdates.emotionalDirection
      ) {
        await AlbumService.updateCreativeDNA(newAlbumId, {
           narrative_summary: preview.albumUpdates.narrativeSummary,
           canonical_phrase: preview.albumUpdates.canonicalPhrase,
           emotional_direction: preview.albumUpdates.emotionalDirection || preview.albumUpdates.coreEmotion,
           visual_identity: preview.albumUpdates.visualIdentity,
           visual_keywords: preview.albumUpdates.visualKeywords,
           prompt_notes: preview.albumUpdates.promptNotes
        });
      }

      const albumSongs = await SongService.getByAlbum(newAlbumId);

      // Loop through tracks and create or update them
      for (const track of preview.songRows) {
         if (track.action === 'skip') continue;

         // Identify if the song already exists
         const existingSong = albumSongs.find(s => 
            s.title.toLowerCase() === (track.songTitle || '').toLowerCase() || 
            (s.track_number !== null && track.trackNumber !== null && s.track_number === track.trackNumber)
         );

         let songId = existingSong?.id;

         if (!songId) {
             const newSong = await SongService.create({
                 owner_id: profile.id,
                 title: track.songTitle || 'Untitled Track',
                 slug: (track.songTitle || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
                 album_id: newAlbumId,
                 track_number: track.trackNumber || 1,
                 era: validEra,
                 release_status: ReleaseStatus.UNRELEASED
             });
             songId = newSong.id;
         } else {
             // Optional: update Era if missing or changed
             await SongService.update(songId, { era: validEra });
         }

         // Apply Creative DNA
         await SongService.updateCreativeDNA(songId, {
             emotional_summary: track.emotionalSummary,
             themes: track.themes,
             symbolism: track.symbolism,
             visual_identity: track.visualIdentity,
             campaign_tone: track.campaignTone,
             prompt_notes: track.promptNotes
         });
      }

      setImportedAlbumId(newAlbumId);
      setSuccess(true);
      setPreview(null);
      setFile(null);
    } catch (err: any) {
        console.error(err);
        setError("Error during final import: " + err.message);
    } finally {
        setImporting(false);
    }
  };

  if (success) {
      return (
          <div className="max-w-3xl mx-auto py-20 animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-white">Import Complete</h2>
                  <p className="text-white/50 max-w-md mx-auto">
                      Creative DNA has been successfully parsed and merged into the catalog.
                  </p>
              </div>
              <div className="flex items-center gap-4 mt-8">
                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors uppercase tracking-widest text-xs font-bold"
                  >
                      Import Another
                  </button>
                  {importedAlbumId && (
                      <button 
                        onClick={() => router.push(`/albums/${importedAlbumId}`)}
                        className="px-6 py-3 rounded-xl bg-purple-500 text-black hover:bg-purple-400 transition-colors uppercase tracking-widest text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      >
                          View Album
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PDF Creative DNA Import</h2>
          <p className="text-white/40 text-sm mt-1">Extract structured Album Bible data directly into the catalog.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload State */}
      {!preview && !extracting && (
        <div className="glass border border-white/10 rounded-3xl p-12 text-center group transition-all duration-300 hover:bg-white/[0.07] relative cursor-pointer overflow-hidden max-w-2xl mx-auto mt-12">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="space-y-6 relative z-0">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    <UploadCloud className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Upload Album Bible PDF</h3>
                    <p className="text-white/40 text-sm max-w-sm mx-auto">
                        Drag and drop a structured PDF, or click to browse. We'll automatically identify themes, visual directions, and track data.
                    </p>
                </div>
                <div className="pt-4">
                    <span className="inline-block px-4 py-2 rounded-full border border-white/10 bg-black/50 text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:border-white/30 transition-colors">
                        PDF format only
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* Extracting/Loading State */}
      {extracting && (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <DNAHelixLoader size="lg" text="Extracting Creative DNA..." />
            <p className="text-xs font-medium text-white/30 max-w-xs text-center animate-pulse">
                Parsing structured metadata, narrative summaries, and track-level semantics...
            </p>
        </div>
      )}

      {/* Review State */}
      {preview && !importing && (
         <div className="animate-in slide-in-from-bottom-8 duration-700">
            <PdfImportReviewTable 
                preview={preview}
                onUpdateTrackStatus={handleUpdateTrackStatus}
                onUpdateTrackField={handleUpdateTrackField}
            />

            <div className="mt-8 flex items-center justify-end gap-4 pt-6 border-t border-white/10">
              <button 
                onClick={() => setPreview(null)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                className="px-8 py-3 rounded-xl bg-purple-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-purple-400 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-2"
              >
                Confirm Import <ChevronRight className="w-4 h-4" />
              </button>
            </div>
         </div>
      )}

      {/* Importing State */}
      {importing && (
         <div className="min-h-[400px] flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <DNAHelixLoader size="lg" text="Merging DNA to Catalog..." />
         </div>
      )}
    </div>
  );
}
