"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlbumService } from "@/services/album-service";
import { 
  CreativeDnaImportService, 
  ImportDiffResult 
} from "@/services/creative-dna-import-service";
import { executeDnaImport } from "@/app/actions/dna-import-actions";
import { AlbumWithSongs } from "@/types";
import { ArrowLeft, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DnaHelixAnimation } from "@/components/dna-import/DnaHelixAnimation";
import { DnaImportReviewTable } from "@/components/dna-import/DnaImportReviewTable";

export default function ImportCreativeDnaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<AlbumWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [diffResult, setDiffResult] = useState<ImportDiffResult | null>(null);
  const [successStatus, setSuccessStatus] = useState(false);

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const albumId = typeof id === "string" ? id : id?.[0];
        if (!albumId) throw new Error("Invalid album ID");
        const data = await AlbumService.getById(albumId);
        if (!data) throw new Error("Album not found");
        setAlbum(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbum();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !album) return;
    
    try {
      setParsing(true);
      setError(null);
      const csvData = await CreativeDnaImportService.parseCsv(file);
      const diff = CreativeDnaImportService.diffImportData(album, csvData);
      setDiffResult(diff);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV");
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!album || !diffResult) return;
    
    try {
      setImporting(true);
      setError(null);
      
      const res = await executeDnaImport(
        album.id, 
        diffResult.albumUpdates, 
        diffResult.songRows
      );
      
      if (!res.success) throw new Error(res.error);
      
      setSuccessStatus(true);
      
      // Navigate back after delay
      setTimeout(() => {
        router.push(`/albums/${album.id}`);
        router.refresh(); // Ensure the server components reload the new data
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || "Import execution failed");
      setImporting(false);
    }
  };

  if (loading) return null;
  if (!album) return <div className="p-8 text-center text-red-500">Album not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/albums/${album.id}`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to {album.title}</span>
        </Link>
      </div>

      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Creative DNA Sync</h1>
        <p className="text-lg text-white/50 leading-relaxed font-serif italic">
          Upload a structured CSV to seamlessly synchronize album aesthetics, era context, and song-level creative identity.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl flex items-center gap-4 text-sm max-w-2xl mx-auto backdrop-blur-md">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* States */}
      {successStatus ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-green-400 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-24 h-24" />
          <h2 className="text-2xl font-bold tracking-tight">Synchronization Complete</h2>
          <p className="text-white/40 text-sm">Validating structure and returning to catalog...</p>
        </div>
      ) : importing || parsing ? (
        <DnaHelixAnimation message={importing ? "Fusing Creative DNA into Catalog..." : "Sequencing CSV Metadata..."} />
      ) : diffResult ? (
        <div className="space-y-8">
          <DnaImportReviewTable diffData={diffResult} />
          
          <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
            <button 
              onClick={() => setDiffResult(null)}
              className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleExecuteImport}
              disabled={diffResult.hasErrors}
              className={`px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-2xl ${
                diffResult.hasErrors 
                  ? 'bg-zinc-800 text-white/30 cursor-not-allowed' 
                  : 'bg-white text-black hover:scale-[1.02] hover:shadow-white/20'
              }`}
            >
              Confirm & Mutate DNA
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <label className="cursor-pointer group block">
            <div className="glass aspect-video rounded-[40px] border border-dashed border-white/20 group-hover:border-white/40 group-hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-transform duration-500">
                <UploadCloud className="w-10 h-10 text-white/60 group-hover:text-white" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold tracking-tight">Select CSV Manifest</p>
                <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Supports Album & Track overrides</p>
              </div>
            </div>
            <input 
              type="file" 
              accept=".csv"
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </label>
        </div>
      )}
    </div>
  );
}
